import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { PosTerminal } from '../../specs/NativeEcrBridge';
import { useEffect, useRef } from 'react';

interface TerminalCardProps {
  terminal: PosTerminal;
  onPress?: () => void;
}

export const TerminalCard = (props: TerminalCardProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: 40,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: 40,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <TouchableOpacity onPress={props.onPress}>
      <Animated.View
        style={[styles.card, { opacity, transform: [{ translateY }] }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <Text style={styles.cardIconText}>🖥️</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardName} numberOfLines={1}>
              {props.terminal.terminalName}
            </Text>
            <Text style={styles.cardCode}>{props.terminal.terminalCode}</Text>
          </View>
          <Text style={styles.cardFooterValue}>{props.terminal.sourceIp}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const TEAL_BG = '#E1F5EE';
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: TEAL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 14,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#888780',
    letterSpacing: 0.3,
  },
  cardFooterValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1A1A1A',
    fontWeight: '500',
  },
});