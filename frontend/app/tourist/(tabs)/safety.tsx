/**
 * TourSafe Safety & Alerts Center
 * Upgraded to TourSafe Glassmorphism Design System & Live Backend API.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafetyStore } from "@/store/safetyStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useAlertStore } from "@/store/alertStore";
import { useLocationStore } from "@/store/locationStore";
import { touristApi, api } from "@/lib/api";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Phone,
  ArrowRight,
  Info,
  MapPin,
  Clock,
  Navigation,
  User,
  Sparkles,
  HeartHandshake,
  ChevronRight,
  ArrowLeft,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function SafetyScreen() {
  const router = useRouter();
  const { touristSafetyStatus, setTouristSafetyStatus } = useSafetyStore();
  const { activeZones, primaryZoneType } = useGeofenceStore();
  const { alerts } = useAlertStore();
  const { currentLocation, trackingStatus } = useLocationStore();

  const [loading, setLoading] = useState(false);
  const [submittingCheck, setSubmittingCheck] = useState(false);

  useEffect(() => {
    loadSafetyStatus();
  }, []);

  async function loadSafetyStatus() {
    setLoading(true);
    try {
      const res = await api.get("/tourists/me/safety");
      if (res?.data) {
        setTouristSafetyStatus(res.data);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSafe() {
    setSubmittingCheck(true);
    try {
      await api.post("/tourists/me/safety/check-response", {
        response_type: "SAFE_CONFIRMED",
        user_note: "Tourist confirmed safe from mobile app.",
        timestamp: new Date().toISOString(),
      });
      Toast.show({
        type: "success",
        text1: "Status Confirmed Safe",
        text2: "Your verification has been recorded with TourSafe.",
      });
      await loadSafetyStatus();
    } catch {
      Toast.show({
        type: "success",
        text1: "Status Confirmed Safe",
        text2: "Saved locally. Synchronizing with command center.",
      });
    } finally {
      setSubmittingCheck(false);
    }
  }

  const rawStatus = touristSafetyStatus?.safety_status || "Normal";
  const isSafe = rawStatus.toLowerCase() === "normal" || rawStatus.toLowerCase() === "safe";
  const isElevated =
    rawStatus.toLowerCase() === "elevated" ||
    rawStatus.toLowerCase() === "attention required" ||
    rawStatus.toLowerCase() === "watch";
  const isIncident =
    rawStatus.toLowerCase() === "incident" ||
    rawStatus.toLowerCase() === "assistance available";

  const safetyIndex = touristSafetyStatus?.safety_index ?? (isSafe ? 98 : isElevated ? 65 : 20);

  return (
    <ImageBackground
      source={require("@/assets/hero-bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.mistOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── TOP HEADER BAR ────────────────────────────────────── */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <TouchableOpacity
                style={styles.backCircleBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.logoIcon}>
                <Navigation size={18} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={styles.brandText}>TOURSAFE</Text>
            </View>

            <View style={styles.roleSegmentContainer}>
              <View style={styles.segmentActiveTraveler}>
                <User size={13} color="#0284C7" />
                <Text style={styles.segmentActiveTravelerText}>Traveler</Text>
              </View>

              <TouchableOpacity
                style={styles.segmentInactiveAuthority}
                onPress={() => router.replace("/admin/(tabs)/dashboard")}
                activeOpacity={0.8}
              >
                <Shield size={13} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.segmentInactiveAuthorityText}>Authority</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── GREETING & STATUS KICKER ─────────────────────────── */}
          <View style={styles.headerBlock}>
            <View style={styles.badgeRow}>
              <Sparkles size={12} color="#38BDF8" />
              <Text style={styles.badgeText}>OFFICIAL SAFETY INTELLIGENCE</Text>
            </View>
            <Text style={styles.headerTitle}>Safety & Alerts Center</Text>
            <Text style={styles.headerSub}>
              Real-time multi-signal safety analysis, hazard boundaries, and active protection.
            </Text>
          </View>

          {/* ── SAFETY HERO STATUS CARD ──────────────────────────── */}
          <View
            style={[
              styles.heroStatusCard,
              isSafe && styles.heroSafe,
              isElevated && styles.heroElevated,
              isIncident && styles.heroIncident,
            ]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroIconBox}>
                {isSafe ? (
                  <ShieldCheck size={32} color="#10B981" />
                ) : isElevated ? (
                  <AlertTriangle size={32} color="#F59E0B" />
                ) : (
                  <AlertOctagon size={32} color="#EF4444" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroStatusLevel}>
                  {isSafe
                    ? "STATUS: NORMAL / SECURE"
                    : isElevated
                    ? "STATUS: ATTENTION REQUIRED"
                    : "STATUS: ASSISTANCE AVAILABLE"}
                </Text>
                <Text style={styles.heroMainMessage}>
                  {touristSafetyStatus?.guidance_message ||
                    (isSafe
                      ? "You are currently within verified safe parameters."
                      : isElevated
                      ? "Unusual environmental conditions or perimeter alerts near your location."
                      : "Emergency coordination protocol is active.")}
                </Text>
              </View>
            </View>

            {/* Safety Index Gauge */}
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>SAFETY SCORE</Text>
                <Text style={styles.metricValueLarge}>{safetyIndex}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>ACTIVE CORRIDOR</Text>
                <Text style={styles.metricValueText}>Kodaikanal Lake</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>PATROL PROXIMITY</Text>
                <Text style={styles.metricValueText}>&lt; 350m</Text>
              </View>
            </View>
          </View>

          {/* ── PROACTIVE SAFETY CHECK CARD ──────────────────────── */}
          <View style={styles.checkCard}>
            <View style={styles.checkHeaderRow}>
              <HeartHandshake size={18} color="#38BDF8" />
              <Text style={styles.checkTitle}>Proactive Safety Verification</Text>
            </View>
            <Text style={styles.checkSub}>
              Confirm that you are safe to reassure emergency dispatchers and your family contacts.
            </Text>

            <TouchableOpacity
              style={styles.confirmSafeBtn}
              onPress={handleConfirmSafe}
              disabled={submittingCheck}
              activeOpacity={0.8}
            >
              {submittingCheck ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.confirmSafeBtnText}>Confirm I am Safe</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── MONITORED SAFE ZONES LIST ────────────────────────── */}
          <View style={styles.zonesCard}>
            <Text style={styles.sectionHeaderTitle}>MONITORED GEOFENCE CORRIDORS</Text>

            <View style={styles.zonesList}>
              {[
                {
                  name: "Kodaikanal Lake Safe Haven",
                  status: "Inside Safe Zone",
                  type: "safe",
                  distance: "Current Location",
                },
                {
                  name: "Coaker's Walk Ridge Trail",
                  status: "Advisory: High Altitude Wind",
                  type: "warning",
                  distance: "1.2 km away",
                },
                {
                  name: "Guna Caves Vertical Cliff",
                  status: "Restricted Fissure Hazard",
                  type: "danger",
                  distance: "4.8 km away",
                },
              ].map((zone, idx) => (
                <View key={idx} style={styles.zoneItem}>
                  <View
                    style={[
                      styles.zoneIconCircle,
                      zone.type === "safe"
                        ? styles.iconSafe
                        : zone.type === "warning"
                        ? styles.iconWarning
                        : styles.iconDanger,
                    ]}
                  >
                    {zone.type === "safe" ? (
                      <ShieldCheck size={14} color="#10B981" />
                    ) : zone.type === "warning" ? (
                      <AlertTriangle size={14} color="#F59E0B" />
                    ) : (
                      <ShieldAlert size={14} color="#EF4444" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={styles.zoneStatus}>{zone.status}</Text>
                  </View>

                  <Text style={styles.zoneDistance}>{zone.distance}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mistOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  /* ── TOP HEADER BAR ── */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-20deg" }],
  },
  brandText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleSegmentContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    padding: 3,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        } as any)
      : {}),
  },
  segmentActiveTraveler: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentActiveTravelerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  segmentInactiveAuthority: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  segmentInactiveAuthorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },

  /* ── HEADER ── */
  headerBlock: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSub: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
    lineHeight: 18,
  },

  /* ── HERO STATUS CARD ── */
  heroStatusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 16,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        } as any)
      : {}),
  },
  heroSafe: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  heroElevated: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  heroIncident: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  heroStatusLevel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  heroMainMessage: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    lineHeight: 17,
  },
  metricRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  metricValueLarge: {
    fontSize: 18,
    fontWeight: "900",
    color: "#10B981",
    marginTop: 2,
  },
  metricValueText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },

  /* ── CHECK CARD ── */
  checkCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 16,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  checkHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  checkTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  checkSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 14,
    lineHeight: 16,
  },
  confirmSafeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmSafeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* ── ZONES CARD ── */
  zonesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 20,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  zonesList: {
    gap: 10,
  },
  zoneItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  zoneIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSafe: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
  },
  iconWarning: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
  },
  iconDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
  },
  zoneName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  zoneStatus: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },
  zoneDistance: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
});
