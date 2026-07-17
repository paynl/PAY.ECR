import React, { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './navigation';
import { useEffect } from 'react';
import NativeEcrBridge from '../specs/NativeEcrBridge';
import { LogProvider } from './context/LoggingContext';
import { LoginView } from './pages/BottomSheets/LoginView';
import { ErrorView } from './pages/BottomSheets/ErrorView';
import { LogViewer } from './pages/BottomSheets/LogViewer';
import { PayBottomSheetProvider } from './context/BottomSheetContext';

function App() {

  const errorRef = useRef<BottomSheetModal<{ message: string }> | null>(null);
  const logRef = useRef<BottomSheetModal | null>(null);
  const loginRef = useRef<BottomSheetModal | null>(null);

  useEffect(() => {
    NativeEcrBridge.start();
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <LogProvider>
            <PayBottomSheetProvider errorView={errorRef} logView={logRef} loginView={loginRef}>
              <Navigation />

              <LoginView bottomSheet={loginRef} />
              <ErrorView bottomSheet={errorRef} />
              <LogViewer bottomSheet={logRef} />
            </PayBottomSheetProvider>
          </LogProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export default App;
