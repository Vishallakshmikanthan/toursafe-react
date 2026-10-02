import './global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MobileDeviceFrame } from '@/components/mobile/MobileDeviceFrame';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MobileDeviceFrame>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="tourist" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="responder" />
            <Stack.Screen name="dev" />
          </Stack>
          <Toast />
        </MobileDeviceFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
