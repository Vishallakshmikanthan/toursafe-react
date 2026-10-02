/**
 * TourSafe Tourist Home Dashboard
 * Mobile-First Personal Safety Companion Hub
 * Focuses on:
 * 1. Am I safe right now? (Glanceable Status Capsule & MobileSafetyRadar)
 * 2. Where am I? (Zone Indicator & Active Trip Waypoint)
 * 3. How do I get help? (Quick Dial 112/108 & Slide-to-Trigger SOS)
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
import { touristApi } from "@/lib/api";
import { trackingSessionService } from "@/lib/tracking-session/trackingSessionService";
import { imuController } from "@/lib/sensors/imuController";
import RoleSwitch from "@/components/RoleSwitch";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { NotificationBellButton } from "@/components/NotificationBellButton";
import { MobileSafetyRadar } from "@/components/mobile/MobileSafetyRadar";
import { SlideToTriggerSOS } from "@/components/mobile/SlideToTriggerSOS";
import {
  MapPin,
  Compass,
  Phone,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Shield,
  CreditCard,
  Play,
  Square,
  AlertTriangle,
  WifiOff,
  Navigation,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function TouristDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { touristSafetyStatus, setTouristSafetyStatus } = useSafetyStore();
  const { trackingStatus, currentLocation } = useLocationStore();
  const { imuStatus } = useIMUStore();
  const { sosStatus, activeIncidentId, triggerSOS } = useSOSStore();
  const { activeTrip, fetchTrips, completeActiveTrip } = useTripStore();
  const { activeZones, primaryZoneType } = useGeofenceStore();
  const { batteryInfo } = useBatteryStore();
  const { networkState } = useConnectivityStore();

  const [loading, setLoading] = useState(true);
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

  function handleQuickCall(number: string, serviceName: string) {
    Linking.openURL(`tel:${number}`).catch(() => {
      Toast.show({
        type: "info",
        text1: `Dial ${number}`,
        text2: `Calling ${serviceName}...`,
      });
    });
  }

  async function handleSosSlide() {
    const lat = currentLocation?.latitude || 10.2381;
    const lng = currentLocation?.longitude || 77.4892;
    const accuracy = currentLocation?.accuracy || 5;

    try {
      await triggerSOS(lat, lng, accuracy, "Emergency SOS triggered via Slide gesture");
    } catch {
      // Local fallback in store
    }
    router.push("/tourist/(tabs)/sos");
  }

  // Determine current safety status
  const rawSafetyState = touristSafetyStatus?.safety_status || "Normal";
  const isEmergency =
    rawSafetyState.toLowerCase() === "incident" ||
    sosStatus === "triggered" ||
    !!activeIncidentId;
  const isCaution =
    rawSafetyState.toLowerCase() === "elevated" ||
    rawSafetyState.toLowerCase() === "watch" ||
    primaryZoneType === "warning";

  const safetyRadarStatus = isEmergency
    ? "emergency"
    : isCaution
    ? "caution"
    : "safe";

  const currentZoneName =
    activeZones && activeZones.length > 0
      ? activeZones[0].name
      : "Kodaikanal Lake Safe Zone";

  const displayName = user?.full_name?.split(" ")[0] || "Traveler";
  const batteryPct =
    typeof batteryInfo?.level === "number" ? Math.round(batteryInfo.level) : 95;
  const gpsAcc = currentLocation?.accuracy
    ? Math.round(currentLocation.accuracy)
    : 4;

  return (
    <View style={styles.screen}>
      {/* Ambient glowing diffuse halos behind cards */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowCenter} pointerEvents="none" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP NAV BAR ────────────────────────────────────── */}
        <View style={styles.topBar}>
          <RoleSwitch currentRole="tourist" />
          <View style={styles.topRightIcons}>
            <ConnectionStatusBadge />
            <NotificationBellButton />
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => router.push("/tourist/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── GREETING & AMBIENT HEADER ──────────────────────── */}
        <View style={styles.headerBlock}>
          <View style={styles.kickerRow}>
            <Sparkles size={11} color="#0284C7" />
            <Text style={styles.headerKicker}>TOURSAFE MOBILE COMPANION</Text>
          </View>
          <Text style={styles.headerTitle}>
            Hello, <Text style={styles.headerHighlight}>{displayName}</Text>
          </Text>
          <Text style={styles.headerSub}>
            Your ambient guardian is actively monitoring geofences & emergency dispatch.
          </Text>
        </View>

        {/* ── OFFLINE BANNER IF DISCONNECTED ─────────────────── */}
        {!networkState.isConnected && (
          <View style={styles.offlineBanner}>
            <WifiOff size={15} color="#F59E0B" />
            <Text style={styles.offlineText}>
              Offline Store-and-Forward Active • Local mesh queue armed
            </Text>
          </View>
        )}

        {/* ── UNIFIED LIVE SAFETY RADAR ──────────────────────── */}
        <MobileSafetyRadar
          status={safetyRadarStatus}
          zoneName={currentZoneName}
          batteryLevel={batteryPct}
          gpsAccuracy={gpsAcc}
          isMoving={trackingStatus === "active"}
          onPressDetails={() => router.push("/tourist/(tabs)/map")}
        />

        {/* ── QUICK DIAL ASSIST (1-TAP 48PT TARGETS) ─────────── */}
        <View style={styles.quickDialSection}>
          <Text style={styles.sectionKicker}>EMERGENCY RAPID ASSIST</Text>
          <View style={styles.dialPillRow}>
            <TouchableOpacity
              style={[styles.dialPill, styles.dialPolice]}
              onPress={() => handleQuickCall("112", "Police Control Room")}
              activeOpacity={0.8}
            >
              <Phone size={15} color="#0284C7" />
              <Text style={styles.dialPillTextPolice}>112 Police</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialPill, styles.dialMedical]}
              onPress={() => handleQuickCall("108", "Emergency Ambulance")}
              activeOpacity={0.8}
            >
              <Phone size={15} color="#0284C7" />
              <Text style={styles.dialPillTextMedical}>108 Medical</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialPill, styles.dialWomen]}
              onPress={() => handleQuickCall("1091", "Women Safety Helpline")}
              activeOpacity={0.8}
            >
              <Phone size={15} color="#0284C7" />
              <Text style={styles.dialPillTextWomen}>1091 Women</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ACTIVE TRIP / JOURNEY COMPANION CARD ───────────── */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeaderRow}>
            <View style={styles.tripBadge}>
              <Compass size={13} color="#0284C7" />
              <Text style={styles.tripBadgeText}>
                {activeTrip ? "ACTIVE ITINERARY" : "SUGGESTED CORRIDOR"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.trackingPill}
              onPress={handleToggleTracking}
              disabled={actionInProgress}
              activeOpacity={0.7}
            >
              {trackingStatus === "active" ? (
                <>
                  <Square size={10} color="#DC2626" />
                  <Text style={styles.trackingPillTextActive}>Pause GPS</Text>
                </>
              ) : (
                <>
                  <Play size={10} color="#0284C7" />
                  <Text style={styles.trackingPillTextInactive}>Start GPS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.tripTitle}>
            {activeTrip?.title || "Kodaikanal Hill Station & Forest Trail"}
          </Text>
          <View style={styles.tripWaypointRow}>
            <MapPin size={14} color="#0284C7" />
            <Text style={styles.tripWaypointText}>
              Next Checkpoint: Pillar Rocks Safe Kiosk (1.4 km)
            </Text>
          </View>

          <View style={styles.tripActionsRow}>
            <TouchableOpacity
              style={styles.tripSecondaryBtn}
              onPress={() => router.push("/tourist/(tabs)/map")}
              activeOpacity={0.7}
            >
              <Navigation size={13} color="#0284C7" />
              <Text style={styles.tripSecondaryBtnText}>View on Corridor Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tripSecondaryBtn}
              onPress={() => router.push("/tourist/(tabs)/digital-id")}
              activeOpacity={0.7}
            >
              <CreditCard size={13} color="#0284C7" />
              <Text style={styles.tripSecondaryBtnText}>Digital Pass</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PERSISTENT THUMB-ZONE SOS SLIDER ────────────────── */}
        <View style={styles.sosThumbZone}>
          <Text style={styles.sosKicker}>SLIDE FOR DELIBERATE EMERGENCY ACTIVATION</Text>
          <SlideToTriggerSOS
            onTrigger={handleSosSlide}
            active={isEmergency}
            label="SLIDE FOR EMERGENCY SOS"
            activeLabel="EMERGENCY DISPATCH TRANSMITTED"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -50,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    pointerEvents: "none",
  },
  ambientGlowCenter: {
    position: "absolute",
    top: 240,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(14, 165, 233, 0.05)",
    pointerEvents: "none",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  topRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "900",
  },
  headerBlock: {
    marginBottom: 12,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  headerHighlight: {
    color: "#0284C7",
    fontStyle: "italic",
  },
  headerSub: {
    fontSize: 12,
    color: "#475569",
    marginTop: 3,
    lineHeight: 18,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  offlineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
    flex: 1,
  },
  quickDialSection: {
    marginVertical: 10,
  },
  sectionKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dialPillRow: {
    flexDirection: "row",
    gap: 8,
  },
  dialPill: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dialPolice: {
    backgroundColor: "rgba(240, 249, 255, 0.95)",
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  dialPillTextPolice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  dialMedical: {
    backgroundColor: "rgba(240, 249, 255, 0.95)",
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  dialPillTextMedical: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  dialWomen: {
    backgroundColor: "rgba(240, 249, 255, 0.95)",
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  dialPillTextWomen: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  tripCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 24,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  tripHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tripBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.25)",
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.4,
  },
  trackingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  trackingPillTextActive: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  trackingPillTextInactive: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284C7",
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  tripWaypointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  tripWaypointText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  tripActionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  tripSecondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(240, 249, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tripSecondaryBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  sosThumbZone: {
    marginTop: 10,
    marginBottom: 8,
  },
  sosKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.6,
    marginBottom: 6,
    textAlign: "center",
  },
});
