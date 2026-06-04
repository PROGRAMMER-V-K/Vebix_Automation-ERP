/**
 * Modal to import inventory items from a Google Sheet.
 * Shares sheet via "Anyone with the link can view" export.
 * Checks for duplicates against existing items (based on Invoice + Name + Project)
 * and processes imports rapidly using Firestore batch writing.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { InventoryItem, NewInventoryItem } from '@/types/inventory';

type GoogleSheetImportModalProps = {
  visible: boolean;
  onClose: () => void;
  existingItems: InventoryItem[];
  onImport: (items: NewInventoryItem[]) => Promise<{ ok: boolean; message?: string }>;
};

// Robust custom CSV parser (no external dependencies, safe on all platforms)
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentValue.trim());
      if (row.length > 0 && row.some(cell => cell !== '')) {
        lines.push(row);
      }
      row = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  if (currentValue || row.length > 0) {
    row.push(currentValue.trim());
    if (row.some(cell => cell !== '')) {
      lines.push(row);
    }
  }
  return lines;
}

function normalizeDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const clean = rawDate.trim();
  return clean || new Date().toISOString().split('T')[0];
}

export function GoogleSheetImportModal({
  visible,
  onClose,
  existingItems,
  onImport,
}: GoogleSheetImportModalProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    imported: number;
    skipped: number;
    reasons: {
      missingName: number;
      duplicate: number;
    };
  } | null>(null);

  // Extract Spreadsheet ID from Google Sheets URL
  function getSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async function handleImport() {
    setError(null);
    setSuccessResult(null);

    const spreadsheetId = getSpreadsheetId(sheetUrl.trim());
    if (!spreadsheetId) {
      setError('Invalid Google Sheet URL. Please verify the link format.');
      return;
    }

    setImporting(true);
    try {
      // 1. Fetch Google Sheet CSV export
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(
          'Failed to retrieve sheet. Make sure sharing is set to "Anyone with the link can view".'
        );
      }

      const csvText = await response.text();
      const parsedRows = parseCSV(csvText);

      if (parsedRows.length <= 1) {
        throw new Error('Spreadsheet appears to be empty or contains no data rows.');
      }

      // 2. Map Column headers (fuzzy matching)
      const headers = parsedRows[0].map((h) => h.toLowerCase().trim());
      const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('product') || h.includes('item'));
      const invoiceIdx = headers.findIndex((h) => h.includes('invoice') || h.includes('inv') || h.includes('bill'));
      const projectIdx = headers.findIndex((h) => h.includes('project') || h.includes('proj') || h.includes('use'));
      const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('rate') || h.includes('cost') || h.includes('amount'));
      
      // Optional columns
      const categoryIdx = headers.findIndex((h) => h.includes('category') || h.includes('type') || h.includes('cat'));
      const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity') || h.includes('stock') || h.includes('count'));
      const codeIdx = headers.findIndex((h) => h.includes('code') || h.includes('sku') || h.includes('id'));
      let dateIdx = headers.findIndex(
        (h) =>
          h.includes('date') ||
          h.includes('day') ||
          h.includes('time') ||
          h.includes('dt') ||
          h.includes('dated') ||
          h.includes('when') ||
          h.includes('timestamp') ||
          h.includes('created') ||
          h.includes('added')
      );

      // Value-based Fallback Scanner:
      // If dateIdx is not found via headers, check cell values of the first few rows 
      // to identify which column contains date values (e.g. DD/MM/YY, YYYY-MM-DD etc.)
      if (dateIdx === -1) {
        const dateRegex = /^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
        const colDateVotes = new Array(headers.length).fill(0);
        const scanLimit = Math.min(parsedRows.length, 6); // Scan up to 5 data rows
        
        for (let r = 1; r < scanLimit; r++) {
          const row = parsedRows[r];
          if (!row) continue;
          for (let c = 0; c < row.length; c++) {
            const val = (row[c] || '').trim();
            if (dateRegex.test(val)) {
              colDateVotes[c]++;
            }
          }
        }
        
        let maxVotes = 0;
        let bestCol = -1;
        for (let c = 0; c < colDateVotes.length; c++) {
          if (colDateVotes[c] > maxVotes) {
            maxVotes = colDateVotes[c];
            bestCol = c;
          }
        }
        
        if (bestCol !== -1 && maxVotes >= 1) {
          dateIdx = bestCol;
          console.log(`[GoogleSheetImport] Auto-detected date column by contents at column index: ${bestCol} (${headers[bestCol]})`);
        }
      }

      console.log('CSV Import - Parsed Headers:', headers);
      console.log('CSV Import - Mapped Indices:', {
        nameIdx,
        invoiceIdx,
        projectIdx,
        priceIdx,
        categoryIdx,
        qtyIdx,
        codeIdx,
        dateIdx,
      });

      if (nameIdx === -1 || invoiceIdx === -1 || projectIdx === -1 || priceIdx === -1) {
        throw new Error(
          'Could not find required headers in the first row. Please ensure columns for "Product Name", "Invoice No", "Project", and "Price" exist.'
        );
      }

      // Create a set of existing keys for speed: O(1) checks
      const existingKeys = new Set(
        existingItems.map(
          (item) =>
            `${item.invoiceNo.toLowerCase().trim()}_${item.name.toLowerCase().trim()}_${item.project.toLowerCase().trim()}`
        )
      );

      const itemsToImport: NewInventoryItem[] = [];
      const seenInSheet = new Set<string>();
      let skippedCount = 0;
      let missingNameCount = 0;
      let duplicateCount = 0;

      // 3. Process CSV rows
      for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        
        if (!row || row.length === 0) {
          continue;
        }

        const name = row[nameIdx] ? row[nameIdx].trim() : '';
        const invoiceNo = row[invoiceIdx] ? row[invoiceIdx].trim() : '';
        const project = row[projectIdx] ? row[projectIdx].trim() : '';
        const rawPrice = row[priceIdx] ? row[priceIdx].replace(/[$,\s]/g, '') : '';
        const price = parseFloat(rawPrice);

        // Required field validation (only skip if name is blank)
        if (!name) {
          skippedCount++;
          missingNameCount++;
          continue;
        }

        const finalInvoiceNo = invoiceNo || '—';
        const finalProject = project || 'General';
        const finalPrice = isNaN(price) ? 0 : price;

        const key = `${finalInvoiceNo.toLowerCase().trim()}_${name.toLowerCase().trim()}_${finalProject.toLowerCase().trim()}`;

        // De-duplication check: Skip if already in Firestore or duplicated in the uploaded CSV
        if (existingKeys.has(key) || seenInSheet.has(key)) {
          skippedCount++;
          duplicateCount++;
          continue;
        }

        seenInSheet.add(key);

        // Read optional values safely
        const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : 'General';
        const rawQty = qtyIdx !== -1 && row[qtyIdx] ? parseInt(row[qtyIdx].replace(/\D/g, ''), 10) : 1;
        const quantity = isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty;
        const code = codeIdx !== -1 && row[codeIdx] ? row[codeIdx].trim() : `INV-${Math.floor(10000 + Math.random() * 90000)}`;
        const dateVal = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : '';
        const date = normalizeDate(dateVal);

        itemsToImport.push({
          name,
          invoiceNo: finalInvoiceNo,
          project: finalProject,
          price: finalPrice,
          category,
          quantity,
          code,
          date,
        });
      }

      if (itemsToImport.length === 0) {
        setSuccessResult({
          imported: 0,
          skipped: skippedCount,
          reasons: { missingName: missingNameCount, duplicate: duplicateCount },
        });
        setImporting(false);
        return;
      }

      // 4. Batch write to database
      const result = await onImport(itemsToImport);
      if (result.ok) {
        setSuccessResult({
          imported: itemsToImport.length,
          skipped: skippedCount,
          reasons: { missingName: missingNameCount, duplicate: duplicateCount },
        });
        setSheetUrl('');
      } else {
        setError(result.message || 'Error occurred during database insertion.');
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('failed to load')) {
        setError(
          'Failed to read spreadsheet. Please ensure your Google Sheet sharing is set to "Anyone with the link can view". Private spreadsheets cannot be imported due to browser security restrictions.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while importing.');
      }
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setError(null);
    setSuccessResult(null);
    setSheetUrl('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Google Sheets Integration</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={HorizonColors.text} />
            </Pressable>
          </View>

          {/* Body Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            
            <Text style={styles.instructions}>
              Sync spreadsheet records directly into your Firestore ERP database with automatic deduplication.
            </Text>

            {/* Steps / Prerequisites */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <MaterialIcons name="share" size={16} color={HorizonColors.primary} />
                <Text style={styles.infoText}>
                  Set sharing to <Text style={{ fontWeight: '700' }}>&quot;Anyone with the link can view&quot;</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="view-column" size={16} color={HorizonColors.primary} />
                <Text style={styles.infoText}>
                  Required column headers: <Text style={{ fontWeight: '600' }}>Product Name</Text>, <Text style={{ fontWeight: '600' }}>Invoice No</Text>, <Text style={{ fontWeight: '600' }}>Project</Text>, <Text style={{ fontWeight: '600' }}>Price</Text>.
                </Text>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successResult ? (
              <View style={styles.successBox}>
                <MaterialIcons name="check-circle-outline" size={22} color={HorizonColors.success} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Import completed successfully!</Text>
                  <Text style={styles.successSub}>
                    Successfully added <Text style={{ fontWeight: '700' }}>{successResult.imported}</Text> new items to inventory.
                  </Text>
                  {successResult.skipped > 0 ? (
                    <View style={styles.skippedBreakdown}>
                      <Text style={styles.skippedBreakdownTitle}>Skipped rows summary:</Text>
                      {successResult.reasons.duplicate > 0 ? (
                        <Text style={styles.skippedReasonItem}>
                          • {successResult.reasons.duplicate} duplicate items (already exist in database or sheet)
                        </Text>
                      ) : null}
                      {successResult.reasons.missingName > 0 ? (
                        <Text style={styles.skippedReasonItem}>
                          • {successResult.reasons.missingName} rows missing a Product Name
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* URL Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Paste Google Sheet URL</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                placeholderTextColor={HorizonColors.textMuted}
                value={sheetUrl}
                onChangeText={(val) => {
                  setSheetUrl(val);
                  if (error) setError(null);
                  if (successResult) setSuccessResult(null);
                }}
                editable={!importing}
                autoCapitalize="none"
                autoComplete="off"
              />
            </View>

          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleClose}
              disabled={importing}
              style={[styles.btn, styles.cancelBtn]}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </Pressable>
            
            {successResult ? null : (
              <Pressable
                onPress={handleImport}
                disabled={importing || !sheetUrl.trim()}
                style={({ pressed }) => [
                  styles.btn,
                  styles.importBtn,
                  (importing || !sheetUrl.trim()) && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}>
                {importing ? (
                  <ActivityIndicator size="small" color={HorizonColors.white} />
                ) : (
                  <>
                    <MaterialIcons name="cloud-download" size={18} color={HorizonColors.white} />
                    <Text style={styles.importBtnText}>Import Sheet</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 58, 95, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: HorizonColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: HorizonColors.text,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  instructions: {
    fontSize: 14,
    color: HorizonColors.textMuted,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: HorizonColors.primaryLight,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: HorizonColors.text,
    lineHeight: 18,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: HorizonColors.successLight,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HorizonColors.success,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: HorizonColors.success,
    marginBottom: 4,
  },
  successSub: {
    fontSize: 13,
    color: HorizonColors.text,
    lineHeight: 18,
  },
  skippedBreakdown: {
    marginTop: 8,
    gap: 2,
  },
  skippedBreakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  skippedReasonItem: {
    fontSize: 12,
    color: '#166534',
    opacity: 0.9,
  },
  field: {
    gap: 6,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: HorizonColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: HorizonColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: HorizonColors.text,
    backgroundColor: '#FAFBFD',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: HorizonColors.border,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: HorizonColors.textMuted,
  },
  importBtn: {
    backgroundColor: HorizonColors.primary,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: HorizonColors.white,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
