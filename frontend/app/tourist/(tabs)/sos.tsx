/**
 * TourSafe Emergency SOS Experience
 * Mobile-First Personal Safety & Emergency Dispatch Hub
 * Features:
 * 1. Slide-to-Trigger SOS Slider with progressive haptics
 * 2. Instant Full-Bleed Emergency HUD with Live GPS coordinates & battery
 * 3. Stand-Down Cancellation Protocol with 1-tap quick reason chips
 * 4. Direct 1-Touch Emergency Helplines (112, 108, 1091)
 * 5. Autonomous Multi-Sensor SosGuardCard Integration
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
} from "react-native";
import { useRouter } from "expo-router";
import { useSOSStore } from "@/store/sosStore";
import { useLocationStore } from "@/store/locationStore";
import { useBatteryStore } from "@/store/batteryStore";
import { useConnectivityStore } from "@/store/connectivityStore";
import { SosGuardCard } from "@/components/sos/SosGuardCard";
import { SlideToTriggerSOS } from "@/components/mobile/SlideToTriggerSOS";
import { sosService } from "@/lib/sos/sosService";
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
  Flame,
  Shield,
  WifiOff,
  Battery,
  Navigation,
  Sparkles,
  RotateCcw,
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
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
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

  async function handleSlideTrigger() {
    const lat = currentLocation?.latitude || 10.2381;
    const lng = currentLocation?.longitude || 77.4892;
    const accuracy = currentLocation?.accuracy || 8;

    try {
      await triggerSOS(
        lat,
        lng,
        accuracy,
        "Emergency SOS triggered from mobile companion (Kodaikanal)"
      );
      Toast.show({
        type: "error",
        text1: "EMERGENCY SOS BROADCAST ACTIVE",
        text2: "Command Center and Kodaikanal QRT responders notified.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "SOS Queued Offline",
        text2: "Saved locally. Will transmit automatically when connected.",
      });
    }
  }

  async function handleSosAutoDispatch(description: string) {
    const lat = currentLocation?.latitude || 10.2381;
    const lng = currentLocation?.longitude || 77.4892;
    const accuracy = currentLocation?.accuracy || 8;

    try {
      await triggerSOS(lat, lng, accuracy, description);
      await sosService.dispatchSosEmergencyActions(lat, lng);
    } catch (e: any) {
      await sosService.dispatchSosEmergencyActions(lat, lng);
      throw e;
    }
  }

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
    typeof batteryInfo?.level === "number" ? Math.round(batteryInfo.level) : 95;

  return (
    <ScrollView
      style={[styles.container, isEmergencyActive && styles.containerEmergency]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── TOP HEADER / BADGE ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusPill,
              isEmergencyActive && styles.statusPillEmergency,
            ]}
          >
            <Radio
              size={12}
              color={isEmergencyActive ? "#DC2626" : "#059669"}
            />
            <Text
              style={[
                styles.statusPillText,
                isEmergencyActive && styles.statusPillTextEmergency,
              ]}
            >
              {isEmergencyActive
                ? "EMERGENCY BROADCAST ACTIVE"
                : "24/7 RAPID DISPATCH READY"}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.headerTitle,
            isEmergencyActive && styles.headerTitleEmergency,
          ]}
        >
          {isEmergencyActive
            ? "Assistance Dispatched"
            : "Emergency SOS Center"}
        </Text>
        <Text
          style={[
            styles.headerSub,
            isEmergencyActive && styles.headerSubEmergency,
          ]}
        >
          {isEmergencyActive
            ? "Your coordinates and status have been transmitted to Police Command and Quick Response Teams."
            : "Slide to immediately alert local police, medical units, and emergency contacts with your live location."}
        </Text>
      </View>

      {/* ── OFFLINE STATUS BANNER ───────────────────────────────── */}
      {!networkState.isConnected && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#D97706" />
          <Text style={styles.offlineText}>
            Mesh Fallback Armed: SOS is saved locally and will auto-transmit via cellular/mesh relay.
          </Text>
        </View>
      )}

      {/* ── ACTIVE EMERGENCY HUD OR SLIDE-TO-TRIGGER ───────────── */}
      {isEmergencyActive ? (
        <View style={styles.emergencyHudCard}>
          <View style={styles.hudTopRow}>
            <Animated.View
              style={[
                styles.hudPulseCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <ShieldAlert size={36} color="#DC2626" />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hudStateKicker}>DISPATCH STATUS</Text>
              <Text style={styles.hudStateTitle}>
                {incidentState || "ALERT BROADCASTED"}
              </Text>
              <Text style={styles.hudIncidentId}>
                ID: {activeIncidentId || "INC-LOCAL-DISPATCH"}
              </Text>
            </View>
          </View>

          {/* Telemetry to Read to Dispatcher */}
          <View style={styles.readoutBox}>
            <Text style={styles.readoutHeader}>
              READ TO OPERATOR OR 112 DISPATCHER:
            </Text>
            <View style={styles.readoutRow}>
              <MapPin size={16} color="#DC2626" />
              <Text style={styles.readoutCoordinates}>
                {currentLat}° N, {currentLng}° E
              </Text>
            </View>
            <View style={styles.readoutMetaRow}>
              <Text style={styles.readoutMetaText}>
                Precision: ±{currentLocation?.accuracy ? Math.round(currentLocation.accuracy) : 5}m
              </Text>
              <Text style={styles.readoutMetaText}>•</Text>
              <Text style={styles.readoutMetaText}>
                Battery: {batteryPct}%
              </Text>
              <Text style={styles.readoutMetaText}>•</Text>
              <Text style={styles.readoutMetaText}>
                Area: Kodaikanal Hill
              </Text>
            </View>
          </View>

          {/* Action Buttons in Emergency Mode */}
          <TouchableOpacity
            style={styles.callDispatcherBtn}
            onPress={() => handleCallHelpline("112")}
            activeOpacity={0.85}
          >
            <Phone size={18} color="#FFFFFF" />
            <Text style={styles.callDispatcherBtnText}>
              Call Emergency Operator (112)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.standDownBtn}
            onPress={() => setCancelModalVisible(true)}
            activeOpacity={0.8}
          >
            <RotateCcw size={16} color="#475569" />
            <Text style={styles.standDownBtnText}>
              Stand Down / Cancel Emergency
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.slideCard}>
          <Text style={styles.slideNotice}>
            Deliberate slide activation prevents accidental triggers while running or panicked.
          </Text>

          <SlideToTriggerSOS
            onTrigger={handleSlideTrigger}
            active={isEmergencyActive}
            label="SLIDE FOR EMERGENCY SOS"
            activeLabel="EMERGENCY TRANSMITTED"
          />
        </View>
      )}

      {/* ── RAPID 1-TOUCH HELPLINES ────────────────────────────── */}
      <View style={styles.helplineSection}>
        <Text style={styles.sectionHeader}>DIRECT EMERGENCY DIALERS</Text>
        <View style={styles.helplinesGrid}>
          <TouchableOpacity
            style={[styles.helplineCard, styles.policeCard]}
            onPress={() => handleCallHelpline("112")}
            activeOpacity={0.8}
          >
            <View style={styles.helplineIconRow}>
              <View style={[styles.helplineIconBox, { backgroundColor: "#FEE2E2" }]}>
                <Shield size={18} color="#DC2626" />
              </View>
              <Text style={styles.helplineNumber}>112</Text>
            </View>
            <Text style={styles.helplineTitle}>National Police</Text>
            <Text style={styles.helplineSub}>Immediate emergency response</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.helplineCard, styles.medicalCard]}
            onPress={() => handleCallHelpline("108")}
            activeOpacity={0.8}
          >
            <View style={styles.helplineIconRow}>
              <View style={[styles.helplineIconBox, { backgroundColor: "#E0F2FE" }]}>
                <HeartPulse size={18} color="#0284C7" />
              </View>
              <Text style={styles.helplineNumber}>108</Text>
            </View>
            <Text style={styles.helplineTitle}>Ambulance</Text>
            <Text style={styles.helplineSub}>Trauma & medical dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.helplineCard, styles.womenCard]}
            onPress={() => handleCallHelpline("1091")}
            activeOpacity={0.8}
          >
            <View style={styles.helplineIconRow}>
              <View style={[styles.helplineIconBox, { backgroundColor: "#F3E8FF" }]}>
                <Sparkles size={18} color="#7C3AED" />
              </View>
              <Text style={styles.helplineNumber}>1091</Text>
            </View>
            <Text style={styles.helplineTitle}>Women Safety</Text>
            <Text style={styles.helplineSub}>24/7 dedicated helpline</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── AUTONOMOUS DISTRESS GUARD CARD ─────────────────────── */}
      <View style={styles.sensorSection}>
        <Text style={styles.sectionHeader}>AUTONOMOUS FALL & DISTRESS GUARD</Text>
        <SosGuardCard onAutoTriggerSos={handleSosAutoDispatch} />
      </View>

      {/* ── STAND-DOWN CANCELLATION MODAL ──────────────────────── */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBox}>
                <AlertTriangle size={20} color="#D97706" />
                <Text style={styles.modalTitle}>Cancel Emergency SOS</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Please select a stand-down reason to notify the Command Center:
            </Text>

            {/* Quick Reason Chips */}
            <View style={styles.reasonChipsRow}>
              {[
                "Accidental Trigger",
                "Situation Resolved Safely",
                "Test Drill / Verification",
                "False Alarm",
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonChip,
                    cancelReason === reason && styles.reasonChipActive,
                  ]}
                  onPress={() => setCancelReason(reason)}
                  activeOpacity={0.7}
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
              style={styles.reasonInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Or type additional notes..."
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={handleConfirmCancel}
              disabled={cancelling}
              activeOpacity={0.85}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmCancelBtnText}>
                  Confirm SOS Cancellation
                </Text>
              )}
            </TouchableOpacity>
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
  containerEmergency: {
    backgroundColor: "#FEF2F2",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.25)",
  },
  statusPillEmergency: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.5,
  },
  statusPillTextEmergency: {
    color: "#DC2626",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  headerTitleEmergency: {
    color: "#DC2626",
  },
  headerSub: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginTop: 4,
  },
  headerSubEmergency: {
    color: "#B91C1C",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  offlineText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
    flex: 1,
  },
  slideCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  slideNotice: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 10,
  },
  emergencyHudCard: {
    backgroundColor: "rgba(254, 242, 242, 0.95)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 16,
  },
  hudTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  hudPulseCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  hudStateKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  hudStateTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#991B1B",
    letterSpacing: -0.2,
  },
  hudIncidentId: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  readoutBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    marginBottom: 14,
  },
  readoutHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#991B1B",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  readoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  readoutCoordinates: {
    fontSize: 17,
    fontWeight: "900",
    color: "#DC2626",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },
  readoutMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  readoutMetaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#991B1B",
  },
  callDispatcherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    height: 50,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  callDispatcherBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  standDownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(241, 245, 249, 0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  standDownBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  helplineSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  helplinesGrid: {
    flexDirection: "row",
    gap: 8,
  },
  helplineCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 90,
    justifyContent: "space-between",
  },
  policeCard: {
    borderTopWidth: 3,
    borderTopColor: "#DC2626",
  },
  medicalCard: {
    borderTopWidth: 3,
    borderTopColor: "#0284C7",
  },
  womenCard: {
    borderTopWidth: 3,
    borderTopColor: "#0284C7",
  },
  helplineIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  helplineIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  helplineNumber: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  helplineTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  helplineSub: {
    fontSize: 9,
    color: "#64748B",
    lineHeight: 12,
  },
  sensorSection: {
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 20,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },
  reasonChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  reasonChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reasonChipActive: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0284C7",
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  reasonChipTextActive: {
    color: "#0284C7",
    fontWeight: "700",
  },
  reasonInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: "#0F172A",
  },
  confirmCancelBtn: {
    backgroundColor: "#DC2626",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
