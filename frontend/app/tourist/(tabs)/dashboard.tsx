/**
 * TourSafe Tourist Home Dashboard
 * Mobile-First Personal Safety Companion Hub
 * Pixel-perfect implementation matching the TourSafe Glassmorphism design system.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useSafetyStore } from "@/store/safetyStore";
import { useLocationStore } from "@/store/locationStore";
import { useIMUStore } from "@/store/imuStore";
import { useSOSStore } from "@/store/sosStore";
import { useTripStore } from "@/store/tripStore";
import { useGeofenceStore } from "@/store/geofenceStore";
import { useBatteryStore } from "@/store/batteryStore";
import { useConnectivityStore } from "@/store/connectivityStore";
import { touristApi } from "@/lib/api";
import { trackingSessionService } from "@/lib/tracking-session/trackingSessionService";
import { imuController } from "@/lib/sensors/imuController";
import {
  MapPin,
  Phone,
  ArrowRight,
  Shield,
  CreditCard,
  FileText,
  Navigation,
  Battery,
  Activity,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function TouristDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { touristSafetyStatus, setTouristSafetyStatus } = useSafetyStore();
  const { trackingStatus, currentLocation } = useLocationStore();
  const { imuStatus } = useIMUStore();
  const { sosStatus, activeIncidentId, triggerSOS } = useSOSStore();
  const { activeTrip, fetchTrips } = useTripStore();
  const { activeZones } = useGeofenceStore();
  const { batteryInfo } = useBatteryStore();
  const { networkState } = useConnectivityStore();

  const [emergencyExpanded, setEmergencyExpanded] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    imuController.checkAvailability();
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      await Promise.all([fetchTrips(), fetchSafetyStatus()]);
    } catch (e) {
      console.warn("[Dashboard] Load error:", e);
    }
  }

  async function fetchSafetyStatus() {
    try {
      const res = await touristApi.getMyProfileStatus();
      if (res?.data) {
        setTouristSafetyStatus(res.data);
      }
    } catch {
      // Offline fallback
    }
  }

  async function handleToggleTracking() {
    setActionInProgress(true);
    try {
      if (trackingStatus === "active") {
        await trackingSessionService.stopTracking();
        Toast.show({
          type: "info",
          text1: "Tracking Paused",
          text2: "TourSafe is not recording GPS telemetry.",
        });
      } else {
        const result = await trackingSessionService.startTracking();
        if (result.success) {
          Toast.show({
            type: "success",
            text1: "Tracking Active",
            text2: "Live GPS safety monitoring engaged.",
          });
        }
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Tracking Error",
        text2: err?.message || "Action failed",
      });
    } finally {
      setActionInProgress(false);
    }
  }

  function handleQuickCall(number: string, serviceName: string) {
    Linking.openURL(`tel:${number}`).catch(() => {
      Toast.show({
        type: "info",
        text1: `Dial ${number}`,
        text2: `Calling ${serviceName}...`,
      });
    });
  }

  // Greeting by hour
  const currentHour = new Date().getHours();
  const greetingText =
    currentHour < 12
      ? "Good morning,"
      : currentHour < 17
      ? "Good afternoon,"
      : "Good evening,";

  const displayName = user?.full_name?.split(" ")[0] || "Traveler";
  const batteryPct =
    typeof batteryInfo?.level === "number" ? Math.round(batteryInfo.level) : 100;
  const gpsAcc = currentLocation?.accuracy
    ? Math.round(currentLocation.accuracy)
    : 4;

  const tripTitle = activeTrip?.title || "Kodaikanal";
  const tripSubtitle = activeTrip?.destination
    ? `${activeTrip.destination} & Forest Trail`
    : "Hill Station & Forest Trail";

  return (
    <ImageBackground
      source={require("@/assets/hero-bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Subtle misty tint overlay for maximum text contrast */}
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
            {/* Left Brand with Origami Navigation Arrow */}
            <View style={styles.brandRow}>
              <View style={styles.logoIcon}>
                <Navigation size={18} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={styles.brandText}>TOURSAFE</Text>
            </View>

            {/* Right Segmented Role Switcher: Traveler vs Authority */}
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

          {/* ── HERO GREETING ────────────────────────────────────── */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>{greetingText}</Text>
            <Text style={styles.greetingMain}>{displayName}</Text>
          </View>

          {/* ── HERO CURRENT TRIP GLASS CARD ─────────────────────── */}
          <View style={styles.currentTripCard}>
            {/* Left Column: Trip Info & Waypoint */}
            <View style={styles.tripInfoColumn}>
              <View style={styles.tripKickerRow}>
                <MapPin size={13} color="rgba(255, 255, 255, 0.85)" />
                <Text style={styles.tripKickerText}>Current Trip</Text>
              </View>

              <Text style={styles.tripTitle}>{tripTitle}</Text>
              <Text style={styles.tripSubtitle}>{tripSubtitle}</Text>

              <View style={styles.tripWaypointRow}>
                <View style={styles.waypointTextCol}>
                  <View style={styles.waypointLabelRow}>
                    <Navigation size={11} color="rgba(255, 255, 255, 0.85)" />
                    <Text style={styles.waypointLabelText}>
                      Next: Pillar Rocks Safe Kiosk
                    </Text>
                  </View>
                  <Text style={styles.waypointDistanceText}>1.4 km</Text>
                </View>

                <TouchableOpacity
                  style={styles.waypointCircleButton}
                  onPress={() => router.push("/tourist/(tabs)/map")}
                  activeOpacity={0.75}
                >
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Column: Satellite Map Route Thumbnail */}
            <TouchableOpacity
              style={styles.mapThumbContainer}
              onPress={() => router.push("/tourist/(tabs)/map")}
              activeOpacity={0.9}
            >
              <Image
                source={require("@/assets/route-thumb.jpg")}
                style={styles.mapThumbImage}
                resizeMode="cover"
              />

              {/* Luminous Blue Route SVG Overlay */}
              <View style={styles.mapSvgOverlay} pointerEvents="none">
                <Svg width="100%" height="100%" viewBox="0 0 120 120">
                  {/* Outer glowing route aura */}
                  <Path
                    d="M 18 90 C 35 85, 45 68, 62 48 C 72 35, 88 32, 102 18"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.35)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Crisp route core */}
                  <Path
                    d="M 18 90 C 35 85, 45 68, 62 48 C 72 35, 88 32, 102 18"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Start Waypoint Marker */}
                  <Circle cx="18" cy="90" r="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />
                  {/* End Destination Marker */}
                  <Circle cx="102" cy="18" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2.5" />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── GLANCEABLE STATUS CAPSULES ROW ───────────────────── */}
          <View style={styles.statusCapsulesRow}>
            {/* Capsule 1: GPS Accuracy */}
            <View style={styles.statusCapsule}>
              <View style={styles.capsuleIconWrap}>
                <MapPin size={16} color="#FFFFFF" />
              </View>
              <View style={styles.capsuleTextCol}>
                <Text style={styles.capsuleLabel}>GPS</Text>
                <View style={styles.capsuleValueRow}>
                  <View style={styles.liveGreenDot} />
                  <Text style={styles.capsuleValue}>±{gpsAcc} m</Text>
                </View>
              </View>
            </View>

            {/* Capsule 2: Battery Level */}
            <View style={styles.statusCapsule}>
              <View style={styles.capsuleIconWrap}>
                <Battery size={16} color="#FFFFFF" />
              </View>
              <View style={styles.capsuleTextCol}>
                <Text style={styles.capsuleLabel}>{batteryPct}%</Text>
                <View style={styles.capsuleValueRow}>
                  <View style={styles.liveGreenDot} />
                  <Text style={styles.capsuleValueSub}>Good</Text>
                </View>
              </View>
            </View>

            {/* Capsule 3: Real-Time Tracking */}
            <TouchableOpacity
              style={styles.statusCapsule}
              onPress={handleToggleTracking}
              activeOpacity={0.8}
            >
              <View style={styles.capsuleIconWrap}>
                <Activity size={16} color="#FFFFFF" />
              </View>
              <View style={styles.capsuleTextCol}>
                <Text style={styles.capsuleLabel}>Tracking</Text>
                <View style={styles.capsuleValueRow}>
                  <View style={styles.liveGreenDot} />
                  <Text style={styles.capsuleValue}>
                    {trackingStatus === "active" ? "On" : "Standby"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── QUICK ACTIONS SECTION ────────────────────────────── */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>

            <View style={styles.quickActionsGrid}>
              {/* Action 1: Map */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/tourist/(tabs)/map")}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIconCircle}>
                  <Navigation size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionLabel}>Map</Text>
              </TouchableOpacity>

              {/* Action 2: Digital ID */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/tourist/(tabs)/digital-id")}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIconCircle}>
                  <CreditCard size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionLabel}>Digital ID</Text>
              </TouchableOpacity>

              {/* Action 3: Safe Zones */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/tourist/(tabs)/safety")}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIconCircle}>
                  <Shield size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionLabel}>Safe Zones</Text>
              </TouchableOpacity>

              {/* Action 4: Incident Report */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/tourist/(tabs)/incidents")}
                activeOpacity={0.8}
              >
                <View style={styles.quickActionIconCircle}>
                  <FileText size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionLabel}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── EMERGENCY ASSISTANCE SECTION ─────────────────────── */}
          <View style={styles.emergencyCard}>
            <TouchableOpacity
              style={styles.emergencyHeaderRow}
              onPress={() => setEmergencyExpanded(!emergencyExpanded)}
              activeOpacity={0.85}
            >
              <Text style={styles.emergencyTitle}>Emergency Assistance</Text>
              <View style={styles.expandRow}>
                <Text style={styles.expandText}>
                  {emergencyExpanded ? "Collapse" : "Expand"}
                </Text>
                {emergencyExpanded ? (
                  <ChevronUp size={14} color="rgba(255, 255, 255, 0.85)" />
                ) : (
                  <ChevronDown size={14} color="rgba(255, 255, 255, 0.85)" />
                )}
              </View>
            </TouchableOpacity>

            {emergencyExpanded && (
              <View style={styles.emergencyPillsRow}>
                {/* 112 Police Pill */}
                <TouchableOpacity
                  style={[styles.emergencyPill, styles.pillPolice]}
                  onPress={() => handleQuickCall("112", "Police Control Room")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pillIconCircle, styles.pillIconPolice]}>
                    <Phone size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.pillTextCol}>
                    <Text style={styles.pillNumber}>112</Text>
                    <Text style={styles.pillLabel}>Police</Text>
                  </View>
                </TouchableOpacity>

                {/* 108 Medical Pill */}
                <TouchableOpacity
                  style={[styles.emergencyPill, styles.pillMedical]}
                  onPress={() => handleQuickCall("108", "Medical Ambulance")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pillIconCircle, styles.pillIconMedical]}>
                    <Phone size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.pillTextCol}>
                    <Text style={styles.pillNumber}>108</Text>
                    <Text style={styles.pillLabel}>Medical</Text>
                  </View>
                </TouchableOpacity>

                {/* 1091 Women Helpline Pill */}
                <TouchableOpacity
                  style={[styles.emergencyPill, styles.pillWomen]}
                  onPress={() => handleQuickCall("1091", "Women Safety Helpline")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pillIconCircle, styles.pillIconWomen]}>
                    <Phone size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.pillTextCol}>
                    <Text style={styles.pillNumber}>1091</Text>
                    <Text style={styles.pillLabel}>Women</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: "rgba(15, 23, 42, 0.18)",
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
    marginBottom: 20,
    marginTop: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  /* ── GREETING ── */
  greetingBlock: {
    marginBottom: 18,
  },
  greetingSub: {
    fontSize: 20,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.95)",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  greetingMain: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: -2,
  },

  /* ── CURRENT TRIP GLASS CARD ── */
  currentTripCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        } as any)
      : {}),
  },
  tripInfoColumn: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 10,
  },
  tripKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  tripKickerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.3,
  },
  tripTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  tripSubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 2,
    marginBottom: 12,
  },
  tripWaypointRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  waypointTextCol: {
    flex: 1,
  },
  waypointLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waypointLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  waypointDistanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  waypointCircleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  mapThumbContainer: {
    width: 120,
    height: 120,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  mapThumbImage: {
    width: "100%",
    height: "100%",
  },
  mapSvgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  /* ── STATUS CAPSULES ROW ── */
  statusCapsulesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statusCapsule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  capsuleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleTextCol: {
    flex: 1,
  },
  capsuleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  capsuleValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  capsuleValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  capsuleValueSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },

  /* ── QUICK ACTIONS ── */
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  quickActionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* ── EMERGENCY ASSISTANCE CARD ── */
  emergencyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 14,
    marginBottom: 20,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  emergencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  expandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  emergencyPillsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  emergencyPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
  },
  pillPolice: {
    backgroundColor: "rgba(59, 130, 246, 0.28)",
    borderColor: "rgba(96, 165, 250, 0.45)",
  },
  pillMedical: {
    backgroundColor: "rgba(239, 68, 68, 0.28)",
    borderColor: "rgba(248, 113, 113, 0.45)",
  },
  pillWomen: {
    backgroundColor: "rgba(168, 85, 247, 0.28)",
    borderColor: "rgba(192, 132, 252, 0.45)",
  },
  pillIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pillIconPolice: {
    backgroundColor: "#3B82F6",
  },
  pillIconMedical: {
    backgroundColor: "#EF4444",
  },
  pillIconWomen: {
    backgroundColor: "#A855F7",
  },
  pillTextCol: {
    flex: 1,
  },
  pillNumber: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
});
