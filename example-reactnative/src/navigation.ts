import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoveryPage from './pages/Discovery';
import { createStaticNavigation } from '@react-navigation/native';
import { EcrPage } from './pages/EcrPage';
import { LogViewer } from './pages/BottomSheets/LogViewer';
import { ErrorView } from './pages/BottomSheets/ErrorView';
import { TransactionStatus } from './pages/TransactionStatus';

const RootStack = createNativeStackNavigator({
  screens: {
    Discovery: {
      screen: DiscoveryPage,
      options: {
        headerShown: false,
      },
    },
    Ecr: {
      screen: EcrPage,
      options: {
        headerShown: false,
      },
    },
    TransactionStatus: {
      screen: TransactionStatus,
      options: {
        headerShown: false,
      },
    },
    ErrorView: {
      screen: ErrorView,
      options: {
        presentation: 'formSheet',
        headerShown: false,
        sheetAllowedDetents: [0.25, 0.5, 1],
        sheetInitialDetentIndex: 1,
        sheetGrabberVisible: true,
      },
    },
    LogViewer: {
      screen: LogViewer,
      options: {
        presentation: 'formSheet',
        headerShown: false,
        sheetAllowedDetents: [0.25, 0.5, 1],
        sheetInitialDetentIndex: 1,
        sheetGrabberVisible: true,
      },
    },
  },
});

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}

export default createStaticNavigation(RootStack);