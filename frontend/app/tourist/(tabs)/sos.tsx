/**
 * TourSafe Emergency SOS Experience
 * Mobile-First Personal Safety & Emergency Dispatch Hub
 * Upgraded to TourSafe Glassmorphism Design System & Live Backend API.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSOSStore } from "@/store/sosStore";
import { useLocationStore } from "@/store/locationStore";
import { useBatteryStore } from "@/store/batteryStore";
import { useConnectivityStore } from "@/store/connectivityStore";
import { useAuthStore } from "@/store/authStore";
import { SosGuardCard } from "@/components/sos/SosGuardCard";
import { SlideToTriggerSOS } from "@/components/mobile/SlideToTriggerSOS";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  Radio,
  MapPin,
  Building2,
  HeartPulse,
  Shield,
  WifiOff,
  Battery,
  Navigation,
  Sparkles,
  RotateCcw,
  User,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function SOSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    sosStatus,
    activeIncidentId,
    triggerSOS,
    cancelSOS,
    resetSOS,
  } = useSOSStore();

  const { currentLocation } = useLocationStore();
  const { batteryInfo } = useBatteryStore();
  const { networkState } = useConnectivityStore();

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isEmergencyActive =
    sosStatus === "triggered" ||
    sosStatus === "pending_transmission" ||
    !!activeIncidentId;

  useEffect(() => {
    if (isEmergencyActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isEmergencyActive]);

  async function handleDirectTrigger() {
    const lat = currentLocation?.latitude || 10.2381;
    const lng = currentLocation?.longitude || 77.4892;
    const accuracy = currentLocation?.accuracy || 5;

    try {
      await triggerSOS(
        lat,
        lng,
        accuracy,
        "Emergency SOS triggered from TourSafe mobile companion (Kodaikanal)"
      );
      Toast.show({
        type: "error",
        text1: "EMERGENCY BROADCAST ACTIVE",
        text2: "Command Center and Kodaikanal QRT responders alerted.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "SOS Queued Offline",
        text2: "Saved locally. Will transmit automatically when connected.",
      });
    }
  }

  const handleAutoTriggerSos = async (sourceDescription: string) => {
    const lat = currentLocation?.latitude || 10.2381;
    const lng = currentLocation?.longitude || 77.4892;
    const accuracy = currentLocation?.accuracy || 5;
    await triggerSOS(lat, lng, accuracy, sourceDescription);
  };

  async function handleConfirmCancel() {
    if (!cancelReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Reason Required",
        text2: "Please select or enter a cancellation reason.",
      });
      return;
    }

    setCancelling(true);
    try {
      await cancelSOS(cancelReason.trim());
      Toast.show({
        type: "success",
        text1: "SOS Cancelled",
        text2: "Emergency incident stood down successfully.",
      });
      setCancelModalVisible(false);
      setCancelReason("");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Cancel Failed",
        text2: err?.message || "Could not cancel SOS",
      });
    } finally {
      setCancelling(false);
    }
  }

  const handleCallHelpline = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {
      Toast.show({
        type: "info",
        text1: `Dialing ${num}`,
        text2: "Opening phone dialer...",
      });
    });
  };

  const currentLat = currentLocation?.latitude?.toFixed(4) || "10.2381";
  const currentLng = currentLocation?.longitude?.toFixed(4) || "77.4892";
  const batteryPct =
    typeof batteryInfo?.level === "number" ? Math.round(batteryInfo.level) : 100;

  return (
    <ImageBackground
      source={require("@/assets/hero-bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View
        style={[
          styles.mistOverlay,
          isEmergencyActive && styles.mistOverlayEmergency,
        ]}
      />

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
              <Radio
                size={12}
                color={isEmergencyActive ? "#EF4444" : "#10B981"}
              />
              <Text
                style={[
                  styles.badgeText,
                  isEmergencyActive && styles.badgeTextEmergency,
                ]}
              >
                {isEmergencyActive
                  ? "EMERGENCY BROADCAST ACTIVE"
                  : "24/7 RAPID DISPATCH READY"}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {isEmergencyActive ? "Active Dispatch" : "Emergency SOS Hub"}
            </Text>
            <Text style={styles.headerSub}>
              {isEmergencyActive
                ? "Incident transmitted to Kodaikanal Police Control Room and local QRT teams."
                : "Instant sovereign emergency broadcast with continuous telemetry tracking."}
            </Text>
          </View>

          {/* ── GIANT SOS TRIGGER / ACTIVE DISPATCH CARD ─────────── */}
          <View
            style={[
              styles.giantSosCard,
              isEmergencyActive && styles.giantSosCardEmergency,
            ]}
          >
            {isEmergencyActive ? (
              /* Emergency Active Broadcast View */
              <View style={styles.activeEmergencyContent}>
                <View style={styles.activePillLive}>
                  <View style={styles.liveRedDot} />
                  <Text style={styles.activePillLiveText}>INCIDENT #{activeIncidentId || "ACTIVE"}</Text>
                </View>

                <Animated.View
                  style={[
                    styles.pulsingCircleLarge,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <ShieldAlert size={48} color="#FFFFFF" />
                </Animated.View>

                <Text style={styles.activeBroadcastTitle}>Help is on the way</Text>
                <Text style={styles.activeBroadcastSub}>
                  Live GPS beacon and motion sensors are transmitting to emergency dispatch.
                </Text>

                <TouchableOpacity
                  style={styles.standDownButton}
                  onPress={() => setCancelModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.standDownButtonText}>Stand Down / Cancel SOS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Ready State: Big Circular Trigger */
              <View style={styles.readyTriggerContent}>
                <TouchableOpacity
                  style={styles.sosButtonOuterGlow}
                  onPress={handleDirectTrigger}
                  activeOpacity={0.85}
                >
                  <View style={styles.sosButtonMidRing}>
                    <View style={styles.sosButtonCore}>
                      <ShieldAlert size={42} color="#FFFFFF" />
                      <Text style={styles.sosCoreLabel}>SOS</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <Text style={styles.triggerHintTitle}>Tap or Slide for Immediate Help</Text>
                <Text style={styles.triggerHintSub}>
                  Direct line to Police, Ambulance, and Forest Rangers
                </Text>

                <View style={styles.sliderWrapper}>
                  <SlideToTriggerSOS
                    onTrigger={handleDirectTrigger}
                    active={false}
                    label="SLIDE FOR EMERGENCY SOS"
                    activeLabel="TRANSMITTING DISPATCH..."
                  />
                </View>
              </View>
            )}
          </View>

          {/* ── LIVE TELEMETRY GLANCE CARD ───────────────────────── */}
          <View style={styles.telemetryCard}>
            <Text style={styles.sectionHeaderTitle}>LIVE GUARDIAN TELEMETRY</Text>

            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryItem}>
                <MapPin size={16} color="#38BDF8" />
                <View>
                  <Text style={styles.telemetryLabel}>GPS POSITION</Text>
                  <Text style={styles.telemetryValue}>
                    {currentLat}, {currentLng}
                  </Text>
                </View>
              </View>

              <View style={styles.telemetryItem}>
                <Battery size={16} color="#10B981" />
                <View>
                  <Text style={styles.telemetryLabel}>DEVICE POWER</Text>
                  <Text style={styles.telemetryValue}>{batteryPct}% Optimal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── AUTONOMOUS MULTI-SENSOR GUARD ────────────────────── */}
          <SosGuardCard onAutoTriggerSos={handleAutoTriggerSos} />

          {/* ── EMERGENCY DIRECT HELPLINES ROW ───────────────────── */}
          <View style={styles.helplinesCard}>
            <Text style={styles.sectionHeaderTitle}>EMERGENCY RAPID HELPLINES</Text>

            <View style={styles.helplinePillsRow}>
              {/* 112 Police */}
              <TouchableOpacity
                style={[styles.helplinePill, styles.pillPolice]}
                onPress={() => handleCallHelpline("112")}
                activeOpacity={0.8}
              >
                <View style={styles.helplineIconWrap}>
                  <Phone size={14} color="#FFFFFF" />
                </View>
                <View style={styles.helplineTextCol}>
                  <Text style={styles.helplineNumber}>112</Text>
                  <Text style={styles.helplineLabel}>Police</Text>
                </View>
              </TouchableOpacity>

              {/* 108 Medical */}
              <TouchableOpacity
                style={[styles.helplinePill, styles.pillMedical]}
                onPress={() => handleCallHelpline("108")}
                activeOpacity={0.8}
              >
                <View style={[styles.helplineIconWrap, styles.iconWrapMedical]}>
                  <HeartPulse size={14} color="#FFFFFF" />
                </View>
                <View style={styles.helplineTextCol}>
                  <Text style={styles.helplineNumber}>108</Text>
                  <Text style={styles.helplineLabel}>Medical</Text>
                </View>
              </TouchableOpacity>

              {/* 1091 Women */}
              <TouchableOpacity
                style={[styles.helplinePill, styles.pillWomen]}
                onPress={() => handleCallHelpline("1091")}
                activeOpacity={0.8}
              >
                <View style={[styles.helplineIconWrap, styles.iconWrapWomen]}>
                  <ShieldCheck size={14} color="#FFFFFF" />
                </View>
                <View style={styles.helplineTextCol}>
                  <Text style={styles.helplineNumber}>1091</Text>
                  <Text style={styles.helplineLabel}>Women</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── CANCELLATION MODAL ─────────────────────────────────── */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.cancelCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <CheckCircle2 size={18} color="#10B981" />
                <Text style={styles.modalTitle}>Stand Down Emergency</Text>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Please indicate the reason for cancelling this emergency dispatch:
            </Text>

            <View style={styles.quickReasonsGrid}>
              {[
                "False Alarm / Accidental Trigger",
                "Situation Resolved Safely",
                "Assistance Already Received",
                "Testing System Only",
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonChip,
                    cancelReason === reason && styles.reasonChipActive,
                  ]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      cancelReason === reason && styles.reasonChipTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.cancelInput}
              placeholder="Or enter specific details..."
              placeholderTextColor="#94A3B8"
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmCancelBtnText}>Confirm Stand Down</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  mistOverlayEmergency: {
    backgroundColor: "rgba(127, 29, 29, 0.45)",
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
    fontSize: 10.5,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.8,
  },
  badgeTextEmergency: {
    color: "#EF4444",
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

  /* ── GIANT SOS CARD ── */
  giantSosCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        } as any)
      : {}),
  },
  giantSosCardEmergency: {
    backgroundColor: "rgba(220, 38, 38, 0.3)",
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  readyTriggerContent: {
    alignItems: "center",
    width: "100%",
  },
  sosButtonOuterGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(239, 68, 68, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  sosButtonMidRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "rgba(239, 68, 68, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosButtonCore: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  sosCoreLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginTop: 2,
  },
  triggerHintTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  triggerHintSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 3,
    marginBottom: 16,
  },
  sliderWrapper: {
    width: "100%",
  },

  /* Active Emergency State */
  activeEmergencyContent: {
    alignItems: "center",
    width: "100%",
  },
  activePillLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.35)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.6)",
    marginBottom: 16,
  },
  liveRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  activePillLiveText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  pulsingCircleLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    marginBottom: 14,
  },
  activeBroadcastTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  activeBroadcastSub: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  standDownButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  standDownButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },

  /* ── TELEMETRY CARD ── */
  telemetryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 14,
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
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  telemetryGrid: {
    flexDirection: "row",
    gap: 12,
  },
  telemetryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  telemetryValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 1,
  },

  /* ── HELPLINES CARD ── */
  helplinesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 20,
    marginTop: 6,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  helplinePillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  helplinePill: {
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
  helplineIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapMedical: {
    backgroundColor: "#EF4444",
  },
  iconWrapWomen: {
    backgroundColor: "#A855F7",
  },
  helplineTextCol: {
    flex: 1,
  },
  helplineNumber: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  helplineLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },

  /* ── MODALS ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cancelCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 12.5,
    color: "#64748B",
    marginBottom: 16,
  },
  quickReasonsGrid: {
    gap: 8,
    marginBottom: 14,
  },
  reasonChip: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  reasonChipActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  reasonChipTextActive: {
    color: "#DC2626",
    fontWeight: "800",
  },
  cancelInput: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 16,
  },
  confirmCancelBtn: {
    width: "100%",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmCancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
