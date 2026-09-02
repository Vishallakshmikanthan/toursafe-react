/**
 * TourSafe Tourist Home Dashboard
 * Premium Personal Safety Companion Hub with Executive Travel UI.
 * Features:
 * 1. Responsive Centered Layout with Max-Width Grid for Mobile & Desktop
 * 2. Active Safety Shield & Live Status Score
 * 3. Compact Emergency SOS Action Hub & Rapid Helplines
 * 4. Verified Tourist Digital ID Quick Card
 * 5. Trip & Geofenced Itinerary Companion
 * 6. Live Edge Telemetry Cockpit (GPS, IMU, Battery, Cloud Sync)
 * 7. Live Safe Zones & Interactive Map Gateway
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
  Alert as RNAlert,
} from "react-native";
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
import { useAlertStore } from "@/store/alertStore";
import { touristApi } from "@/lib/api";
import { trackingSessionService } from "@/lib/tracking-session/trackingSessionService";
import { imuController } from "@/lib/sensors/imuController";
import RoleSwitch from "@/components/RoleSwitch";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { NotificationBellButton } from "@/components/NotificationBellButton";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  MapPin,
  Calendar,
  Radio,
  Activity,
  Phone,
  ArrowRight,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Clock,
  Battery,
  Wifi,
  WifiOff,
  Plus,
  Navigation,
  MessageSquare,
  AlertOctagon,
  QrCode,
  Sparkles,
  ChevronRight,
  UserCheck,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function TouristDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { touristSafetyStatus, setTouristSafetyStatus } = useSafetyStore();
  const { trackingStatus, currentLocation, qualityMetrics } = useLocationStore();
  const { imuStatus, qualityMetrics: imuQuality } = useIMUStore();
  const { sosStatus, activeIncidentId } = useSOSStore();
  const { trips, activeTrip, fetchTrips, completeActiveTrip } = useTripStore();
  const { activeZones, primaryZoneType, highestRiskLevel } = useGeofenceStore();
  const { batteryInfo } = useBatteryStore();
  const { networkState } = useConnectivityStore();
  const { alerts } = useAlertStore();

  const [loading, setLoading] = useState(true);
  const [anomalyPending, setAnomalyPending] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    imuController.checkAvailability();
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      await Promise.all([fetchTrips(), fetchSafetyStatus()]);
    } catch (e) {
      console.warn("[Dashboard] Load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSafetyStatus() {
    try {
      const res = await touristApi.getMyProfileStatus();
      if (res?.data) {
        setTouristSafetyStatus(res.data);
      }
    } catch (e) {
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
          text2: "TourSafe is not currently recording GPS telemetry.",
        });
      } else {
        const result = await trackingSessionService.startTracking();
        if (result.success) {
          Toast.show({
            type: "success",
            text1: "Tracking Active",
            text2: "Live GPS & motion safety telemetry active.",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Tracking Error",
            text2: result.error || "Could not start session",
          });
        }
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.message || "Action failed",
      });
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleConfirmSafe() {
    try {
      setAnomalyPending(false);
      Toast.show({
        type: "success",
        text1: "Status Confirmed Safe",
        text2: "Thank you for confirming your safety.",
      });
    } catch (err) {
      console.warn("Safety confirm error:", err);
    }
  }

  function handleNeedHelp() {
    setAnomalyPending(false);
    router.push("/tourist/(tabs)/sos");
  }

  async function handleCompleteTrip() {
    RNAlert.alert(
      "Complete Trip",
      "Are you sure you want to complete this trip? This will stop active tracking and archive your itinerary.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete Trip",
          style: "destructive",
          onPress: async () => {
            await trackingSessionService.stopTracking();
            const success = await completeActiveTrip();
            if (success) {
              Toast.show({
                type: "success",
                text1: "Trip Completed",
                text2: "Trip safely concluded. Tracking stopped.",
              });
            }
          },
        },
      ]
    );
  }

  // Determine current safety state
  const rawSafetyState = touristSafetyStatus?.safety_status || "Normal";
  const isElevated =
    rawSafetyState.toLowerCase() === "elevated" ||
    rawSafetyState.toLowerCase() === "watch";
  const isIncident =
    rawSafetyState.toLowerCase() === "incident" ||
    sosStatus === "triggered" ||
    !!activeIncidentId;
  const isSafe =
    rawSafetyState.toLowerCase() === "normal" ||
    rawSafetyState.toLowerCase() === "safe";
  const isUnknown = rawSafetyState.toLowerCase() === "unknown";
  const isOffline = !networkState.isConnected;

  const displayName = user?.full_name || user?.name || "Traveler";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mainWrapper}>
        {/* TOP BAR: Role Switch + Connection & Notifications */}
        <View style={styles.topBar}>
          <RoleSwitch currentRole="tourist" />
          <View style={styles.topBarRight}>
            <ConnectionStatusBadge />
            <NotificationBellButton />
          </View>
        </View>

        {/* WELCOME BANNER & GREETING */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeKicker}>TOURIST SAFETY COMPANION</Text>
            <Text style={styles.welcomeTitle}>
              Hello, <Text style={styles.welcomeHighlight}>{displayName}</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Protected by AI Geofencing & Authority Rapid Response
            </Text>
          </View>
          <View style={styles.quickStatusPill}>
            <View
              style={[
                styles.liveStatusDot,
                { backgroundColor: isSafe ? "#10B981" : isElevated ? "#F59E0B" : "#EF4444" },
              ]}
            />
            <Text style={styles.quickStatusText}>
              {isSafe ? "Shield Active" : isElevated ? "Caution Active" : "Emergency"}
            </Text>
          </View>
        </View>

        {/* OFFLINE RESILIENCE BANNER */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <View style={styles.offlineIconBox}>
              <WifiOff size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Offline Store-and-Forward Active</Text>
              <Text style={styles.offlineSub}>
                Telemetry & safety checks are securely buffered locally. Emergency SOS will use SMS fallback.
              </Text>
            </View>
          </View>
        )}

        {/* BATTERY LOW WARNING */}
        {batteryInfo.level <= 15 && (
          <View style={styles.batteryBanner}>
            <View style={styles.batteryIconBox}>
              <Battery size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.batteryTitle}>Battery Critical ({batteryInfo.level}%)</Text>
              <Text style={styles.batterySub}>
                Power conservation engaged. Emergency SOS and SOS beacon remain priority armed.
              </Text>
            </View>
          </View>
        )}

        {/* ACTIVE INCIDENT HERO ALERT */}
        {isIncident && (
          <View style={styles.incidentHero}>
            <View style={styles.incidentHeader}>
              <View style={styles.incidentPulse}>
                <AlertOctagon size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incidentKicker}>ACTIVE EMERGENCY INCIDENT</Text>
                <Text style={styles.incidentTitle}>Emergency Assistance Dispatched</Text>
              </View>
            </View>
            <Text style={styles.incidentDesc}>
              Authority Command Center has been alerted with your real-time coordinates. Response units have been notified.
            </Text>
            <View style={styles.incidentActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open Incident Command"
                style={styles.incidentPrimaryBtn}
                onPress={() => router.push("/tourist/(tabs)/incidents")}
              >
                <MessageSquare size={16} color="#FFFFFF" />
                <Text style={styles.incidentBtnText}>Open Incident Command & Chat</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View SOS Details"
                style={styles.incidentSecondaryBtn}
                onPress={() => router.push("/tourist/(tabs)/sos")}
              >
                <ShieldAlert size={16} color="#DC2626" />
                <Text style={styles.incidentSecText}>View SOS Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ANOMALY ALERT MODAL BANNER */}
        {anomalyPending && !isIncident && (
          <View style={styles.anomalyCard}>
            <View style={styles.anomalyHeader}>
              <AlertTriangle size={22} color="#D97706" />
              <Text style={styles.anomalyTitle}>Unusual Motion Detected</Text>
            </View>
            <Text style={styles.anomalyDesc}>
              Our IMU safety sensors detected sudden acceleration or impact. Please confirm you are safe.
            </Text>
            <View style={styles.anomalyButtons}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Confirm Safe"
                style={styles.safeBtn}
                onPress={handleConfirmSafe}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.safeBtnText}>I AM SAFE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Need Help"
                style={styles.helpBtn}
                onPress={handleNeedHelp}
              >
                <ShieldAlert size={16} color="#FFFFFF" />
                <Text style={styles.helpBtnText}>I NEED HELP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PRIMARY 2-CARD EXECUTIVE SAFETY & SOS MODULE */}
        <View style={styles.heroRow}>
          {/* Card 1: Safety Shield Status */}
          <View style={styles.safetyCard}>
            <View style={styles.safetyCardTop}>
              <View
                style={[
                  styles.safetyIconBadge,
                  isSafe && styles.badgeSafe,
                  isElevated && styles.badgeElevated,
                  isIncident && styles.badgeIncident,
                  isUnknown && styles.badgeUnknown,
                ]}
              >
                {isSafe ? (
                  <ShieldCheck size={26} color="#059669" />
                ) : isElevated ? (
                  <AlertTriangle size={26} color="#D97706" />
                ) : isIncident ? (
                  <ShieldAlert size={26} color="#DC2626" />
                ) : (
                  <Shield size={26} color="#64748B" />
                )}
              </View>
              <View style={styles.safetyBadgeWrapper}>
                <Text
                  style={[
                    styles.statusPillBadgeText,
                    isSafe && styles.textSafe,
                    isElevated && styles.textElevated,
                    isIncident && styles.textIncident,
                  ]}
                >
                  {isSafe ? "PROTECTED" : isElevated ? "ELEVATED" : "ALERT"}
                </Text>
              </View>
            </View>

            <View style={styles.safetyCardBody}>
              <Text style={styles.safetyCardKicker}>SYSTEM PROTECTION</Text>
              <Text style={styles.safetyCardTitle}>
                {isSafe
                  ? "All Normal & Safe"
                  : isElevated
                  ? "Caution Advised"
                  : isIncident
                  ? "Incident Active"
                  : "Safety Standby"}
              </Text>
              <Text style={styles.safetyCardSub}>
                {touristSafetyStatus?.guidance_message ||
                  (isSafe
                    ? "Current zone and movement patterns match normal travel safety standards."
                    : "Please maintain standard awareness of your immediate surroundings.")}
              </Text>
            </View>

            <View style={styles.safetyCardFooter}>
              <View style={styles.safetyFooterItem}>
                <Sparkles size={14} color="#0284C7" />
                <Text style={styles.safetyFooterText}>AI Guard Active</Text>
              </View>
              <TouchableOpacity
                style={styles.safetyDetailsBtn}
                onPress={() => router.push("/tourist/(tabs)/map")}
              >
                <Text style={styles.safetyDetailsBtnText}>Check Zone</Text>
                <ChevronRight size={14} color="#0284C7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Emergency Response Hub */}
          <View style={styles.sosCard}>
            <View style={styles.sosCardHeader}>
              <View style={styles.sosHeaderIconBox}>
                <ShieldAlert size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosCardKicker}>RAPID DISPATCH</Text>
                <Text style={styles.sosCardTitle}>Emergency Response Hub</Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Trigger Emergency SOS"
              style={styles.sosTriggerBtn}
              onPress={() => router.push("/tourist/(tabs)/sos")}
              activeOpacity={0.88}
            >
              <View style={styles.sosInnerRow}>
                <View style={styles.sosIconCircle}>
                  <ShieldAlert size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosBtnTitle}>TRIGGER EMERGENCY SOS</Text>
                  <Text style={styles.sosBtnSubtitle}>
                    Instant Police & Medical Alert with Verified GPS
                  </Text>
                </View>
                <ArrowRight size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.emergencyHelplines}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Call Police 112"
                style={styles.helplineBtn}
                onPress={() => Linking.openURL("tel:112")}
              >
                <Phone size={13} color="#0284C7" />
                <Text style={styles.helplineText}>Police (112)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Call Ambulance 108"
                style={styles.helplineBtn}
                onPress={() => Linking.openURL("tel:108")}
              >
                <Phone size={13} color="#DC2626" />
                <Text style={styles.helplineText}>Ambulance (108)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Emergency Contacts"
                style={styles.helplineBtn}
                onPress={() => router.push("/tourist/(tabs)/profile")}
              >
                <UserCheck size={13} color="#059669" />
                <Text style={styles.helplineText}>SOS Contacts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* VERIFIED DIGITAL ID QUICK PASS */}
        <View style={styles.digitalIdBanner}>
          <View style={styles.digitalIdLeft}>
            <View style={styles.digitalIdIconBox}>
              <QrCode size={22} color="#0284C7" />
            </View>
            <View>
              <View style={styles.digitalIdTitleRow}>
                <Text style={styles.digitalIdTitle}>Verified Tourist Digital ID</Text>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={11} color="#059669" />
                  <Text style={styles.verifiedBadgeText}>GOVT RECOGNIZED</Text>
                </View>
              </View>
              <Text style={styles.digitalIdSub}>
                ID: {user?.id ? `IND-TS-${user.id.slice(0, 8).toUpperCase()}` : "IND-TS-ACTIVE"} • Tap to present official QR
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.digitalIdActionBtn}
            onPress={() => router.push("/tourist/(tabs)/digital-id")}
          >
            <Text style={styles.digitalIdActionText}>View Pass</Text>
            <ArrowRight size={14} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {/* ACTIVE TRIP OR JOURNEY PLANNER */}
        {activeTrip ? (
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.tripHeaderTopRow}>
                  <Text style={styles.tripKicker}>CURRENT ITINERARY</Text>
                  <View style={styles.activeTripBadge}>
                    <Text style={styles.activeTripBadgeText}>IN PROGRESS</Text>
                  </View>
                </View>
                <Text style={styles.tripTitle}>{activeTrip.title}</Text>
                <View style={styles.tripMetaRow}>
                  <MapPin size={13} color="#0284C7" />
                  <Text style={styles.tripMetaText}>{activeTrip.destination}</Text>
                  <Text style={styles.tripDot}>•</Text>
                  <Calendar size={13} color="#64748B" />
                  <Text style={styles.tripMetaText}>
                    {new Date(activeTrip.start_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Complete Trip"
                style={styles.completeTripBtn}
                onPress={handleCompleteTrip}
              >
                <Text style={styles.completeTripText}>Conclude Trip</Text>
              </TouchableOpacity>
            </View>

            {activeTrip.itinerary_stops && activeTrip.itinerary_stops.length > 0 && (
              <View style={styles.waypointBox}>
                <View style={styles.waypointIconBox}>
                  <Compass size={16} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.waypointLabel}>Next Planned Checkpoint</Text>
                  <Text style={styles.waypointName}>
                    {activeTrip.itinerary_stops[0].name || "First Waypoint"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.waypointAction}
                  onPress={() => router.push("/tourist/(tabs)/itinerary")}
                >
                  <Text style={styles.waypointLink}>Full Schedule</Text>
                  <ArrowRight size={13} color="#0284C7" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noTripCard}>
            <View style={styles.noTripLeft}>
              <View style={styles.noTripIconCircle}>
                <Compass size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noTripTitle}>No Active Journey Planned</Text>
                <Text style={styles.noTripSub}>
                  Create your trip itinerary to unlock proactive safe-corridor guidance and waypoint alerts.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Plan New Trip"
              style={styles.createTripBtn}
              onPress={() => router.push("/tourist/(tabs)/itinerary")}
            >
              <Plus size={15} color="#FFFFFF" />
              <Text style={styles.createTripText}>Plan New Trip</Text>
              <ArrowRight size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* DEVICE TELEMETRY & EDGE STATUS COCKPIT */}
        <View style={styles.telemetrySection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>DEVICE TELEMETRY & SENSOR COCKPIT</Text>
              <Text style={styles.sectionSub}>
                Real-time safety signals monitored on-device and synchronized
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Toggle Tracking"
              onPress={handleToggleTracking}
              disabled={actionInProgress}
              style={[
                styles.trackingToggleBtn,
                trackingStatus === "active" ? styles.toggleActive : styles.toggleInactive,
              ]}
            >
              {actionInProgress ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Radio size={13} color="#FFFFFF" />
                  <Text style={styles.toggleText}>
                    {trackingStatus === "active" ? "Tracking Active" : "Resume Tracking"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.statusGrid}>
            {/* GPS Telemetry */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardTop}>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: trackingStatus === "active" ? "#ECFDF5" : "#F1F5F9" },
                  ]}
                >
                  <MapPin
                    size={16}
                    color={trackingStatus === "active" ? "#059669" : "#64748B"}
                  />
                </View>
                <Text style={styles.statusCardLabel}>GPS Fix</Text>
              </View>
              <Text style={styles.statusCardValue}>
                {trackingStatus === "active" ? "Active (High)" : "Standby"}
              </Text>
              <Text style={styles.statusCardSub}>
                {currentLocation
                  ? `±${(currentLocation.accuracy || 5).toFixed(0)}m accuracy`
                  : "Tracking off"}
              </Text>
            </View>

            {/* IMU Motion Sensor */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardTop}>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: imuStatus === "active" ? "#ECFDF5" : "#F0F9FF" },
                  ]}
                >
                  <Activity
                    size={16}
                    color={imuStatus === "active" ? "#059669" : "#0284C7"}
                  />
                </View>
                <Text style={styles.statusCardLabel}>IMU Guard</Text>
              </View>
              <Text style={styles.statusCardValue}>
                {imuStatus === "active" ? "Streaming" : "Armed (50Hz)"}
              </Text>
              <Text style={styles.statusCardSub}>
                {imuQuality.observedFrequencyHz > 0
                  ? `${imuQuality.observedFrequencyHz.toFixed(0)} Hz stream active`
                  : "Fall & impact detection"}
              </Text>
            </View>

            {/* Cloud & Store-and-Forward Sync */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardTop}>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: networkState.isConnected ? "#ECFDF5" : "#FFFBEB" },
                  ]}
                >
                  {networkState.isConnected ? (
                    <Wifi size={16} color="#059669" />
                  ) : (
                    <WifiOff size={16} color="#D97706" />
                  )}
                </View>
                <Text style={styles.statusCardLabel}>Cloud Sync</Text>
              </View>
              <Text style={styles.statusCardValue}>
                {networkState.isConnected ? "Direct Stream" : "Local FIFO"}
              </Text>
              <Text style={styles.statusCardSub}>
                {networkState.isConnected ? "Encrypted websocket" : "Offline queue safe"}
              </Text>
            </View>

            {/* Battery Power */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardTop}>
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: batteryInfo.level <= 15 ? "#FEF2F2" : "#ECFDF5" },
                  ]}
                >
                  <Battery
                    size={16}
                    color={batteryInfo.level <= 15 ? "#DC2626" : "#059669"}
                  />
                </View>
                <Text style={styles.statusCardLabel}>Battery Life</Text>
              </View>
              <Text style={styles.statusCardValue}>{batteryInfo.level}%</Text>
              <Text style={styles.statusCardSub}>
                {batteryInfo.isCharging ? "Charging" : "Adaptive mode"}
              </Text>
            </View>
          </View>
        </View>

        {/* LIVE SAFE HAVENS & CORRIDOR MAP ACCESS */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open Live Safety Map"
          style={styles.mapShortcutCard}
          onPress={() => router.push("/tourist/(tabs)/map")}
          activeOpacity={0.85}
        >
          <View style={styles.mapShortcutIconBox}>
            <Navigation size={22} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mapShortcutTitle}>Live Safety Map & Zones</Text>
            <Text style={styles.mapShortcutSub}>
              {activeZones.length > 0
                ? `Currently within ${activeZones.length} verified safety zone(s)`
                : "Explore safe corridors, police assistance kiosks, and tourist safe havens."}
            </Text>
          </View>
          <View style={styles.mapShortcutArrowBox}>
            <ArrowRight size={18} color="#0284C7" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingBottom: 54,
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
    gap: 16,
  },

  // TOP BAR
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // WELCOME SECTION
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    flexWrap: "wrap",
    gap: 12,
  },
  welcomeLeft: {
    flex: 1,
    minWidth: 240,
  },
  welcomeKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  welcomeHighlight: {
    color: "#0284C7",
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  quickStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "center",
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },

  // BANNERS
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  offlineSub: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 16,
  },

  batteryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  batteryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  batteryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#991B1B",
  },
  batterySub: {
    fontSize: 11,
    color: "#DC2626",
    marginTop: 2,
    lineHeight: 16,
  },

  // INCIDENT HERO
  incidentHero: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    gap: 12,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  incidentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  incidentPulse: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  incidentKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.8,
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#991B1B",
    marginTop: 2,
  },
  incidentDesc: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
  },
  incidentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  incidentPrimaryBtn: {
    flex: 1,
    minWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  incidentBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  incidentSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  incidentSecText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 13,
  },

  // ANOMALY CARD
  anomalyCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    gap: 10,
  },
  anomalyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  anomalyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400E",
  },
  anomalyDesc: {
    fontSize: 12,
    color: "#B45309",
    lineHeight: 18,
  },
  anomalyButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  safeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  safeBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  helpBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  helpBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  // HERO SECTION: SAFETY SHIELD & EMERGENCY SOS (RESPONSIVE GRID)
  heroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  // SAFETY CARD
  safetyCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
    gap: 14,
  },
  safetyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  safetyIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSafe: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeElevated: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  badgeIncident: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  badgeUnknown: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  safetyBadgeWrapper: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusPillBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  textSafe: {
    color: "#059669",
  },
  textElevated: {
    color: "#D97706",
  },
  textIncident: {
    color: "#DC2626",
  },
  safetyCardBody: {
    gap: 4,
  },
  safetyCardKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
  },
  safetyCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  safetyCardSub: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginTop: 2,
  },
  safetyCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  safetyFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  safetyFooterText: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "600",
  },
  safetyDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  safetyDetailsBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284C7",
  },

  // EMERGENCY RESPONSE HUB
  sosCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
    gap: 14,
  },
  sosCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sosHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sosCardKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.6,
  },
  sosCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  sosTriggerBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  sosInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sosIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosBtnTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  sosBtnSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  emergencyHelplines: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  helplineBtn: {
    flex: 1,
    minWidth: 95,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  helplineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },

  // DIGITAL ID QUICK PASS
  digitalIdBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    flexWrap: "wrap",
    gap: 10,
  },
  digitalIdLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  digitalIdIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  digitalIdTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  digitalIdTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: 0.4,
  },
  digitalIdSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  digitalIdActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  digitalIdActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284C7",
  },

  // TRIP CARD
  tripCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 10,
  },
  tripHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.8,
  },
  activeTripBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTripBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  tripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  tripMetaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  tripDot: {
    color: "#CBD5E1",
  },
  completeTripBtn: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  completeTripText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  waypointBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  waypointIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  waypointLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#64748B",
    fontWeight: "700",
  },
  waypointName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
  waypointAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waypointLink: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "700",
  },

  // NO TRIP CARD
  noTripCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  noTripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  noTripIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  noTripTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  noTripSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  createTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  createTripText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  // TELEMETRY SECTION
  telemetrySection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  trackingToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: "#059669",
  },
  toggleInactive: {
    backgroundColor: "#0284C7",
  },
  toggleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCardLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  statusCardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  statusCardSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },

  // MAP SHORTCUT CARD
  mapShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  mapShortcutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  mapShortcutTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  mapShortcutSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  mapShortcutArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
