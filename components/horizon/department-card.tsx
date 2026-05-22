/** Tappable card linking to a department route from the home screen. */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';

type DepartmentCardProps = {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
};

export function DepartmentCard({ title, icon, onPress }: DepartmentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon} size={22} color={HorizonColors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <MaterialIcons name="chevron-right" size={22} color={HorizonColors.iconMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HorizonColors.background,
    borderWidth: 1,
    borderColor: HorizonColors.cardBorder,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.92,
    backgroundColor: HorizonColors.primaryLight,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HorizonColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: HorizonColors.text,
  },
});
