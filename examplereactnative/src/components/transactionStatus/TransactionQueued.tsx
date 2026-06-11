import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionQueuedProps {
  goBack?: () => void;
}

export const TransactionQueued = (props: TransactionQueuedProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >

      <View style={styles.contentContainer}>
        <Text style={styles.clockEmoji}>⏳</Text>
        <Text style={styles.title}>Transaction is Queued</Text>
        <Text style={styles.subtitle}>Will be processed later</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={props.goBack}
          activeOpacity={0.7}
        >
          <Text style={styles.goBackText}>Go Back</Text>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  clockEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  goBackText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
