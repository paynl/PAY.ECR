import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Buffer } from 'buffer';

interface TransactionCompletedProps {
  approved: boolean;
  payerMessage: string;
  orderID?: string;
  receipt?: string;
  goBack?: () => void;
}

export const TransactionCompleted = (props: TransactionCompletedProps) => {
  // Get insets for safe area handling
  const insets = useSafeAreaInsets();

  // Animation values
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: Icon pops in first, then content fades, then button
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderReceipt = () => {
    if (!props.receipt) return null;

    const buff = new Buffer(props.receipt, 'base64');
    const text = buff.toString('utf-8');

    return (
      <View style={styles.receiptContainer}>
        <Text style={styles.receiptLabel}>Receipt</Text>
        <Text style={styles.receiptText}>{text}</Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      {/* --- Main Content Area --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Status Icon */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: iconScale }],
                opacity: iconOpacity,
              },
            ]}
          >
            {/* Background Circle */}
            <View
              style={[
                styles.iconBackground,
                props.approved
                  ? styles.iconBackgroundSuccess
                  : styles.iconBackgroundError,
              ]}
            />

            {/* Icon Circle */}
            <View
              style={[
                styles.iconCircle,
                props.approved
                  ? styles.iconCircleSuccess
                  : styles.iconCircleError,
              ]}
            >
              <Text style={styles.iconEmoji}>
                {props.approved ? '✅' : '❌'}
              </Text>
            </View>
          </Animated.View>

          {/* Status Text */}
          <Animated.View
            style={[styles.textContainer, { opacity: contentOpacity }]}
          >
            <Text
              style={[
                styles.title,
                props.approved ? styles.titleSuccess : styles.titleError,
              ]}
            >
              {props.payerMessage}
            </Text>

            {/* Order ID */}
            {props.approved && props.orderID && (
              <View style={styles.orderIDContainer}>
                <Text style={styles.orderIDLabel}>Order ID</Text>
                <Text style={styles.orderIDValue}>{props.orderID}</Text>
              </View>
            )}
          </Animated.View>

          {/* Receipt */}
          {props.approved && renderReceipt()}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={props.goBack}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  /* --- Icon Animation Styles --- */
  iconWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBackground: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  iconBackgroundSuccess: {
    backgroundColor: '#E8F8EF',
  },
  iconBackgroundError: {
    backgroundColor: '#FEE9E9',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconCircleSuccess: {
    backgroundColor: '#FFFFFF',
  },
  iconCircleError: {
    backgroundColor: '#FFFFFF',
  },
  iconEmoji: {
    fontSize: 50,
  },

  /* --- Text Styles --- */
  textContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleSuccess: {
    color: '#1C1C1E',
  },
  titleError: {
    color: '#FF3B30',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  /* --- Order ID Styles --- */
  orderIDContainer: {
    backgroundColor: '#F5F5F7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  orderIDLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderIDValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  /* --- Receipt Styles --- */
  receiptContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  receiptText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#888780',
    letterSpacing: 0.3,
  },
  receiptImageWrapper: {
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },

  /* --- Amount Styles --- */
  amountContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  amountValueSuccess: {
    color: '#34C759',
  },

  /* --- Reference Styles --- */
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  referenceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  /* --- Button Styles --- */
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#585FFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#8E8E93',
    fontSize: 17,
    fontWeight: '600',
  },
});
