/** Placeholder layout for department pages not yet fully implemented. */
import { StyleSheet, Text, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';

type DepartmentScreenProps = {
  title: string;
  description: string;
};

export function DepartmentScreen({ title, description }: DepartmentScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Workspace coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: HorizonColors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: HorizonColors.textMuted,
    marginBottom: 32,
    lineHeight: 22,
  },
  placeholder: {
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: HorizonColors.primaryLight,
  },
  placeholderText: {
    fontSize: 15,
    color: HorizonColors.textMuted,
  },
});
