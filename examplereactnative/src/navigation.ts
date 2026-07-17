import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoveryPage from './pages/Discovery';
import { createStaticNavigation } from '@react-navigation/native';
import { EcrPage } from './pages/EcrPage';
import { TransactionStatus } from './pages/TransactionStatus';
import { CaptureScreen } from './pages/Capture';

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
    Capture: {
      screen: CaptureScreen,
      options: {
        headerShown: false,
      },
    },
  },
});

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}

export default createStaticNavigation(RootStack);