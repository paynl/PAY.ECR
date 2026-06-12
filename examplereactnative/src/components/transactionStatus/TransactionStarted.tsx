import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionStartedProps {
  handleCancel: () => void;
}

export const TransactionStarted = (props: TransactionStartedProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.statusContainer}>
          <ActivityIndicator
            size="large"
            color="#585FFF"
            style={styles.spinner}
          />
          <Text style={styles.title}>Waiting for card input</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={props.handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel Transaction</Text>
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
    paddingHorizontal: 20,
  },

  /* --- Graphic Styles --- */
  readerGraphic: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  cardSlot: {
    width: 100,
    height: 70,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  chip: {
    width: 20,
    height: 15,
    backgroundColor: '#D4AF37', // Gold color for chip
    borderRadius: 3,
    marginBottom: 5, // Slight offset to look like a chip
  },

  /* --- Text Styles --- */
  statusContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  spinner: {
    marginBottom: 10,
  },

  /* --- Button Styles --- */
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 5
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
});
