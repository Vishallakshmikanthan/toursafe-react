/**
 * TourSafe Tourist Tabs Navigation Layout
 * Clean light mobile tab bar with 5 primary ergonomic tabs and prominent center SOS button.
 */

import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  Home,
  Map,
  ShieldAlert,
  CreditCard,
  User,
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
                <Home size={20} color={focused ? "#0284C7" : color} />
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
                <Map size={20} color={focused ? "#0284C7" : color} />
                {focused && <View style={styles.tabActiveDot} />}
              </View>
            ),
          }}
        />

        {/* Center Primary Action: SOS Emergency */}
        <Tabs.Screen
          name="sos"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <View style={styles.sosButtonContainer}>
                {/* Outermost soft red halo */}
                <View style={styles.sosAuraOuter} />
                {/* Secondary glow ring */}
                <View style={styles.sosAuraInner} />
                {/* Primary raised SOS trigger button */}
                <View style={styles.sosInnerButton}>
                  <ShieldAlert size={22} color="#FFFFFF" />
                  <Text style={styles.sosInnerText}>SOS</Text>
                </View>
              </View>
            ),
            tabBarLabel: () => null,
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

        {/* Auxiliary Hidden Tabs */}
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
    backgroundColor: "#0B132B",
  },
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 22 : 14,
    left: 14,
    right: 14,
    height: 70,
    borderRadius: 35,
    backgroundColor: Platform.OS === "web" ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.45)",
    paddingBottom: 6,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        } as any)
      : {}),
  },
  tabBarItem: {
    paddingVertical: 1,
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
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconActive: {
    backgroundColor: "rgba(2, 132, 199, 0.14)",
  },
  tabActiveDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0284C7",
  },
  sosButtonContainer: {
    position: "relative",
    top: -18,
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 72,
  },
  sosAuraOuter: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(239, 68, 68, 0.22)",
  },
  sosAuraInner: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(239, 68, 68, 0.45)",
  },
  sosInnerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  sosInnerText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    marginTop: 1,
  },
});
