import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert, User } from 'lucide-react-native';

type RoleSwitchProps = {
  currentRole: 'tourist' | 'authority';
};

export default function RoleSwitch({ currentRole }: RoleSwitchProps) {
  const router = useRouter();
  const devBypass = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true';

  if (!devBypass) {
    return null;
  }

  const nextRole = currentRole === 'tourist' ? 'authority' : 'tourist';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.replace(
            nextRole === 'tourist' ? '/tourist/(tabs)/dashboard' : '/admin/(tabs)/dashboard'
          )
        }
        style={styles.switch}
        activeOpacity={0.85}
      >
        <View style={[styles.segment, currentRole === 'tourist' && styles.segmentActive]}>
          <User size={13} color={currentRole === 'tourist' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.segmentText, currentRole === 'tourist' && styles.segmentTextActive]}>
            Traveler View
          </Text>
        </View>
        <View style={[styles.segment, currentRole === 'authority' && styles.segmentActive]}>
          <ShieldAlert size={13} color={currentRole === 'authority' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.segmentText, currentRole === 'authority' && styles.segmentTextActive]}>
            Authority Command
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
});
