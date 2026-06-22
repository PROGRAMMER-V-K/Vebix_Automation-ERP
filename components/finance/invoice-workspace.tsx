import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Print from 'expo-print';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { generateNextInvoiceId } from '@/lib/finance-firestore';
import { Invoice, LineItem } from '@/types/finance';

// Helper to generate the print HTML matching the Vebix/Vebix sample PO style exactly but for Invoices
export function generateInvoiceHtml(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>): string {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const rowsHtml = invoice.items.map((item, idx) => `
    <tr>
      <td style="text-align: center; border-right: 1px solid #c0c0c0; border-bottom: 1px solid #c0c0c0; padding: 6px;">${idx + 1}</td>
      <td style="border-right: 1px solid #c0c0c0; border-bottom: 1px solid #c0c0c0; padding: 6px;">${item.description}</td>
      <td style="text-align: center; border-right: 1px solid #c0c0c0; border-bottom: 1px solid #c0c0c0; padding: 6px;">${item.quantity}</td>
      <td style="text-align: right; border-right: 1px solid #c0c0c0; border-bottom: 1px solid #c0c0c0; padding: 6px;">${formatCurrency(item.rate)}</td>
      <td style="text-align: right; border-bottom: 1px solid #c0c0c0; padding: 6px;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tax Invoice - ${invoice.invoiceId}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1e3a5f;
          font-size: 11px;
          line-height: 1.4;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #c0c0c0;
          padding: 20px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #1e3a5f;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e3a5f;
          margin: 0 0 5px 0;
        }
        .company-details {
          color: #475569;
          font-size: 10px;
          margin: 0;
        }
        .invoice-title-block {
          text-align: right;
        }
        .invoice-title {
          font-size: 22px;
          font-weight: bold;
          color: #1d4ed8;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        }
        .invoice-meta-table {
          border-collapse: collapse;
          width: 220px;
          margin-left: auto;
        }
        .invoice-meta-table td {
          border: 1px solid #c0c0c0;
          padding: 4px 8px;
          font-size: 10px;
        }
        .invoice-meta-label {
          font-weight: bold;
          background-color: #f1f5f9;
          text-align: left;
        }
        
        .client-ship-to {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }
        .client-block, .ship-to-block {
          flex: 1;
          border: 1px solid #c0c0c0;
        }
        .block-header {
          background-color: #1e3a5f;
          color: #ffffff;
          padding: 5px 10px;
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
          text-align: center;
        }
        .block-content {
          padding: 8px;
          font-size: 10px;
          min-height: 70px;
        }
        
        .logistics-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .logistics-table th {
          background-color: #1e3a5f;
          color: #ffffff;
          font-size: 9px;
          text-transform: uppercase;
          font-weight: bold;
          padding: 5px 8px;
          border: 1px solid #1e3a5f;
          text-align: left;
        }
        .logistics-table td {
          border: 1px solid #c0c0c0;
          padding: 6px 8px;
          font-size: 10px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .items-table th {
          background-color: #1e3a5f;
          color: #ffffff;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: bold;
          padding: 6px;
          border: 1px solid #1e3a5f;
        }
        
        .footer-section {
          display: flex;
          gap: 20px;
        }
        .comments-block {
          flex: 1.2;
        }
        .comments-header {
          background-color: #748297;
          color: #ffffff;
          padding: 5px 10px;
          font-weight: bold;
          font-size: 10px;
        }
        .comments-content {
          border: 1px solid #c0c0c0;
          border-top: none;
          padding: 8px;
          font-size: 10px;
          min-height: 70px;
          white-space: pre-wrap;
        }
        .pricing-block {
          flex: 0.8;
        }
        .pricing-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pricing-table td {
          border: 1px solid #c0c0c0;
          padding: 5px 8px;
          font-size: 10px;
        }
        .pricing-label {
          font-weight: bold;
          background-color: #f1f5f9;
        }
        .pricing-val {
          text-align: right;
        }
        .total-row {
          background-color: #1e3a5f;
          color: #ffffff;
          font-weight: bold;
          font-size: 11px;
        }
        
        .signatory-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .signatory-box {
          width: 180px;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #1e3a5f;
          padding-top: 4px;
        }
        
        .footer-questions {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: center;
          font-size: 10px;
          color: #475569;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Top header block -->
        <div class="header-top">
          <div>
            <div class="company-title">${invoice.shipToName || 'Vebix AUTOMATION'}</div>
            <div class="company-details">
              Address: ${invoice.shipToAddress || ''}<br>
              Contact: ${invoice.shipToContact || ''} | Email: ${invoice.shipToEmail || ''}<br>
              GST NO.: 27AZBPA0013H1Z8
            </div>
          </div>
          <div class="invoice-title-block">
            <div class="invoice-title">Tax Invoice</div>
            <table class="invoice-meta-table">
              <tr>
                <td class="invoice-meta-label">DATE</td>
                <td>${invoice.date}</td>
              </tr>
              <tr>
                <td class="invoice-meta-label">INVOICE NO.</td>
                <td style="font-weight: bold;">${invoice.invoiceId}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Client & Ship To block -->
        <div class="client-ship-to">
          <div class="client-block">
            <div class="block-header">Bill To / Client</div>
            <div class="block-content">
              <strong>${invoice.clientName || '—'}</strong><br>
              ${invoice.clientAddress ? invoice.clientAddress.replace(/\n/g, '<br>') : '—'}<br>
              ${invoice.clientContact ? 'Contact: ' + invoice.clientContact : ''} ${invoice.clientEmail ? '| Email: ' + invoice.clientEmail : ''}
            </div>
          </div>
          <div class="ship-to-block">
            <div class="block-header">Ship To</div>
            <div class="block-content">
              <strong>${invoice.shipToName}</strong><br>
              ${invoice.shipToAddress ? invoice.shipToAddress.replace(/\n/g, '<br>') : ''}<br>
              Contact: ${invoice.shipToContact} | Email: ${invoice.shipToEmail}
            </div>
          </div>
        </div>

        <!-- Logistics info grid -->
        <table class="logistics-table">
          <thead>
            <tr>
              <th>REQUISITIONER</th>
              <th>SHIP VIA</th>
              <th>SHIPPING TERMS</th>
              <th>DUE DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.requisitioner || '&nbsp;'}</td>
              <td>${invoice.shipVia || '&nbsp;'}</td>
              <td>${invoice.shippingTerms || '&nbsp;'}</td>
              <td><strong>${invoice.dueDate || '&nbsp;'}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 60px; text-align: center;">ITEM NO.</th>
              <th>DESCRIPTION</th>
              <th style="width: 70px; text-align: center;">QTY</th>
              <th style="width: 110px; text-align: right;">UNIT PRICE</th>
              <th style="width: 120px; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 10px; color: #94a3b8;">No items added</td></tr>'}
          </tbody>
        </table>

        <!-- Footer details (Comments + Totals) -->
        <div class="footer-section">
          <div class="comments-block">
            <div class="comments-header">Comments or Special Instructions</div>
            <div class="comments-content">${invoice.comments ? invoice.comments.replace(/\n/g, '<br>') : 'Thank you for your business!<br>Payment is due within the specified period.'}</div>
          </div>
          <div class="pricing-block">
            <table class="pricing-table">
              <tr>
                <td class="pricing-label">SUBTOTAL</td>
                <td class="pricing-val">${formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td class="pricing-label">TAX (${invoice.gstRate}%)</td>
                <td class="pricing-val">${formatCurrency(invoice.gstAmount)}</td>
              </tr>
              <tr>
                <td class="pricing-label">SHIPPING</td>
                <td class="pricing-val">${invoice.shippingAmount && invoice.shippingAmount > 0 ? formatCurrency(invoice.shippingAmount) : '-'}</td>
              </tr>
              <tr>
                <td class="pricing-label">OTHER</td>
                <td class="pricing-val">${invoice.otherAmount && invoice.otherAmount > 0 ? formatCurrency(invoice.otherAmount) : '-'}</td>
              </tr>
              <tr class="total-row">
                <td style="border: 1px solid #1e3a5f;">TOTAL</td>
                <td style="border: 1px solid #1e3a5f; text-align: right;">₹ ${formatCurrency(invoice.total)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Authorized signatory -->
        <div class="signatory-row">
          <div class="signatory-box">Authorized signatory</div>
        </div>

        <!-- Support questions block -->
        <div class="footer-questions" style="bottom: 0; position: fixed; width: 100%; padding-bottom: 20px;">
          If you have any questions about this invoice, please contact<br>
          <strong>Vebix Automation LLP, 9702820020, vebixauto@gmail.com</strong>
        </div>
      </div>
    </body>
    </html>
  `;
}

type InvoiceWorkspaceProps = {
  editingItem: Invoice | null;
  onClose: () => void;
  onSave: (invoiceData: any) => Promise<{ ok: boolean; message?: string }>;
};

export function InvoiceWorkspace({ editingItem, onClose, onSave }: InvoiceWorkspaceProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [mobileActiveTab, setMobileActiveTab] = useState<'form' | 'preview'>('form');
  const [saving, setSaving] = useState(false);

  // --- Invoice Form Fields State ---
  const [invoiceId, setInvoiceId] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [shipToName, setShipToName] = useState('Vebix AUTOMATION');
  const [shipToAddress, setShipToAddress] = useState(
    'A201, TIVONA APARTMENT, PAN CARD CLUB ROAD, BANER, PUNE, MAHARASHTRA, INDIA, 411045'
  );
  const [shipToContact, setShipToContact] = useState('9702820020');
  const [shipToEmail, setShipToEmail] = useState('Vebixuto1980@gmail.com');

  const [requisitioner, setRequisitioner] = useState('Purchase Department');
  const [shipVia, setShipVia] = useState('Road Transport');
  const [fob, setFob] = useState('Supplier');
  const [shippingTerms, setShippingTerms] = useState(
    'Freight packaging, Handling and Transportation included in unit price'
  );

  const [items, setItems] = useState<LineItem[]>([
  
  ]);

  const [gstRate, setGstRate] = useState(18); // default 18% GST
  const [shippingAmount, setShippingAmount] = useState(0);
  const [otherAmount, setOtherAmount] = useState(0);

  const [comments, setComments] = useState(
    'Thank you for your business!\nPayment is due within 15 days of invoice date\nBank Details:\nVebix Automation LLP\nAccount No: 1234567890\nIFSC: HDFC0001234'
  );

  // Initialize fields on mount or when editing item shifts
  useEffect(() => {
    if (editingItem) {
      setInvoiceId(editingItem.invoiceId);
      setDate(editingItem.date);
      setDueDate(editingItem.dueDate);
      setClientName(editingItem.clientName);
      setClientAddress(editingItem.clientAddress || '');
      setClientContact(editingItem.clientContact || '');
      setClientEmail(editingItem.clientEmail);

      setShipToName(editingItem.shipToName || 'Vebix AUTOMATION');
      setShipToAddress(editingItem.shipToAddress || 'A201, TIVONA APARTMENT, PAN CARD CLUB ROAD, BANER, PUNE, MAHARASHTRA, INDIA, 411045');
      setShipToContact(editingItem.shipToContact || '9702820020');
      setShipToEmail(editingItem.shipToEmail || 'Vebixuto1980@gmail.com');

      setRequisitioner(editingItem.requisitioner || 'Purchase Department');
      setShipVia(editingItem.shipVia || 'Road Transport');
      setFob(editingItem.fob || 'Supplier');
      setShippingTerms(editingItem.shippingTerms || 'Freight packaging, Handling and Transportation included in unit price');

      setItems(editingItem.items || []);
      setGstRate(editingItem.gstRate);
      setShippingAmount(editingItem.shippingAmount || 0);
      setOtherAmount(editingItem.otherAmount || 0);
      setComments(editingItem.comments || 'Thank you for your business!');
    } else {
      // Auto generate Invoice ID
      generateNextInvoiceId().then((nextId) => setInvoiceId(nextId));

      const today = new Date().toISOString().split('T')[0];
      setDate(today);

      const defaultDue = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default 15 days due
      setDueDate(defaultDue);
    }
  }, [editingItem]);

  // Compute Subtotal and Totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [items]);

  const gstAmount = useMemo(() => {
    return (subtotal * gstRate) / 100;
  }, [subtotal, gstRate]);

  const total = useMemo(() => {
    return subtotal + gstAmount + shippingAmount + otherAmount;
  }, [subtotal, gstAmount, shippingAmount, otherAmount]);

  // Add Item Row
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Change Item Fields
  const handleItemChange = (index: number, field: keyof LineItem, val: string | number) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'description') {
      item.description = String(val);
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(val) || 0);
      item.amount = item.quantity * item.rate;
    } else if (field === 'rate') {
      item.rate = Math.max(0, Number(val) || 0);
      item.amount = item.quantity * item.rate;
    }

    updated[index] = item;
    setItems(updated);
  };

  const getInvoiceData = () => {
    return {
      invoiceId,
      date,
      dueDate,
      clientName,
      clientAddress,
      clientContact,
      clientEmail,
      shipToName,
      shipToAddress,
      shipToContact,
      shipToEmail,
      requisitioner,
      shipVia,
      fob,
      shippingTerms,
      items: items.map(item => ({
        description: item.description || 'unnamed item',
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      })),
      subtotal,
      gstRate,
      gstAmount,
      shippingAmount,
      otherAmount,
      total,
      comments,
      status: editingItem ? editingItem.status : 'Draft',
    };
  };

  // Build PDF / Print Action
  const handlePrint = async () => {
    if (!clientName.trim()) {
      Alert.alert('Validation Error', 'Please specify a Client Name.');
      return;
    }
    const htmlContent = generateInvoiceHtml(getInvoiceData());
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert('Pop-up Blocked', 'Please allow pop-ups for this site to print PDF.');
        }
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (err) {
      Alert.alert('Printing Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Save Document to Firebase DB
  const handleSave = async () => {
    if (!clientName.trim()) {
      Alert.alert('Validation Error', 'Please specify a Client Name.');
      return;
    }
    if (items.length === 0 || items.some(item => !item.description.trim())) {
      Alert.alert('Validation Error', 'Please add at least one item and fill out descriptions.');
      return;
    }

    setSaving(true);
    const invoiceData = getInvoiceData();
    const res = await onSave(invoiceData);
    setSaving(false);

    if (res.ok) {
      onClose();
    } else {
      Alert.alert('Error Saving Invoice', res.message || 'Database write failed.');
    }
  };

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // --- RENDERING CHILD SEGMENTS ---

  const renderFormInputs = () => (
    <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.formSectionTitle}>1. Invoice Metadata</Text>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Invoice ID (Auto-Generated)</Text>
          <TextInput style={styles.textInput} value={invoiceId} onChangeText={setInvoiceId} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.textInput} value={date} onChangeText={setDate} />
        </View>
      </View>
      <View style={styles.formField}>
        <Text style={styles.inputLabel}>Due Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.textInput} value={dueDate} onChangeText={setDueDate} />
      </View>

      <Text style={styles.formSectionTitle}>2. Bill To / Client Details</Text>
      <View style={styles.formField}>
        <Text style={styles.inputLabel}>Client Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Acme Corporation"
          value={clientName}
          onChangeText={setClientName}
        />
      </View>
      <View style={styles.formField}>
        <Text style={styles.inputLabel}>Client Address</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          multiline
          placeholder="Street, City, State, Country..."
          value={clientAddress}
          onChangeText={setClientAddress}
        />
      </View>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Contact Phone</Text>
          <TextInput style={styles.textInput} placeholder="e.g. +91 98765" value={clientContact} onChangeText={setClientContact} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput style={styles.textInput} placeholder="client@email.com" value={clientEmail} onChangeText={setClientEmail} />
        </View>
      </View>

      <Text style={styles.formSectionTitle}>3. Shipping & Destination Company</Text>
      <View style={styles.formField}>
        <Text style={styles.inputLabel}>Company Name</Text>
        <TextInput style={styles.textInput} value={shipToName} onChangeText={setShipToName} />
      </View>
      <View style={styles.formField}>
        <Text style={styles.inputLabel}>Company Address</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          multiline
          value={shipToAddress}
          onChangeText={setShipToAddress}
        />
      </View>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Contact</Text>
          <TextInput style={styles.textInput} value={shipToContact} onChangeText={setShipToContact} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.textInput} value={shipToEmail} onChangeText={setShipToEmail} />
        </View>
      </View>

      <Text style={styles.formSectionTitle}>4. Logistics Info</Text>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Requisitioner</Text>
          <TextInput style={styles.textInput} value={requisitioner} onChangeText={setRequisitioner} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Ship Via</Text>
          <TextInput style={styles.textInput} value={shipVia} onChangeText={setShipVia} />
        </View>
      </View>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>FOB</Text>
          <TextInput style={styles.textInput} value={fob} onChangeText={setFob} />
        </View>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Shipping Terms</Text>
          <TextInput style={styles.textInput} value={shippingTerms} onChangeText={setShippingTerms} />
        </View>
      </View>

      <Text style={styles.formSectionTitle}>5. Items Spreadsheet Editor</Text>
      <View style={styles.spreadsheetContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.spreadsheetRow}>
            <View style={styles.rowNumberCol}>
              <Text style={styles.rowNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.rowDescCol}>
              <TextInput
                style={styles.sheetInput}
                placeholder="Item Description"
                value={item.description}
                onChangeText={(val) => handleItemChange(index, 'description', val)}
              />
            </View>
            <View style={styles.rowQtyCol}>
              <TextInput
                style={[styles.sheetInput, { textAlign: 'center' }]}
                keyboardType="numeric"
                value={String(item.quantity)}
                onChangeText={(val) => handleItemChange(index, 'quantity', val)}
              />
            </View>
            <View style={styles.rowPriceCol}>
              <TextInput
                style={[styles.sheetInput, { textAlign: 'right' }]}
                keyboardType="numeric"
                value={String(item.rate)}
                onChangeText={(val) => handleItemChange(index, 'rate', val)}
              />
            </View>
            <View style={styles.rowAmountCol}>
              <Text style={styles.rowAmountText}>
                {formatCurrency(item.quantity * item.rate)}
              </Text>
            </View>
            <Pressable style={styles.rowDeleteBtn} onPress={() => handleRemoveItem(index)}>
              <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addItemBtn} onPress={handleAddItem}>
          <MaterialIcons name="add" size={16} color={HorizonColors.primary} />
          <Text style={styles.addItemBtnText}>Add Line Item</Text>
        </Pressable>
      </View>

      <Text style={styles.formSectionTitle}>6. Charges & Taxes</Text>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>GST Tax Rate (%)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={String(gstRate)}
            onChangeText={(val) => setGstRate(Number(val) || 0)}
          />
        </View>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Shipping Charge (₹)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={String(shippingAmount)}
            onChangeText={(val) => setShippingAmount(Number(val) || 0)}
          />
        </View>
      </View>
      <View style={styles.formField}>
        <Text style={styles.inputLabel}>Other Charges (₹)</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          value={String(otherAmount)}
          onChangeText={(val) => setOtherAmount(Number(val) || 0)}
        />
      </View>

      <Text style={styles.formSectionTitle}>7. Comments & Special Instructions</Text>
      <View style={styles.formField}>
        <TextInput
          style={[styles.textInput, styles.commentsInput]}
          multiline
          value={comments}
          onChangeText={setComments}
        />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderA4Preview = () => (
    <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.a4Page}>
        {/* Header Block */}
        <View style={styles.poHeader}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.previewBrandTitle}>{shipToName || 'Vebix AUTOMATION'}</Text>
            <Text style={styles.previewBrandDetails}>
              Address: {shipToAddress}{'\n'}
              Contact: {shipToContact} | Email: {shipToEmail}{'\n'}
              GST NO.: 27AZBPA0013H1Z8
            </Text>
          </View>
          <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
            <Text style={styles.previewPoTitle}>TAX INVOICE</Text>
            <View style={styles.previewMetaGrid}>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMetaLabel}>DATE</Text>
                <Text style={styles.previewMetaValue}>{date}</Text>
              </View>
              <View style={[styles.previewMetaRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.previewMetaLabel}>INVOICE NO.</Text>
                <Text style={[styles.previewMetaValue, { fontWeight: '700' }]}>{invoiceId || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Double underline decoration */}
        <View style={styles.doubleUnderline} />

        {/* Client / Ship To Columns */}
        <View style={styles.previewAddressesRow}>
          <View style={styles.previewAddressBlock}>
            <View style={styles.previewBlockHeader}>
              <Text style={styles.previewBlockHeaderText}>BILL TO / CLIENT</Text>
            </View>
            <View style={styles.previewBlockContent}>
              <Text style={styles.boldText} numberOfLines={1}>{clientName || '—'}</Text>
              <Text style={styles.smallText}>{clientAddress || '—'}</Text>
              {clientContact || clientEmail ? (
                <Text style={styles.smallText}>{clientContact} {clientEmail}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.previewAddressBlock}>
            <View style={styles.previewBlockHeader}>
              <Text style={styles.previewBlockHeaderText}>SHIP TO</Text>
            </View>
            <View style={styles.previewBlockContent}>
              <Text style={styles.boldText} numberOfLines={1}>{shipToName}</Text>
              <Text style={styles.smallText}>{shipToAddress}</Text>
              <Text style={styles.smallText}>Contact: {shipToContact} | Email: {shipToEmail}</Text>
            </View>
          </View>
        </View>

        {/* Logistics Information table strip */}
        <View style={styles.previewLogisticsStrip}>
          <View style={styles.logisticsCol}>
            <Text style={styles.logisticsHeader}>REQUISITIONER</Text>
            <Text style={styles.logisticsValue} numberOfLines={1}>{requisitioner || '—'}</Text>
          </View>
          <View style={styles.logisticsCol}>
            <Text style={styles.logisticsHeader}>SHIP VIA</Text>
            <Text style={styles.logisticsValue} numberOfLines={1}>{shipVia || '—'}</Text>
          </View>
          <View style={styles.logisticsCol}>
            <Text style={styles.logisticsHeader}>SHIPPING TERMS</Text>
            <Text style={styles.logisticsValue} numberOfLines={2}>{shippingTerms || '—'}</Text>
          </View>
          <View style={[styles.logisticsCol, { borderRightWidth: 0, flex: 1.2 }]}>
            <Text style={styles.logisticsHeader}>DUE DATE</Text>
            <Text style={[styles.logisticsValue, { fontWeight: '700' }]} numberOfLines={1}>{dueDate || '—'}</Text>
          </View>
        </View>

        {/* Items Grid Table */}
        <View style={styles.previewItemsTable}>
          <View style={styles.previewTableHeader}>
            <Text style={[styles.previewTh, { flex: 0.8, textAlign: 'center' }]}>ITEM NO.</Text>
            <Text style={[styles.previewTh, { flex: 4 }]}>DESCRIPTION</Text>
            <Text style={[styles.previewTh, { flex: 1, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.previewTh, { flex: 1.5, textAlign: 'right' }]}>UNIT PRICE</Text>
            <Text style={[styles.previewTh, { flex: 1.8, textAlign: 'right' }]}>TOTAL</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.previewTableEmpty}>
              <Text style={styles.emptyTableText}>No items added to invoice yet.</Text>
            </View>
          ) : (
            items.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <View key={index} style={[styles.previewTableRow, isEven ? styles.rowEven : styles.rowOdd]}>
                  <Text style={[styles.previewTd, { flex: 0.8, textAlign: 'center' }]}>{index + 1}</Text>
                  <Text style={[styles.previewTd, { flex: 4, fontWeight: '500' }]} numberOfLines={2}>
                    {item.description || 'unnamed item'}
                  </Text>
                  <Text style={[styles.previewTd, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.previewTd, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(item.rate)}</Text>
                  <Text style={[styles.previewTd, { flex: 1.8, textAlign: 'right', fontWeight: '600' }]}>
                    {formatCurrency(item.quantity * item.rate)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Footer info (Comments & Totals) */}
        <View style={styles.previewFooterGrid}>
          <View style={styles.previewCommentsBlock}>
            <View style={styles.previewCommentsHeader}>
              <Text style={styles.previewCommentsHeaderText}>Comments or Special Instructions</Text>
            </View>
            <View style={styles.previewCommentsContent}>
              <Text style={styles.previewCommentsText}>{comments || 'Thank you for your business...'}</Text>
            </View>
          </View>

          <View style={styles.previewTotalsBlock}>
            <View style={styles.totalItemRow}>
              <Text style={styles.totalItemLabel}>SUBTOTAL</Text>
              <Text style={styles.totalItemValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalItemRow}>
              <Text style={styles.totalItemLabel}>TAX ({gstRate}%)</Text>
              <Text style={styles.totalItemValue}>{formatCurrency(gstAmount)}</Text>
            </View>
            <View style={styles.totalItemRow}>
              <Text style={styles.totalItemLabel}>SHIPPING</Text>
              <Text style={styles.totalItemValue}>{shippingAmount > 0 ? formatCurrency(shippingAmount) : '—'}</Text>
            </View>
            <View style={styles.totalItemRow}>
              <Text style={styles.totalItemLabel}>OTHER</Text>
              <Text style={styles.totalItemValue}>{otherAmount > 0 ? formatCurrency(otherAmount) : '—'}</Text>
            </View>
            <View style={styles.previewGrandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Authorized signature placeholder */}
        <View style={styles.previewSignatureRow}>
          <View style={styles.previewSignatureBox}>
            <Text style={styles.signatureText}>Authorized signatory</Text>
          </View>
        </View>

        {/* Centered Contact Info Footer */}
        <View style={styles.previewFooterInfo}>
          <Text style={styles.previewFooterInfoText}>
            If you have any questions about this invoice, please contact{'\n'}
            <Text style={{ fontWeight: '700' }}>Vebix Automation LLP, 9702820020, vebixauto@gmail.com</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header quick actions strip */}
      <View style={styles.workspaceHeader}>
        <View style={styles.headerTitleRow}>
          <Pressable style={styles.backBtn} onPress={onClose} hitSlop={10}>
            <MaterialIcons name="arrow-back" size={20} color={HorizonColors.primary} />
          </Pressable>
          <Text style={styles.workspaceTitle}>
            {editingItem ? 'Edit Invoice' : 'Create Invoice'}
          </Text>
        </View>

        <View style={styles.workspaceHeaderActions}>
          <Pressable style={styles.printBtn} onPress={handlePrint}>
            <MaterialIcons name="print" size={16} color={HorizonColors.primary} />
            <Text style={styles.printBtnText}>Build PDF</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.btnPressed,
              saving && { opacity: 0.7 }
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <MaterialIcons name="save" size={16} color={HorizonColors.white} />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Invoice'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Screen layout dispatcher */}
      {isDesktop ? (
        <View style={styles.desktopLayoutRow}>
          <View style={styles.leftFormColumn}>
            <Text style={styles.colTitle}>Invoice Form Details</Text>
            {renderFormInputs()}
          </View>
          <View style={styles.rightPreviewColumn}>
            <Text style={styles.colTitle}>A4 Document Live Print Preview</Text>
            {renderA4Preview()}
          </View>
        </View>
      ) : isTablet ? (
        <View style={styles.desktopLayoutRow}>
          <View style={{ flex: 1 }}>{renderFormInputs()}</View>
          <View style={{ flex: 1.1, borderLeftWidth: 1, borderLeftColor: HorizonColors.border, paddingLeft: 16 }}>{renderA4Preview()}</View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.mobileWorkspaceTabs}>
            <Pressable
              style={[styles.mobileTabBtn, mobileActiveTab === 'form' && styles.mobileTabBtnActive]}
              onPress={() => setMobileActiveTab('form')}
            >
              <MaterialIcons
                name="edit"
                size={16}
                color={mobileActiveTab === 'form' ? HorizonColors.primary : HorizonColors.textMuted}
              />
              <Text style={[styles.mobileTabText, mobileActiveTab === 'form' && styles.mobileTabTextActive]}>
                Form Builder
              </Text>
            </Pressable>
            <Pressable
              style={[styles.mobileTabBtn, mobileActiveTab === 'preview' && styles.mobileTabBtnActive]}
              onPress={() => setMobileActiveTab('preview')}
            >
              <MaterialIcons
                name="visibility"
                size={16}
                color={mobileActiveTab === 'preview' ? HorizonColors.primary : HorizonColors.textMuted}
              />
              <Text style={[styles.mobileTabText, mobileActiveTab === 'preview' && styles.mobileTabTextActive]}>
                Live Preview
              </Text>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            {mobileActiveTab === 'form' ? renderFormInputs() : renderA4Preview()}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  workspaceHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: HorizonColors.primary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HorizonColors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: HorizonColors.white,
  },
  btnPressed: {
    opacity: 0.85,
  },
  desktopLayoutRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
    padding: 20,
  },
  leftFormColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    padding: 16,
  },
  rightPreviewColumn: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HorizonColors.border,
    padding: 16,
  },
  colTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  formScroll: {
    flex: 1,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: HorizonColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D8E2EF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    color: '#1E3A5F',
    backgroundColor: '#FCFDFE',
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  commentsInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  spreadsheetContainer: {
    borderWidth: 1,
    borderColor: '#D8E2EF',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FCFDFE',
  },
  spreadsheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  rowNumberCol: {
    width: 20,
    alignItems: 'center',
  },
  rowNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  rowDescCol: {
    flex: 3,
    paddingHorizontal: 6,
  },
  rowQtyCol: {
    flex: 0.8,
    paddingHorizontal: 4,
  },
  rowPriceCol: {
    flex: 1.2,
    paddingHorizontal: 4,
  },
  rowAmountCol: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  rowAmountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  sheetInput: {
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    color: '#1E3A5F',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  rowDeleteBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: HorizonColors.primary,
  },
  previewScroll: {
    flex: 1,
    backgroundColor: '#64748B',
    borderRadius: 12,
    padding: 16,
  },
  a4Page: {
    width: '100%',
    aspectRatio: 0.707, // A4 page ratio
    backgroundColor: '#FFFFFF',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  poHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  previewBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A5F',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewBrandDetails: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 12,
  },
  previewPoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 10,
  },
  previewMetaGrid: {
    width: 170,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewMetaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C0C0C0',
  },
  previewMetaLabel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  previewMetaValue: {
    flex: 1.2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8.5,
    color: '#1E3A5F',
  },
  doubleUnderline: {
    height: 4,
    borderTopWidth: 2,
    borderTopColor: '#1E3A5F',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A5F',
    marginBottom: 12,
  },
  previewAddressesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  previewAddressBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewBlockHeader: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 4,
    alignItems: 'center',
  },
  previewBlockHeaderText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewBlockContent: {
    padding: 8,
    minHeight: 60,
  },
  boldText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  smallText: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 11,
  },
  previewLogisticsStrip: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#C0C0C0',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  logisticsCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#C0C0C0',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  logisticsHeader: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#1E3A5F',
    marginHorizontal: -6,
    marginTop: -4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 4,
    textAlign: 'left',
  },
  logisticsValue: {
    fontSize: 8.5,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  previewItemsTable: {
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  previewTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E3A5F',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  previewTh: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  previewTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  previewTd: {
    fontSize: 8.5,
    color: '#1E3A5F',
    paddingVertical: 1,
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#F8FAFC',
  },
  previewTableEmpty: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  previewFooterGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  previewCommentsBlock: {
    flex: 1.2,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewCommentsHeader: {
    backgroundColor: '#748297',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  previewCommentsHeaderText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  previewCommentsContent: {
    padding: 8,
    minHeight: 50,
  },
  previewCommentsText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 11,
  },
  previewTotalsBlock: {
    flex: 0.8,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalItemLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  totalItemValue: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  previewGrandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A5F',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalValue: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewSignatureRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
  },
  previewSignatureBox: {
    width: 140,
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
    paddingTop: 4,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 8,
    color: '#1E3A5F',
  },
  previewFooterInfo: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  previewFooterInfoText: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 11,
  },
  mobileWorkspaceTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: HorizonColors.border,
  },
  mobileTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  mobileTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: HorizonColors.primary,
  },
  mobileTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  mobileTabTextActive: {
    color: HorizonColors.primary,
    fontWeight: '700',
  },
});
