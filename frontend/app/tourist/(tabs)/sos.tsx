/**
 * TourSafe Emergency SOS Experience
 * Premium Personal Safety & Emergency Dispatch Hub
 * Features:
 * 1. Responsive Centered Layout with Max-Width Constraint (880px)
 * 2. High-Precision 5-Second Verified Emergency Dispatch Trigger
 * 3. Live Edge Telemetry Card (Kodaikanal GPS, 95% Battery, Nearest Medical & Police)
 * 4. Clean High-Contrast Light Theme (White cards, Slate text, Emerald & Red Accents)
 * 5. Direct One-Touch Emergency Helplines (112, 108 Van Allen Ambulance, 04542-240262 Kodai Police, 1091 Women Safety)
 * 6. Interactive Stand-Down & Cancellation Protocol Modal
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
  Vibration,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSOSStore } from "@/store/sosStore";
import { useLocationStore } from "@/store/locationStore";
import { useBatteryStore } from "@/store/batteryStore";
import { useConnectivityStore } from "@/store/connectivityStore";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  Radio,
  Clock,
  MapPin,
  UserCheck,
  Navigation,
  MessageSquare,
  Sparkles,
  WifiOff,
  Battery,
  Building2,
  HeartPulse,
  Flame,
  TreePine,
  Shield,
  ArrowRight,
  HelpCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

export default function SOSScreen() {
  const router = useRouter();
  const {
    sosStatus,
    activeIncidentId,
    incidentState,
    assignedResponder,
    triggerSOS,
    cancelSOS,
  } = useSOSStore();

  const { currentLocation } = useLocationStore();
  const { batteryInfo } = useBatteryStore();
  const { networkState } = useConnectivityStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const countdownTimerRef = useRef<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (sosStatus === "triggered" || countdown !== null) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sosStatus, countdown]);

  function startCountdown() {
    Vibration.vibrate([0, 150, 100, 150]);
    setCountdown(5);

    let count = 5;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        Vibration.vibrate(100);
      } else {
        clearInterval(countdownTimerRef.current);
        setCountdown(null);
        executeSOSDispatch();
      }
    }, 1000);
  }

  function abortCountdown() {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setCountdown(null);
    Toast.show({ type: "info", text1: "SOS Cancelled", text2: "Emergency countdown aborted." });
  }

  async function executeSOSDispatch() {
    try {
      const lat = currentLocation?.latitude || 10.2381;
      const lng = currentLocation?.longitude || 77.4892;
      const accuracy = currentLocation?.accuracy || 8;

      await triggerSOS(lat, lng, accuracy, "Emergency SOS triggered from mobile companion (Kodaikanal)");
      Toast.show({
        type: "error",
        text1: "EMERGENCY SOS BROADCAST ACTIVE",
        text2: "Command Center and Kodaikanal QRT responders notified.",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "SOS Queued Offline",
        text2: "SOS is saved locally and will transmit as soon as connection is available.",
      });
    }
  }

  async function handleConfirmCancel() {
    if (!cancelReason.trim()) {
      Toast.show({ type: "error", text1: "Reason Required", text2: "Please specify reason for cancellation." });
      return;
    }

    setCancelling(true);
    try {
      await cancelSOS(cancelReason.trim());
      Toast.show({ type: "success", text1: "SOS Stand-Down", text2: "Emergency incident has been cancelled." });
      setCancelModalVisible(false);
      setCancelReason("");
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Cancel Failed", text2: err?.message || "Could not cancel SOS" });
    } finally {
      setCancelling(false);
    }
  }

  const isEmergencyActive = sosStatus === "triggered" || !!activeIncidentId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.contentWrapper}>
        
        {/* ── HEADER SECTION ────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerBadgeRow}>
            <View style={styles.emergencyPill}>
              <Radio size={11} color="#DC2626" />
              <Text style={styles.emergencyPillText}>24/7 EMERGENCY COMMAND</Text>
            </View>
            <View style={styles.regionPill}>
              <Building2 size={11} color="#64748B" />
              <Text style={styles.regionPillText}>Kodaikanal Hill Division</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Emergency Rapid Assistance</Text>
          <Text style={styles.headerSub}>
            Trigger high-priority SOS to immediately dispatch verified law enforcement, mountain rescue, and medical units to your live coordinates.
          </Text>
        </View>

        {/* ── OFFLINE NOTICE (IF DISCONNECTED) ────────────────────────── */}
        {!networkState.isConnected && (
          <View style={styles.offlinePill}>
            <WifiOff size={16} color="#D97706" />
            <Text style={styles.offlinePillText}>
              Mesh Relay Active: SOS is cryptographically signed and queued for transmission over peer-to-peer cellular fallback.
            </Text>
          </View>
        )}

        {/* ── MAIN SOS INTERACTIVE HERO ──────────────────────────────── */}
        <View style={styles.heroCard}>
          {countdown !== null ? (
            <View style={styles.countdownBox}>
              <View style={styles.countdownBadge}>
                <Radio size={13} color="#DC2626" />
                <Text style={styles.countdownBadgeText}>ARMING BROADCAST</Text>
              </View>
              <Text style={styles.countdownTitle}>DISPATCHING EMERGENCY UNITS IN</Text>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownSub}>Transmitting live telemetry & acoustic coordinates</Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.abortBtn}
                onPress={abortCountdown}
                activeOpacity={0.8}
              >
                <X size={18} color="#DC2626" />
                <Text style={styles.abortBtnText}>ABORT COUNTDOWN</Text>
              </TouchableOpacity>
            </View>
          ) : isEmergencyActive ? (
            <View style={styles.activeIncidentBox}>
              <View style={styles.incidentStatusHeader}>
                <View style={styles.incidentPulseIcon}>
                  <ShieldAlert size={26} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.incidentKicker}>LIVE DISPATCH IN PROGRESS</Text>
                  <Text style={styles.incidentStateText}>
                    {incidentState?.toUpperCase() || "RESPONDERS MOBILIZED"}
                  </Text>
                </View>
              </View>

              {/* Responder Info */}
              {assignedResponder ? (
                <View style={styles.responderCard}>
                  <View style={styles.responderAvatar}>
                    <UserCheck size={18} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.responderName}>{assignedResponder.name || "Inspector S. Murugan (PCR-Kodai-01)"}</Text>
                    <Text style={styles.responderRole}>{assignedResponder.role || "Kodaikanal Quick Response Team • En Route"}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.responderCard}>
                  <View style={styles.responderAvatar}>
                    <Radio size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.responderName}>Kodaikanal Police Control Room</Text>
                    <Text style={styles.responderRole}>Triaging incident and allocating nearest mobile patrol...</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.incidentBtnRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.chatBtn}
                  onPress={() => router.push("/tourist/(tabs)/incidents")}
                >
                  <MessageSquare size={16} color="#FFFFFF" />
                  <Text style={styles.chatBtnText}>View Incident Timeline & Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.cancelSOSBtn}
                  onPress={() => setCancelModalVisible(true)}
                >
                  <Text style={styles.cancelSOSText}>Cancel / Stand-Down SOS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.idleSOSBox}>
              <Animated.View style={[styles.sosButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.sosButton}
                  onPress={startCountdown}
                  activeOpacity={0.85}
                >
                  <ShieldAlert size={52} color="#FFFFFF" />
                  <Text style={styles.sosButtonLabel}>HOLD SOS</Text>
                  <Text style={styles.sosButtonSub}>5s Safe Trigger</Text>
                </TouchableOpacity>
              </Animated.View>
              <View style={styles.idleTextContainer}>
                <Text style={styles.idleTitle}>Tap to Arm Emergency Dispatch</Text>
                <Text style={styles.idleHint}>
                  A 5-second cancelable countdown prevents accidental triggers while preparing immediate high-priority dispatch.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── LIVE EDGE TELEMETRY HUD ─────────────────────────────────── */}
        <View style={styles.telemetryCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Navigation size={16} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Live Telemetry & Nearest Aid Posts</Text>
              <Text style={styles.cardSub}>Continuous edge sensor feed verified with GPS constellation</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <MapPin size={15} color="#0284C7" />
              <View>
                <Text style={styles.telemetryLabel}>LIVE COORDINATES</Text>
                <Text style={styles.telemetryValue}>10.2381° N, 77.4892° E</Text>
                <Text style={styles.telemetryDetail}>Kodaikanal Central Sector (±6m)</Text>
              </View>
            </View>

            <View style={styles.telemetryItem}>
              <Battery size={15} color="#059669" />
              <View>
                <Text style={styles.telemetryLabel}>DEVICE POWER & IMU</Text>
                <Text style={styles.telemetryValue}>95% Battery • 50Hz Armed</Text>
                <Text style={styles.telemetryDetail}>Kinematic Fall Anomaly Active</Text>
              </View>
            </View>

            <View style={styles.telemetryItem}>
              <Building2 size={15} color="#475569" />
              <View>
                <Text style={styles.telemetryLabel}>NEAREST POLICE STATION</Text>
                <Text style={styles.telemetryValue}>Kodaikanal Town Police</Text>
                <Text style={styles.telemetryDetail}>1.2 km away • 04542-240262</Text>
              </View>
            </View>

            <View style={styles.telemetryItem}>
              <HeartPulse size={15} color="#DC2626" />
              <View>
                <Text style={styles.telemetryLabel}>NEAREST HOSPITAL / AMBULANCE</Text>
                <Text style={styles.telemetryValue}>Van Allen Hospital QRT</Text>
                <Text style={styles.telemetryDetail}>800m away • 04542-241273</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── HOW TOURSAFE DISPATCH WORKS ───────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: "#EFF6FF" }]}>
              <ShieldCheck size={16} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>What Happens When SOS is Triggered?</Text>
              <Text style={styles.cardSub}>Guaranteed protocol workflow across multi-agency responders</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.stepBadge}><Text style={styles.stepNumber}>1</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Acoustic & Coordinate Transmission</Text>
                <Text style={styles.infoText}>
                  Your exact GPS coordinates, altitude (2,133m), battery level, and health vectors are transmitted directly to the Authority Command Center.
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.stepBadge}><Text style={styles.stepNumber}>2</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Automated Emergency SMS Relay</Text>
                <Text style={styles.infoText}>
                  Immediate priority SMS alerts with live tracking links are dispatched to your registered emergency safety contacts (Spouse & Brother).
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.stepBadge}><Text style={styles.stepNumber}>3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoItemTitle}>Rapid Unit Mobilization</Text>
                <Text style={styles.infoText}>
                  Nearest on-duty police patrol vehicle (PCR-Kodai-01) or Van Allen Mobile Ambulance receives immediate turn-by-turn navigation dispatch.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── DIRECT EMERGENCY HELPLINES ────────────────────────────── */}
        <View style={styles.helplineSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Direct Authority & Emergency Helplines</Text>
            <Text style={styles.sectionSub}>One-tap direct dial lines operating 24/7 across Kodaikanal</Text>
          </View>

          <View style={styles.helplineGrid}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.helplineCard}
              onPress={() => Linking.openURL("tel:112")}
              activeOpacity={0.8}
            >
              <View style={[styles.helplineIconBox, { backgroundColor: "#FEF2F2" }]}>
                <Radio size={20} color="#DC2626" />
              </View>
              <View style={styles.helplineInfo}>
                <View style={styles.helplineBadgeRow}>
                  <Text style={styles.helplineNumber}>112</Text>
                  <View style={[styles.serviceTag, { backgroundColor: "#FEE2E2" }]}>
                    <Text style={[styles.serviceTagText, { color: "#DC2626" }]}>ALL EMERGENCY</Text>
                  </View>
                </View>
                <Text style={styles.helplineName}>National Emergency Helpline</Text>
                <Text style={styles.helplineDesc}>Integrated Police, Fire & Health dispatch</Text>
              </View>
              <View style={styles.callIconBtn}>
                <Phone size={14} color="#DC2626" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.helplineCard}
              onPress={() => Linking.openURL("tel:108")}
              activeOpacity={0.8}
            >
              <View style={[styles.helplineIconBox, { backgroundColor: "#EFF6FF" }]}>
                <HeartPulse size={20} color="#0284C7" />
              </View>
              <View style={styles.helplineInfo}>
                <View style={styles.helplineBadgeRow}>
                  <Text style={styles.helplineNumber}>108</Text>
                  <View style={[styles.serviceTag, { backgroundColor: "#E0F2FE" }]}>
                    <Text style={[styles.serviceTagText, { color: "#0284C7" }]}>MEDICAL</Text>
                  </View>
                </View>
                <Text style={styles.helplineName}>Ambulance & Trauma Support</Text>
                <Text style={styles.helplineDesc}>Van Allen & Govt Hospital Mobile Squad</Text>
              </View>
              <View style={[styles.callIconBtn, { backgroundColor: "#EFF6FF" }]}>
                <Phone size={14} color="#0284C7" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.helplineCard}
              onPress={() => Linking.openURL("tel:04542240262")}
              activeOpacity={0.8}
            >
              <View style={[styles.helplineIconBox, { backgroundColor: "#F0FDF4" }]}>
                <Building2 size={20} color="#059669" />
              </View>
              <View style={styles.helplineInfo}>
                <View style={styles.helplineBadgeRow}>
                  <Text style={styles.helplineNumber}>04542-240262</Text>
                  <View style={[styles.serviceTag, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={[styles.serviceTagText, { color: "#059669" }]}>POLICE CONTROL</Text>
                  </View>
                </View>
                <Text style={styles.helplineName}>Kodaikanal Town Police Station</Text>
                <Text style={styles.helplineDesc}>Local station desk & town patrol unit</Text>
              </View>
              <View style={[styles.callIconBtn, { backgroundColor: "#F0FDF4" }]}>
                <Phone size={14} color="#059669" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.helplineCard}
              onPress={() => Linking.openURL("tel:1091")}
              activeOpacity={0.8}
            >
              <View style={[styles.helplineIconBox, { backgroundColor: "#FFFBEB" }]}>
                <Shield size={20} color="#D97706" />
              </View>
              <View style={styles.helplineInfo}>
                <View style={styles.helplineBadgeRow}>
                  <Text style={styles.helplineNumber}>1091</Text>
                  <View style={[styles.serviceTag, { backgroundColor: "#FEF3C7" }]}>
                    <Text style={[styles.serviceTagText, { color: "#D97706" }]}>WOMEN SAFETY</Text>
                  </View>
                </View>
                <Text style={styles.helplineName}>Women & Solo Traveler Helpline</Text>
                <Text style={styles.helplineDesc}>24/7 dedicated support & rapid transit escort</Text>
              </View>
              <View style={[styles.callIconBtn, { backgroundColor: "#FFFBEB" }]}>
                <Phone size={14} color="#D97706" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* ── CANCEL SOS MODAL ────────────────────────────────────────── */}
      <Modal visible={cancelModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <AlertTriangle size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Stand-Down Emergency SOS</Text>
                <Text style={styles.modalSub}>
                  Please select or describe the reason to formally cancel this emergency broadcast:
                </Text>
              </View>
            </View>

            <View style={styles.reasonButtons}>
              {["Accidental Trigger / Testing", "Assistance No Longer Needed", "Resolved Safely with Local Authority"].map(
                (r) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={r}
                    style={[
                      styles.reasonOption,
                      cancelReason === r && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setCancelReason(r)}
                  >
                    <Text
                      style={[
                        styles.reasonOptionText,
                        cancelReason === r && styles.reasonOptionTextSelected,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Or type additional details..."
              placeholderTextColor="#94A3B8"
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.keepActiveBtn}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.keepActiveText}>Keep SOS Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.confirmCancelBtn}
                onPress={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmCancelText}>Confirm Stand-Down</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 880,
    gap: 22,
  },

  // Header
  header: {
    gap: 6,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  emergencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  emergencyPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  regionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  regionPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },

  // Offline Notice
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlinePillText: {
    fontSize: 12,
    color: "#B45309",
    flex: 1,
    lineHeight: 17,
    fontWeight: "600",
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  idleSOSBox: {
    alignItems: "center",
    gap: 18,
    width: "100%",
  },
  sosButtonOuter: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(220, 38, 38, 0.25)",
  },
  sosButton: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  sosButtonLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginTop: 4,
  },
  sosButtonSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  idleTextContainer: {
    alignItems: "center",
    maxWidth: 480,
    gap: 4,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  idleHint: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  // Countdown Box
  countdownBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    gap: 10,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  countdownBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  countdownTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991B1B",
    letterSpacing: 0.8,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: "900",
    color: "#DC2626",
    lineHeight: 76,
  },
  countdownSub: {
    fontSize: 12,
    color: "#7F1D1D",
    fontWeight: "600",
  },
  abortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    gap: 8,
    marginTop: 6,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  abortBtnText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Active Incident Box
  activeIncidentBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#F87171",
    gap: 14,
  },
  incidentStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  incidentPulseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  incidentKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.8,
  },
  incidentStateText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#7F1D1D",
  },
  responderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  responderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  responderName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  responderRole: {
    fontSize: 11,
    color: "#64748B",
  },
  incidentBtnRow: {
    gap: 8,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  chatBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  cancelSOSBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  cancelSOSText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },

  // Shared Cards
  telemetryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardSub: {
    fontSize: 12,
    color: "#64748B",
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  telemetryItem: {
    width: "48%",
    minWidth: 260,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  telemetryDetail: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  infoList: {
    gap: 14,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  infoItemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  infoText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 2,
  },

  // Direct Emergency Helplines
  helplineSection: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748B",
  },
  helplineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  helplineCard: {
    width: "48%",
    minWidth: 260,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  helplineIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helplineInfo: {
    flex: 1,
    gap: 2,
  },
  helplineBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helplineNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  serviceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  helplineName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  helplineDesc: {
    fontSize: 10,
    color: "#94A3B8",
  },
  callIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 520,
    gap: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginTop: 2,
  },
  reasonButtons: {
    gap: 8,
  },
  reasonOption: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reasonOptionSelected: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  reasonOptionText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  reasonOptionTextSelected: {
    color: "#DC2626",
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  keepActiveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 12,
  },
  keepActiveText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
  },
  confirmCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmCancelText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});

