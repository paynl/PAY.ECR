import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import  { CommonActions, StaticScreenProps, useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';
import ChevronLeft from '../components/icons/ChevronLeft';
import NativeEcrBridge, { PosMessage, PosTerminal } from '../../specs/NativeEcrBridge';
import { useLogs } from '../context/LoggingContext';
import PrettyJson from '../components/PrettyJson';
import Slider from '@react-native-community/slider';

type Props = StaticScreenProps<{
  terminal: PosTerminal;
  orderId: string;
  amount: number;
}>;

export const CaptureScreen = ({ route }: Props) => {
  const { orderId: routeOrderId, amount: routeAmount } = route.params;
  const { appendLog } = useLogs();

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [orderId] = useState<string>(routeOrderId); // readonly prop
  const [amount, setAmount] = useState<string>(String(routeAmount)); // readonly prop

  const [credentials, setCredentials] = useState<string | null>(null);
  const [credentialsMasked, setCredentialsMasked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const lock = useRef(false);

  const handleQrRead = useCallback((event: any) => {
    if (lock.current) return;
    const value: string | undefined = event?.nativeEvent?.codeStringValue ?? event?.codeStringValue;
    if (!value) return;

    lock.current = true;
    try {
      const creds = value.trim();
      setCredentials(creds);
      setCredentialsMasked(creds.substring(0, 21) + '*****' + creds.substring(creds.length - 10));
      setError(null);
      setShowScanner(false);
    } catch (e: any) {
      Alert.alert('Invalid QR', e?.message ?? 'Could not parse credentials');
    } finally {
      setTimeout(() => (lock.current = false), 1000);
    }
  }, []);

  const handleCapture = async () => {
    if (!credentials) {
      return;
    }

    setLoading(true);

    const buff = new Buffer(credentials, 'utf8');
    console.log(`Basic ${buff.toString('base64')}`);
    console.log(JSON.stringify({ amount: parseFloat(amount) * 100 }));

    const response = await fetch(`https://rest.pay.nl/v2/transactions/${orderId}/capture`, {
      method: 'PATCH',
      headers: { Authorization: `Basic ${buff.toString('base64')}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) * 100 }),
    });
    const responseBody = await response.text();
    console.log(responseBody);
    setResponse(responseBody);
    setLoading(false);
    setError(response.status >= 400 ? 'Failed to capture transaction' : null);
  };

  const resetBack = () => {
    const message: PosMessage = {
      type: 'ORDER_CREATE',
      service: undefined,
      transaction: {
        type: 'PAYMENT',
        amount: { value: 0, currency: 'EUR' },
        description: undefined,
        reference: undefined,
        order: {
          products: [],
        },
      },
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message).then(() => {
      navigation.dispatch(
        CommonActions.reset({
          routes: [{ name: 'Discovery' }, { name: 'Ecr', params: { terminal: route.params.terminal } }],
        }),
      );
    });
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={{ gap: 10, flexDirection: 'row' }} onPress={resetBack}>
            <ChevronLeft />
            <Text style={styles.title}>Capture Transaction</Text>
          </TouchableOpacity>

          {/* Credentials */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>API Credentials</Text>
              <TouchableOpacity onPress={() => setShowScanner(s => !s)}>
                <Text style={styles.linkText}>{showScanner ? 'Hide scanner' : credentials ? 'Rescan QR' : 'Scan QR'}</Text>
              </TouchableOpacity>
            </View>

            {showScanner && (
              <View style={styles.scannerWrap}>
                <Camera
                  style={styles.camera}
                  cameraType={CameraType.Back}
                  scanBarcode
                  onReadCode={handleQrRead}
                  showFrame
                  laserColor="#1f6feb"
                  frameColor="#1f6feb"
                />
                <Text style={styles.scannerHint}>Point at a QR containing your ApiToken</Text>
              </View>
            )}

            {credentials ? <Text style={styles.bold}>{credentialsMasked}</Text> : <Text style={styles.muted}>No credentials loaded yet.</Text>}
          </View>

          {/* Transaction (read-only) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transaction</Text>

            <Text style={styles.label}>Order ID</Text>
            <View style={[styles.input, styles.readonlyBox]}>
              <Text style={styles.readonlyText} numberOfLines={1}>
                {orderId}
              </Text>
            </View>

            <Text style={styles.label}>Amount to capture</Text>
            <View style={[styles.input, styles.readonlyBox]}>
              <Text style={styles.readonlyText}>{amount}</Text>
            </View>

            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0.01}
              maximumValue={routeAmount}
              step={0.01}
              minimumTrackTintColor="#1f6feb"
              maximumTrackTintColor="#1f2328"
              thumbSize={26}
              onValueChange={(x) => setAmount(x.toFixed(2))}
            />

            <TouchableOpacity
              style={[styles.button, (loading || !credentials) && styles.buttonDisabled]}
              onPress={handleCapture}
              disabled={loading || !credentials}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Capture</Text>}
            </TouchableOpacity>

            {error && <Text style={styles.error}>{error}</Text>}

            {response && <PrettyJson data={response} />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fa' },
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 24 },

  title: {
    color: '#1f2328',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d0d7de',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  sectionTitle: {
    color: '#1f2328',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  scannerWrap: { marginVertical: 8 },
  camera: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
  },
  scannerHint: {
    color: '#57606a',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  credsBox: {
    backgroundColor: '#f6f8fa',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  credsText: { color: '#1f2328', fontSize: 13, marginVertical: 2 },
  bold: { fontWeight: '700', color: '#0d1117' },
  muted: { color: '#57606a', fontSize: 13 },

  label: {
    color: '#1f2328',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
    fontWeight: '500',
  },

  input: {
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    padding: 12,
    color: '#1f2328',
    fontSize: 16,
  },
  readonlyBox: { justifyContent: 'center' },
  readonlyText: { color: '#1f2328', fontSize: 16 },

  button: {
    backgroundColor: '#1f6feb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  error: {
    color: '#cf222e',
    marginTop: 12,
    fontSize: 13,
  },

  responseBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#2da44e',
  },
  success: { color: '#1a7f37', fontWeight: '700', marginBottom: 6 },
  codeBlock: {
    color: '#1f2328',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },

  linkButton: { alignItems: 'center', padding: 12 },
  linkText: { color: '#0969da', fontSize: 14, fontWeight: '600' },
});
