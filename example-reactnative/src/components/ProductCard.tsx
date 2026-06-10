import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Product {
  id: number;
  name: string;
  price: number;
  emoji: string;
}

interface ProductCardProps {
  product: Product;
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  qty,
  onDecrement,
  onIncrement,
}) => (
  <View style={styles.card}>
    <View style={styles.cardEmoji}>
      <Text style={styles.emojiText}>{product.emoji}</Text>
    </View>
    <Text style={styles.cardName} numberOfLines={2}>
      {product.name}
    </Text>
    <View style={styles.cardFooter}>
      <Text style={styles.cardPrice}>€{product.price.toFixed(2)}</Text>
      <Stepper qty={qty} onDecrement={onDecrement} onIncrement={onIncrement} />
    </View>
  </View>
);

interface StepperProps {
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
}
const Stepper: React.FC<StepperProps> = ({ qty, onDecrement, onIncrement }) => (
  <View style={styles.stepper}>
    <TouchableOpacity
      style={styles.stepperBtn}
      onPress={onDecrement}
      accessibilityLabel="Remove one"
    >
      <Text style={styles.stepperBtnText}>−</Text>
    </TouchableOpacity>
    <View style={styles.stepperQty}>
      <Text style={styles.stepperQtyText}>{qty}</Text>
    </View>
    <TouchableOpacity
      style={styles.stepperBtn}
      onPress={onIncrement}
      accessibilityLabel="Add one"
    >
      <Text style={styles.stepperBtnText}>+</Text>
    </TouchableOpacity>
  </View>
);

const ACCENT = '#E24B4A';
const BORDER = '#E5E5E5';
const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 12,
    gap: 6,
  },
  cardGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  cardEmoji: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 11,
    color: '#888888',
    lineHeight: 15,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: ACCENT,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 26,
    height: 26,
    backgroundColor: '#F5F5F5',
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  stepperBtnText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  stepperQty: {
    width: 28,
    height: 26,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});