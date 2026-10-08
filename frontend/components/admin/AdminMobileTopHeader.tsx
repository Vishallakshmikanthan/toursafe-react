import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Navigation,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { NotificationBellButton } from '@/components/NotificationBellButton';

interface AdminMobileTopHeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showRoleSwitcher?: boolean;
  children?: React.ReactNode;
}

export function AdminMobileTopHeader({
  title,
  subtitle,
  rightAction,
  showRoleSwitcher = true,
  children,
}: AdminMobileTopHeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const officerName = user?.full_name || 'Officer';

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Primary Brand & Role Switcher Row */}
      <View style={styles.brandRow}>
        {/* Left: Brand Identity */}
        <View style={styles.brandLeft}>
          <View style={styles.logoIcon}>
            <Navigation size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>TOURSAFE</Text>
          <View style={styles.authorityBadge}>
            <Shield size={10} color="#0284C7" />
            <Text style={styles.authorityBadgeText}>AUTHORITY</Text>
          </View>
        </View>

        {/* Right: Role Switcher & Controls */}
        <View style={styles.brandRight}>
          {showRoleSwitcher && (
            <View style={styles.roleSegment}>
              <TouchableOpacity
                style={styles.segmentInactive}
                onPress={() => router.replace('/tourist/(tabs)/dashboard')}
                activeOpacity={0.75}
                accessibilityLabel="Switch to Traveler view"
              >
                <User size={12} color="#64748B" />
                <Text style={styles.segmentInactiveText}>Traveler</Text>
              </TouchableOpacity>
              <View style={styles.segmentActive}>
                <Shield size={11} color="#FFFFFF" />
                <Text style={styles.segmentActiveText}>Auth</Text>
              </View>
            </View>
          )}

          {/* Realtime Notification Bell */}
          <NotificationBellButton />

          {/* Officer Avatar Badge */}
          <View style={styles.officerAvatar} accessibilityLabel={`Logged in as ${officerName}`}>
            <ShieldCheck size={14} color="#0284C7" />
          </View>
        </View>
      </View>

      {/* Optional Screen Title & Action Bar */}
      {(title || rightAction) && (
        <View style={styles.titleSection}>
          <View style={styles.titleCol}>
            {title && <Text style={styles.titleText}>{title}</Text>}
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
          </View>
          {rightAction && <View style={styles.actionCol}>{rightAction}</View>}
        </View>
      )}

      {/* Optional custom children */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 50,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logoIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-20deg' }],
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.2,
  },
  authorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  authorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  segmentInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  segmentInactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  officerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  titleCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  actionCol: {
    flexShrink: 0,
  },
});
