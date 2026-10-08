import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  Users,
  BarChart3,
  MapPin,
  Layers,
  Settings,
  Navigation,
  User,
  LogOut,
  Cpu,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  id: string;
  name: string;
  route: string;
  icon: any;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', route: '/admin/(tabs)/dashboard', icon: LayoutDashboard },
  { id: 'map', name: 'Live Map', route: '/admin/(tabs)/map', icon: Map },
  { id: 'alerts', name: 'Alerts', route: '/admin/(tabs)/alerts', icon: ShieldAlert, badge: '4' },
  { id: 'tourists', name: 'Tourists', route: '/admin/(tabs)/tourists', icon: Users },
  { id: 'zones', name: 'Zones', route: '/admin/(tabs)/zones', icon: MapPin },
  { id: 'analytics', name: 'ML & Analytics', route: '/admin/(tabs)/analytics', icon: BarChart3 },
  { id: 'integrations', name: 'Integrations', route: '/admin/(tabs)/integrations', icon: Layers },
  { id: 'settings', name: 'Settings', route: '/admin/(tabs)/settings', icon: Settings },
];

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const isActive = (item: NavItem) => {
    if (pathname.includes(item.id)) return true;
    if (item.id === 'analytics' && pathname.includes('ml-ops')) return true;
    return false;
  };

  return (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.brandIcon}>
          <Navigation size={18} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.brandTitle}>TOURSAFE</Text>
          <Text style={styles.brandSubtitle}>Authority Command</Text>
        </View>
      </View>

      {/* Navigation Links */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.75}
            >
              <IconComponent size={18} color={active ? '#FFFFFF' : '#94A3B8'} />
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {item.name}
              </Text>
              {item.badge && (
                <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
                    {item.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer Role Switcher & Profile */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.roleSwitchBtn}
          onPress={() => router.replace('/tourist/(tabs)/dashboard')}
          activeOpacity={0.8}
        >
          <User size={15} color="#38BDF8" />
          <Text style={styles.roleSwitchText}>Switch to Traveler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            router.replace('/auth/login');
          }}
          activeOpacity={0.8}
        >
          <LogOut size={15} color="#94A3B8" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 230,
    backgroundColor: '#0B132B',
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } as any : {}),
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  navSection: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: '#0284C7',
  },
  navText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  badgeTextInactive: {
    color: '#EF4444',
  },
  footerSection: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  roleSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
