import React, { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { MMKV } from 'react-native-mmkv';
import NativeEcrBridge, { PosMessage, PosReply } from '../../../specs/NativeEcrBridge';
import { useLogs } from '../../context/LoggingContext';
import type { EventSubscription } from 'react-native/Libraries/vendor/emitter/EventEmitter';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/types';

const pinStorage = new MMKV({
  id: 'pin-storage',
  encryptionKey: 'my-strong-secret-key',
});

const REMEMBER_KEY = 'rememberPin';
const PIN_KEY = 'savedPinCode';

type Props = {
  bottomSheet: RefObject<BottomSheetModal | null>
}
export const LoginView = (props: Props) => {
  const { appendLog } = useLogs();

  const renderBackdrop = useCallback((x: BottomSheetDefaultBackdropProps) => <BottomSheetBackdrop {...x} disappearsOnIndex={-1} appearsOnIndex={0} />, []);

  const dismiss = () => {
    props.bottomSheet.current?.dismiss();
  };

  const [code, setCode] = useState<Array<string>>(['', '', '', '', '', '', '', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [rememberPin, setRememberPin] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const replySubscription = useRef<EventSubscription | null>(null);

  useEffect(() => {
    const storedRemember = pinStorage.getBoolean(REMEMBER_KEY);
    const storedPin = pinStorage.getString(PIN_KEY);

    if (storedRemember && storedPin && storedPin.length === 12) {
      setRememberPin(true);
      const digits = storedPin.split('');
      setCode(digits);
      setTimeout(() => inputRefs.current[11]?.focus(), 100);
    }

    replySubscription.current = NativeEcrBridge.onReply(handleReply);

    return () => {
      replySubscription.current?.remove();
    };
  }, []);

  const handleReply = useCallback((response: PosReply) => {
    appendLog('Received reply: ' + JSON.stringify(response));
    setVerifying(false);

    if (response.type === 'ERROR') return;

    if (response.type === 'PONG') {
      if (response.status === 'IDLE') {
        orderCreateAction();
      } else if (response.status !== 'ORDER_PRESENTATION') {
        return;
      }
      dismiss();
      return;
    }
  }, [appendLog, dismiss]);

  const orderCreateAction = () => {
    const message: PosMessage = {
      type: 'ORDER_CREATE',
      service: undefined,
      transaction: {
        type: 'PAYMENT',
        amount: { value: 0, currency: 'EUR' },
        description: undefined,
        reference: undefined,
        order: { products: [] },
      },
    };
    appendLog('Sending : ' + JSON.stringify(message));
    NativeEcrBridge.sendMessage(message);
  };

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 12).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 12) newCode[index + i] = digit;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 11);
      if (nextIndex < 12) inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = cleaned;
      setCode(newCode);

      if (cleaned && index < 11) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');
  const fullCode = code.join('');

  const persistPin = (pin: string, remember: boolean) => {
    if (remember) {
      pinStorage.set(REMEMBER_KEY, true);
      pinStorage.set(PIN_KEY, pin);
    } else {
      pinStorage.delete(REMEMBER_KEY);
      pinStorage.delete(PIN_KEY);
    }
  };

  const handleSubmit = () => {
    if (isCodeComplete) {
      setVerifying(true);
      persistPin(fullCode, rememberPin);
      NativeEcrBridge.setPin(fullCode);
      appendLog('Sending : ' + JSON.stringify({ type: 'PING' }));
      NativeEcrBridge.sendMessage({ type: 'PING' });
    }
  };

  const handleClose = () => {
    dismiss();
  };

  const renderInput = (index: number) => (
    <TextInput
      key={index}
      ref={(ref: TextInput | null) => {
        if (ref !== null) {
          inputRefs.current[index] = ref;
        }
      }}
      style={styles.input}
      value={code[index]}
      onChangeText={text => handleChange(text, index)}
      onKeyPress={e => handleKeyPress(e, index)}
      keyboardType="number-pad"
      maxLength={index === 0 ? 4 : 1}
      selectTextOnFocus
    />
  );

  return (
    <BottomSheetModal index={0} ref={props.bottomSheet} snapPoints={['50%']} enableDynamicSizing={false} enablePanDownToClose={true} backdropComponent={renderBackdrop}>
      <BottomSheetView style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Enter Security Code</Text>
        </View>
        <Text style={styles.subtitle}>Please enter the 12-digit security code from your authenticator app</Text>
        <View style={styles.codeContainer}>
          {[0, 1, 2].map(group => (
            <View key={group} style={styles.groupInputs}>
              {[0, 1, 2, 3].map(digit => {
                const index = group * 4 + digit;
                return (
                  <React.Fragment key={index}>
                    {renderInput(index)}
                    {digit === 3 && group < 2 && <Text style={styles.dash}>-</Text>}
                  </React.Fragment>
                );
              })}
            </View>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.checkboxRow}
          onPress={() => setRememberPin(prev => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberPin }}
          accessibilityLabel="Remember this device"
        >
          <View style={[styles.checkboxBox, rememberPin && styles.checkboxBoxChecked]}>{rememberPin && <Text style={styles.checkboxMark}>✓</Text>}</View>
          <Text style={styles.checkboxLabel}>Remember this device</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.submitButton, !isCodeComplete && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isCodeComplete || verifying}
        >
          {verifying ? <ActivityIndicator /> : <Text style={styles.submitText}>Verify Code</Text>}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, paddingVertical: 20, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  closeButton: { padding: 8, marginRight: 20 },
  closeText: { fontSize: 24, color: '#666' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
  codeContainer: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  groupInputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  input: { width: 24, height: 40, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: '600', marginHorizontal: 2, color: '#1a1a1a', backgroundColor: '#f9f9f9' },
  dash: { fontSize: 18, color: '#999', marginHorizontal: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 8, marginBottom: 4, paddingVertical: 6, paddingHorizontal: 8 },
  checkboxBox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#007AFF', borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkboxBoxChecked: { backgroundColor: '#007AFF' },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  checkboxLabel: { fontSize: 14, color: '#1a1a1a' },
  submitButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});