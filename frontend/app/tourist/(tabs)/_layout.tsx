/**
 * TourSafe Tourist Tabs Navigation Layout
 * Clean light mobile tab bar with 5 primary ergonomic tabs and prominent center SOS button.
 */

import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import {
  ShieldCheck,
  Compass,
  MapPin,
  ShieldAlert,
  FileText,
  CreditCard,
  User,
  Activity,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function TouristTabsLayout() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#059669",
          tabBarInactiveTintColor: "#64748B",
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        {/* Primary Tab 1: Home Dashboard */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconActive]}>
                <ShieldCheck size={20} color={focused ? "#059669" : color} />
              </View>
            ),
          }}
        />

        {/* Primary Tab 2: Live Map & Corridors */}
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconActive]}>
                <MapPin size={20} color={focused ? "#2563EB" : color} />
              </View>
            ),
          }}
        />

        {/* Center Primary Action: SOS Emergency */}
        <Tabs.Screen
          name="sos"
          options={{
            title: "SOS",
            tabBarIcon: ({ focused }) => (
              <View style={styles.sosButtonContainer}>
                <View style={styles.sosInnerButton}>
                  <ShieldAlert size={22} color="#FFFFFF" />
                </View>
              </View>
            ),
            tabBarLabelStyle: styles.sosLabel,
            tabBarActiveTintColor: "#DC2626",
          }}
        />

        {/* Primary Tab 4: Verifiable Digital ID */}
        <Tabs.Screen
          name="digital-id"
          options={{
            title: "Digital ID",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconActive]}>
                <CreditCard size={20} color={focused ? "#D97706" : color} />
              </View>
            ),
          }}
        />

        {/* Primary Tab 5: Profile & Settings */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconActive]}>
                <User size={20} color={focused ? "#7C3AED" : color} />
              </View>
            ),
          }}
        />

        {/* Auxiliary Tabs */}
        <Tabs.Screen
          name="itinerary"
          options={{
            href: null,
            title: "Trips",
          }}
        />
        <Tabs.Screen
          name="safety"
          options={{
            href: null,
            title: "Safety",
          }}
        />
        <Tabs.Screen
          name="incidents"
          options={{
            href: null,
            title: "Incidents",
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingBottom: Platform.OS === "ios" ? 22 : 8,
    paddingTop: 8,
    height: Platform.OS === "ios" ? 84 : 64,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconActive: {
    backgroundColor: "#F1F5F9",
  },
  sosButtonContainer: {
    position: "relative",
    top: -12,
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
  },
  sosInnerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  sosLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
    marginTop: -8,
  },
});
