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
          tabBarActiveTintColor: "#0284C7",
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
                <ShieldCheck size={20} color={focused ? "#0284C7" : color} />
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
                <MapPin size={20} color={focused ? "#0284C7" : color} />
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
                  <ShieldAlert size={23} color="#FFFFFF" />
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
                <CreditCard size={20} color={focused ? "#0284C7" : color} />
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
                <User size={20} color={focused ? "#0284C7" : color} />
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
    position: "absolute",
    bottom: Platform.OS === "ios" ? 22 : 14,
    left: 14,
    right: 14,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.9)",
    paddingBottom: 6,
    paddingTop: 6,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  tabBarItem: {
    paddingVertical: 1,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 1,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconActive: {
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.25)",
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  sosLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
    marginTop: -8,
  },
});
