import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function DevLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
        <Stack.Screen name="geofence" />
        <Stack.Screen name="gps" />
        <Stack.Screen name="imu" />
        <Stack.Screen name="realtime" />
        <Stack.Screen name="telemetry" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
