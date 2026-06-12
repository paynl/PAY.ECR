import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './navigation';
import { useEffect } from 'react';
import NativeEcrBridge from '../specs/NativeEcrBridge';
import { LogProvider } from './context/LoggingContext';

function App() {

  useEffect(() => {
    NativeEcrBridge.start();
  }, [])

  return (
    <SafeAreaProvider>
      <LogProvider>
        <Navigation />
      </LogProvider>
    </SafeAreaProvider>
  );
}

export default App;
