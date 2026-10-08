import { Tabs } from 'expo-router';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text, Platform } from 'react-native';
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  Users,
  BarChart3,
  MapPin,
  Settings,
  Cpu,
  Layers,
  MoreHorizontal,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AdminMoreModal } from '@/components/admin/AdminMoreModal';

export default function AdminTabsLayout() {
  const { initializeAuth } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [moreModalVisible, setMoreModalVisible] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <View style={styles.container}>
      {/* Desktop Persistent Left Sidebar */}
      {isDesktop && <AdminSidebar />}

      {/* Main View Area */}
      <View style={styles.mainWrapper}>
        {/* Desktop Persistent Top Bar */}
        {isDesktop && <AdminTopBar />}

        <View style={styles.tabsContainer}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: isDesktop ? { display: 'none' } : styles.mobileTabBar,
              tabBarActiveTintColor: '#0284C7',
              tabBarInactiveTintColor: '#64748B',
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarItemStyle: styles.tabBarItem,
            }}
          >
            {/* Primary Tab 1: Dashboard / Command Hub */}
            <Tabs.Screen
              name="dashboard"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} />,
              }}
            />

            {/* Primary Tab 2: Live Command Map */}
            <Tabs.Screen
              name="map"
              options={{
                title: 'Live Map',
                tabBarIcon: ({ color }) => <Map size={20} color={color} />,
              }}
            />

            {/* Primary Tab 3: Alerts & Incidents */}
            <Tabs.Screen
              name="alerts"
              options={{
                title: 'Alerts',
                tabBarIcon: ({ color }) => <ShieldAlert size={20} color={color} />,
              }}
            />

            {/* Primary Tab 4: Safety Zones */}
            <Tabs.Screen
              name="zones"
              options={{
                title: 'Zones',
                tabBarIcon: ({ color }) => <MapPin size={20} color={color} />,
              }}
            />

            {/* Hidden from mobile bottom tabs, openable via "More" */}
            <Tabs.Screen
              name="tourists"
              options={{
                title: 'Tourists',
                href: isDesktop ? undefined : null,
                tabBarIcon: ({ color }) => <Users size={20} color={color} />,
              }}
            />
            <Tabs.Screen
              name="analytics"
              options={{
                title: 'Analytics',
                href: isDesktop ? undefined : null,
                tabBarIcon: ({ color }) => <BarChart3 size={20} color={color} />,
              }}
            />
            <Tabs.Screen
              name="ml-ops"
              options={{
                title: 'ML Ops',
                href: isDesktop ? undefined : null,
                tabBarIcon: ({ color }) => <Cpu size={20} color={color} />,
              }}
            />
            <Tabs.Screen
              name="integrations"
              options={{
                title: 'Integrations',
                href: isDesktop ? undefined : null,
                tabBarIcon: ({ color }) => <Layers size={20} color={color} />,
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                href: isDesktop ? undefined : null,
                tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
              }}
            />
          </Tabs>

          {/* Mobile "More" Floating Action Button on Bottom Bar */}
          {!isDesktop && (
            <TouchableOpacity
              style={styles.moreTabBtn}
              onPress={() => setMoreModalVisible(true)}
              activeOpacity={0.8}
            >
              <MoreHorizontal size={20} color="#64748B" />
              <Text style={styles.moreTabText}>More</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile Drawer Modal */}
      <AdminMoreModal
        visible={moreModalVisible}
        onClose={() => setMoreModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    height: '100%',
    width: '100%',
  },
  mainWrapper: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
  },
  tabsContainer: {
    flex: 1,
    position: 'relative',
  },
  mobileTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 76 : 64,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    paddingRight: 72, // Reserve space for the "More" button
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  moreTabBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 8,
    right: 14,
    width: 50,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  moreTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
});
