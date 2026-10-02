import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Phone,
  Building2,
  Sparkles,
  Lock,
  ChevronRight,
  UserCheck,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";

export default function AppEntry() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        await initializeAuth();
      } catch (err) {
        console.warn("Auth check error:", err);
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (!checking && isAuthenticated && user) {
      if (user.role === "authority" || user.role === "admin") {
        router.replace("/admin/(tabs)/dashboard");
      } else if (user.role === "responder") {
        router.replace("/responder");
      } else {
        router.replace("/tourist/(tabs)/dashboard");
      }
    }
  }, [checking, isAuthenticated, user]);

  const launchTourist = () => {
    setUser({
      id: "usr_tourist_mock",
      email: "tourist@toursafe.dev",
      full_name: "Priya Sharma",
      role: "tourist",
    });
    router.replace("/tourist/(tabs)/dashboard");
  };

  const launchLogin = (role: "authority" | "responder" | "tourist" = "tourist") => {
    router.push({
      pathname: "/auth/login",
      params: { role },
    });
  };

  const handleCallEmergency = () => {
    Linking.openURL("tel:112").catch(() => {});
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.loadingText}>Initializing TourSafe Shield...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Ambient background glowing orbs */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Official Top Emblem */}
        <View style={styles.emblemSection}>
          <View style={styles.shieldWrapper}>
            <ShieldCheck size={50} color="#0284C7" />
          </View>
          <View style={styles.govBadge}>
            <Sparkles size={11} color="#0284C7" />
            <Text style={styles.govBadgeText}>OFFICIAL TRAVEL COMPANION</Text>
          </View>
          <Text style={styles.appTitle}>TourSafe</Text>
          <Text style={styles.appSubtitle}>
            Real-time geospatial safety radar, encrypted digital identity, and instant emergency dispatch.
          </Text>
        </View>

        {/* Feature Highlights Pills */}
        <View style={styles.featurePillRow}>
          <View style={styles.featurePill}>
            <View style={[styles.dot, { backgroundColor: "#0284C7" }]} />
            <Text style={styles.featurePillText}>Safe Geofencing</Text>
          </View>
          <View style={styles.featurePill}>
            <View style={[styles.dot, { backgroundColor: "#0284C7" }]} />
            <Text style={styles.featurePillText}>Verifiable Pass</Text>
          </View>
          <View style={styles.featurePill}>
            <View style={[styles.dot, { backgroundColor: "#DC2626" }]} />
            <Text style={styles.featurePillText}>Instant SOS</Text>
          </View>
        </View>

        {/* Primary Actions (Thumb-Zone Reached) */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryTouristButton}
            onPress={launchTourist}
            activeOpacity={0.85}
          >
            <View style={styles.buttonLeft}>
              <View style={styles.buttonIconBox}>
                <UserCheck size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.primaryButtonTitle}>Enter Tourist Companion</Text>
                <Text style={styles.primaryButtonSub}>Live safety radar & verified ID pass</Text>
              </View>
            </View>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryLoginButton}
            onPress={() => launchLogin("authority")}
            activeOpacity={0.8}
          >
            <View style={styles.buttonLeft}>
              <View style={styles.secondaryButtonIconBox}>
                <Building2 size={20} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.secondaryButtonTitle}>Authority & Tactical Login</Text>
                <Text style={styles.secondaryButtonSub}>Command operations & responders</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Rapid SOS Assistance Card */}
          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={handleCallEmergency}
            activeOpacity={0.8}
          >
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyIconCircle}>
                <Phone size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.emergencyTitle}>Immediate Helpline (112)</Text>
                <Text style={styles.emergencySub}>National Emergency Response Center</Text>
              </View>
            </View>
            <View style={styles.callBadge}>
              <Text style={styles.callBadgeText}>CALL</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Trust & Security Seal */}
        <View style={styles.footerSection}>
          <Lock size={12} color="#64748B" />
          <Text style={styles.footerText}>
            Protected under DPDP Act 2023 • Sovereign Travel Safety
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    pointerEvents: "none",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(14, 165, 233, 0.05)",
    pointerEvents: "none",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: "space-between",
    minHeight: "100%",
  },
  emblemSection: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  shieldWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(2, 132, 199, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  govBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
    marginBottom: 10,
  },
  govBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  featurePillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 12,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  actionsSection: {
    gap: 12,
    marginVertical: 20,
  },
  primaryTouristButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0284C7",
    padding: 16,
    borderRadius: 22,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minHeight: 64,
  },
  buttonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  buttonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  primaryButtonSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  secondaryLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 64,
  },
  secondaryButtonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.15)",
  },
  secondaryButtonTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  secondaryButtonSub: {
    fontSize: 12,
    color: "#64748B",
  },
  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(254, 242, 242, 0.95)",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    marginTop: 6,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  emergencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  emergencyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
  },
  emergencySub: {
    fontSize: 11,
    color: "#DC2626",
  },
  callBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  callBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  footerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
});
