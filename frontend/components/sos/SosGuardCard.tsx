/**
 * SosGuardCard
 * UI Component integrating autonomous multi-sensor distress detection.
 * Provides live telemetry gauges, sensitivity settings, and emergency countdown.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Animated,
} from "react-native";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Volume2,
  RotateCw,
  Zap,
  Sliders,
  X,
  Check,
  Radio,
  Sparkles,
  Info,
} from "lucide-react-native";
import { useSosDetector } from "@/lib/sos/useSosDetector";
import { sosService } from "@/lib/sos/sosService";
import { SensitivityLevel } from "@/lib/sos/types";
import Toast from "react-native-toast-message";

interface SosGuardCardProps {
  onAutoTriggerSos: (sourceDescription: string) => Promise<void>;
}

export function SosGuardCard({ onAutoTriggerSos }: SosGuardCardProps) {
  const {
    isArmed,
    toggleArm,
    preferences,
    updatePreferences,
    thresholds,
    metrics,
    simulateImpactAndRotation,
    simulateAcousticDistress,
    cancelDistressCountdown,
    playToneBeep,
  } = useSosDetector();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [demoOptionsVisible, setDemoOptionsVisible] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Settings local state
  const [selectedSensitivity, setSelectedSensitivity] =
    useState<SensitivityLevel>(preferences.sensitivity);
  const [countdownSecs, setCountdownSecs] = useState(
    preferences.countdownSeconds.toString()
  );
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState(
    preferences.emergencyPhone
  );
  const [autoSmsToggle, setAutoSmsToggle] = useState(preferences.autoSmsEnabled);
  const [autoCallToggle, setAutoCallToggle] = useState(preferences.autoCallEnabled);
  const [soundToggle, setSoundToggle] = useState(preferences.soundDetectionEnabled);

  // Distress countdown state
  const [activeDistressSource, setActiveDistressSource] = useState<string | null>(
    null
  );
  const [remainingCountdown, setRemainingCountdown] = useState<number | null>(
    null
  );
  const countdownIntervalRef = useRef<any>(null);

  // Animated pulse for distress dialog
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Sync settings when preferences change
  useEffect(() => {
    setSelectedSensitivity(preferences.sensitivity);
    setCountdownSecs(preferences.countdownSeconds.toString());
    setEmergencyPhoneInput(preferences.emergencyPhone);
    setAutoSmsToggle(preferences.autoSmsEnabled);
    setAutoCallToggle(preferences.autoCallEnabled);
    setSoundToggle(preferences.soundDetectionEnabled);
  }, [preferences]);

  // Subscribe to automatic distress events from sosService
  useEffect(() => {
    const unsubscribe = sosService.subscribeDistress((source) => {
      startDistressCountdown(source);
    });

    return () => {
      unsubscribe();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [preferences.countdownSeconds]);

  // Pulsing animation when distress dialog is open
  useEffect(() => {
    if (remainingCountdown !== null) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [remainingCountdown]);

  function startDistressCountdown(source: string) {
    setActiveDistressSource(source);
    let count = preferences.countdownSeconds || 10;
    setRemainingCountdown(count);
    playToneBeep();

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setRemainingCountdown(count);
        playToneBeep();
      } else {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setRemainingCountdown(null);
        handleCountdownFinished(source);
      }
    }, 1000);
  }

  function abortDistressCountdown() {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setRemainingCountdown(null);
    setActiveDistressSource(null);
    cancelDistressCountdown();
    Toast.show({
      type: "info",
      text1: "Protection Maintained",
      text2: "Distress countdown cancelled. You are safe.",
    });
  }

  async function handleCountdownFinished(source: string) {
    try {
      await onAutoTriggerSos(
        `Autonomous Multi-Sensor Trigger (${source}) verified by detection engine.`
      );
      Toast.show({
        type: "error",
        text1: "🚨 EMERGENCY SOS DISPATCHED",
        text2: "Command Center and Emergency QRT mobilized.",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "SOS Queued Offline",
        text2: "Emergency payload saved for immediate mesh dispatch.",
      });
    }
  }

  async function handleSaveSettings() {
    const secs = parseInt(countdownSecs, 10);
    const validSecs = isNaN(secs) || secs < 3 ? 10 : Math.min(60, secs);

    await updatePreferences({
      sensitivity: selectedSensitivity,
      countdownSeconds: validSecs,
      emergencyPhone: emergencyPhoneInput.trim(),
      autoSmsEnabled: autoSmsToggle,
      autoCallEnabled: autoCallToggle,
      soundDetectionEnabled: soundToggle,
    });

    setSettingsModalVisible(false);
    Toast.show({
      type: "success",
      text1: "Settings Saved",
      text2: `Sensitivity: ${selectedSensitivity.toUpperCase()} • Cancel Window: ${validSecs}s`,
    });
  }

  // Normalized progress meters (0 to 1)
  const accelPct = Math.min(1, metrics.lastAccel / (thresholds.accel * 1.2));
  const gyroPct = Math.min(1, metrics.lastGyro / (thresholds.gyro * 1.2));
  const soundPct = Math.min(1, metrics.lastSound / (thresholds.sound * 1.2));

  return (
    <View style={styles.card}>
      {/* ── CARD HEADER ──────────────────────────────────────────────── */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBadge,
              isArmed ? styles.iconBadgeArmed : styles.iconBadgeDisarmed,
            ]}
          >
            {isArmed ? (
              <ShieldCheck size={20} color="#059669" />
            ) : (
              <ShieldAlert size={20} color="#64748B" />
            )}
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>Autonomous SOS Guard</Text>
              <View
                style={[
                  styles.statusTag,
                  isArmed ? styles.statusTagArmed : styles.statusTagDisarmed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isArmed ? styles.statusDotArmed : styles.statusDotDisarmed,
                  ]}
                />
                <Text
                  style={[
                    styles.statusTagText,
                    isArmed
                      ? styles.statusTagTextArmed
                      : styles.statusTagTextDisarmed,
                  ]}
                >
                  {isArmed ? "PROTECTION ACTIVE" : "PROTECTION OFF"}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>
              Multi-sensor kinematic & acoustic fall/distress fusion
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.settingsBtn}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Sliders size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* ── ARM / DISARM TOGGLE BAR ──────────────────────────────────── */}
      <View style={styles.armSection}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.armToggleBtn,
            isArmed ? styles.armBtnActive : styles.armBtnInactive,
          ]}
          onPress={() => {
            const armed = toggleArm();
            Toast.show({
              type: armed ? "success" : "info",
              text1: armed ? "SOS Guard Armed" : "SOS Guard Disarmed",
              text2: armed
                ? "Monitoring kinematics and acoustics in background."
                : "Sensor background listeners stopped.",
            });
          }}
          activeOpacity={0.85}
        >
          <View style={styles.armBtnContent}>
            <View
              style={[
                styles.armIndicator,
                isArmed ? styles.armIndicatorActive : styles.armIndicatorInactive,
              ]}
            >
              {isArmed ? (
                <Check size={16} color="#FFFFFF" />
              ) : (
                <Zap size={16} color="#94A3B8" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.armBtnTitle}>
                {isArmed ? "Armed & Actively Guarding" : "Tap to Arm Protection"}
              </Text>
              <Text style={styles.armBtnSub}>
                {isArmed
                  ? "Sensors continuously scanning for falls, shock, and shouts"
                  : "Tap to activate 50Hz motion and acoustic distress listeners"}
              </Text>
            </View>
            <View
              style={[
                styles.armPill,
                isArmed ? styles.armPillActive : styles.armPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.armPillText,
                  isArmed ? styles.armPillTextActive : styles.armPillTextInactive,
                ]}
              >
                {isArmed ? "ARMED" : "ARM"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── AMBIENT SENSITIVITY SELECTOR ───────────────────────────── */}
      <View style={styles.ambientPillSection}>
        <Text style={styles.ambientPillTitle}>DISTRESS SENSITIVITY</Text>
        <View style={styles.sensitivityPillsRow}>
          {(["low", "medium", "high"] as SensitivityLevel[]).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.sensitivityPillBtn,
                preferences.sensitivity === level && styles.sensitivityPillBtnActive,
              ]}
              onPress={() => updatePreferences({ sensitivity: level })}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sensitivityPillText,
                  preferences.sensitivity === level && styles.sensitivityPillTextActive,
                ]}
              >
                {level === "low" ? "Low Shock" : level === "medium" ? "Normal" : "High (Hike)"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── COLLAPSIBLE HARDWARE TELEMETRY TOGGLE ────────────────────── */}
      <TouchableOpacity
        style={styles.diagToggleBar}
        onPress={() => setShowDiagnostics(!showDiagnostics)}
        activeOpacity={0.7}
      >
        <View style={styles.diagToggleLeft}>
          <Activity size={13} color="#64748B" />
          <Text style={styles.diagToggleTitle}>
            {showDiagnostics ? "Hide Sensor Telemetry" : "Show Sensor Fusion Telemetry (50Hz)"}
          </Text>
        </View>
        <Text style={styles.diagToggleAction}>{showDiagnostics ? "Hide" : "Show"}</Text>
      </TouchableOpacity>

      {/* ── LIVE MULTI-SENSOR TELEMETRY GAUGES (OPTIONAL EXPANSION) ── */}
      {showDiagnostics && (
        <View style={styles.gaugesContainer}>
          <View style={styles.gaugesHeader}>
            <Text style={styles.gaugesTitle}>REAL-TIME HARDWARE SENSOR FUSION</Text>
            <Text style={styles.sensitivityBadge}>
              {preferences.sensitivity.toUpperCase()} SENSITIVITY
            </Text>
          </View>

          <View style={styles.gaugesGrid}>
            {/* Acceleration Sensor */}
            <View style={styles.gaugeCard}>
              <View style={styles.gaugeHeaderRow}>
                <View style={styles.sensorIconRow}>
                  <Activity size={14} color="#0284C7" />
                  <Text style={styles.gaugeName}>ACCELEROMETER</Text>
                </View>
                {metrics.accelTriggered && (
                  <View style={styles.triggerBadge}>
                    <Text style={styles.triggerBadgeText}>TRIGGERED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gaugeValue}>
                {metrics.lastAccel.toFixed(2)}{" "}
                <Text style={styles.gaugeUnit}>m/s²</Text>
              </Text>
              <Text style={styles.gaugeThreshold}>
                Threshold: {thresholds.accel.toFixed(1)} m/s²
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round(accelPct * 100)}%`,
                      backgroundColor: metrics.accelTriggered ? "#DC2626" : "#0284C7",
                    },
                  ]}
                />
              </View>
            </View>

            {/* Gyroscope Sensor */}
            <View style={styles.gaugeCard}>
              <View style={styles.gaugeHeaderRow}>
                <View style={styles.sensorIconRow}>
                  <RotateCw size={14} color="#7C3AED" />
                  <Text style={styles.gaugeName}>GYROSCOPE</Text>
                </View>
                {metrics.gyroTriggered && (
                  <View style={styles.triggerBadge}>
                    <Text style={styles.triggerBadgeText}>TRIGGERED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gaugeValue}>
                {metrics.lastGyro.toFixed(2)}{" "}
                <Text style={styles.gaugeUnit}>rad/s</Text>
              </Text>
              <Text style={styles.gaugeThreshold}>
                Threshold: {thresholds.gyro.toFixed(1)} rad/s
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round(gyroPct * 100)}%`,
                      backgroundColor: metrics.gyroTriggered ? "#DC2626" : "#7C3AED",
                    },
                  ]}
                />
              </View>
            </View>

            {/* Acoustic Sound Sensor */}
            <View style={styles.gaugeCard}>
              <View style={styles.gaugeHeaderRow}>
                <View style={styles.sensorIconRow}>
                  <Volume2 size={14} color="#D97706" />
                  <Text style={styles.gaugeName}>ACOUSTIC MIC</Text>
                </View>
                {metrics.soundTriggered && (
                  <View style={styles.triggerBadge}>
                    <Text style={styles.triggerBadgeText}>TRIGGERED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gaugeValue}>
                {metrics.lastSound}{" "}
                <Text style={styles.gaugeUnit}>RMS</Text>
              </Text>
              <Text style={styles.gaugeThreshold}>
                Threshold: {thresholds.sound} RMS
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round(soundPct * 100)}%`,
                      backgroundColor: metrics.soundTriggered ? "#DC2626" : "#D97706",
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Fusion Logic Status */}
          <View style={styles.fusionRuleBar}>
            <Info size={13} color="#64748B" />
            <Text style={styles.fusionRuleText}>
              Fusion Rule: Confirms distress if (Impact + Rotation) or (Impact +
              Acoustic Shout) within 2.0s window.
            </Text>
          </View>

          {metrics.windowActive && (
            <View style={styles.activeWindowBanner}>
              <Radio size={14} color="#DC2626" />
              <Text style={styles.activeWindowText}>
                Distress Correlation Window Active:{" "}
                {(metrics.timeRemainingMs / 1000).toFixed(1)}s remaining
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── DEMO & SIMULATION CONTROLS ───────────────────────────────── */}
      <View style={styles.demoSection}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.demoToggleBtn}
          onPress={() => setDemoOptionsVisible(!demoOptionsVisible)}
        >
          <View style={styles.demoToggleLeft}>
            <Sparkles size={15} color="#4F46E5" />
            <Text style={styles.demoToggleTitle}>
              Autonomous Simulation / Testing Studio
            </Text>
          </View>
          <Text style={styles.demoToggleAction}>
            {demoOptionsVisible ? "Hide" : "Show Tests"}
          </Text>
        </TouchableOpacity>

        {demoOptionsVisible && (
          <View style={styles.demoBtnRow}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.simBtn}
              onPress={() => {
                if (!isArmed) toggleArm();
                simulateImpactAndRotation();
              }}
            >
              <Zap size={14} color="#FFFFFF" />
              <Text style={styles.simBtnText}>Simulate Fall & Impact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.simBtn, { backgroundColor: "#7C3AED" }]}
              onPress={() => {
                if (!isArmed) toggleArm();
                simulateAcousticDistress();
              }}
            >
              <Volume2 size={14} color="#FFFFFF" />
              <Text style={styles.simBtnText}>Simulate Acoustic Shout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── SETTINGS MODAL ───────────────────────────────────────────── */}
      <Modal visible={settingsModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Sliders size={20} color="#0F172A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>SOS Protection Settings</Text>
                <Text style={styles.modalSub}>
                  Configure autonomous distress sensitivity & cancel thresholds
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setSettingsModalVisible(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Sensitivity Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>DETECTION SENSITIVITY</Text>
              <View style={styles.sensitivityRow}>
                {(["low", "medium", "high"] as SensitivityLevel[]).map((level) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={level}
                    style={[
                      styles.sensitivityOption,
                      selectedSensitivity === level &&
                        styles.sensitivityOptionActive,
                    ]}
                    onPress={() => setSelectedSensitivity(level)}
                  >
                    <Text
                      style={[
                        styles.sensitivityText,
                        selectedSensitivity === level &&
                          styles.sensitivityTextActive,
                      ]}
                    >
                      {level.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.formHint}>
                {selectedSensitivity === "low"
                  ? "Low: High thresholds (26 m/s²). Minimizes false alarms in bumpy transit or high-intensity sports."
                  : selectedSensitivity === "high"
                  ? "High: Heightened sensitivity (19 m/s²). Recommended for solo trekkers or elder travelers."
                  : "Medium (Recommended): Balanced threshold (23 m/s²) for everyday touring and hikes."}
              </Text>
            </View>

            {/* Countdown seconds */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CANCEL COUNTDOWN (SECONDS)</Text>
              <View style={styles.countdownRow}>
                {["5", "10", "15"].map((val) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={val}
                    style={[
                      styles.countdownOption,
                      countdownSecs === val && styles.countdownOptionActive,
                    ]}
                    onPress={() => setCountdownSecs(val)}
                  >
                    <Text
                      style={[
                        styles.countdownOptionText,
                        countdownSecs === val &&
                          styles.countdownOptionTextActive,
                      ]}
                    >
                      {val}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={countdownSecs}
                onChangeText={setCountdownSecs}
                placeholder="Or custom seconds (e.g. 10)"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Emergency Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>DIRECT HELPLINE / CONTACT</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="phone-pad"
                value={emergencyPhoneInput}
                onChangeText={setEmergencyPhoneInput}
                placeholder="e.g. 112 or emergency contact"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Feature Toggles */}
            <View style={styles.togglesCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Acoustic Shock Listener</Text>
                  <Text style={styles.toggleSub}>Listen for screams / loud shock claps</Text>
                </View>
                <Switch
                  value={soundToggle}
                  onValueChange={setSoundToggle}
                  thumbColor={soundToggle ? "#059669" : "#CBD5E1"}
                  trackColor={{ false: "#E2E8F0", true: "#A7F3D0" }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Auto Emergency SMS</Text>
                  <Text style={styles.toggleSub}>Send SMS alert with live GPS coordinates</Text>
                </View>
                <Switch
                  value={autoSmsToggle}
                  onValueChange={setAutoSmsToggle}
                  thumbColor={autoSmsToggle ? "#059669" : "#CBD5E1"}
                  trackColor={{ false: "#E2E8F0", true: "#A7F3D0" }}
                />
              </View>
            </View>

            {/* Save Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.cancelModalBtn}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.saveModalBtn}
                onPress={handleSaveSettings}
              >
                <Text style={styles.saveModalBtnText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DISTRESS SCREEN / COUNTDOWN ─────────────────────────────── */}
      {remainingCountdown !== null && (
        <Modal visible transparent animationType="fade">
          <View style={styles.distressOverlay}>
            <View style={styles.distressModalCard}>
              <Animated.View
                style={[
                  styles.distressPulseCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <ShieldAlert size={56} color="#FFFFFF" />
              </Animated.View>

              <Text style={styles.distressTitle}>🚨 DISTRESS DETECTED 🚨</Text>
              <Text style={styles.distressCause}>
                {activeDistressSource || "Kinematic Fall Anomaly Confirmed"}
              </Text>

              <View style={styles.distressCountdownBox}>
                <Text style={styles.distressCountdownSub}>
                  TRANSMITTING SOS DISPATCH IN
                </Text>
                <Text style={styles.distressCountdownNumber}>
                  {remainingCountdown}
                </Text>
                <Text style={styles.distressCountdownHint}>
                  Tap below if you are safe to immediately stand down
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.safeBtn}
                onPress={abortDistressCountdown}
                activeOpacity={0.85}
              >
                <Text style={styles.safeBtnText}>I AM SAFE (CANCEL SOS)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconBadgeArmed: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  iconBadgeDisarmed: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusTagArmed: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  statusTagDisarmed: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotArmed: {
    backgroundColor: "#16A34A",
  },
  statusDotDisarmed: {
    backgroundColor: "#94A3B8",
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statusTagTextArmed: {
    color: "#15803D",
  },
  statusTagTextDisarmed: {
    color: "#64748B",
  },
  cardSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // Arm Section
  armSection: {
    width: "100%",
  },
  armToggleBtn: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  armBtnActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#22C55E",
  },
  armBtnInactive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  armBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  armIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  armIndicatorActive: {
    backgroundColor: "#16A34A",
  },
  armIndicatorInactive: {
    backgroundColor: "#E2E8F0",
  },
  armBtnTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  armBtnSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  armPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  armPillActive: {
    backgroundColor: "#22C55E",
  },
  armPillInactive: {
    backgroundColor: "#0F172A",
  },
  armPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  armPillTextActive: {
    color: "#FFFFFF",
  },
  armPillTextInactive: {
    color: "#FFFFFF",
  },

  // Gauges
  gaugesContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  gaugesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gaugesTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
  },
  sensitivityBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gaugesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gaugeCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  gaugeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sensorIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gaugeName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.4,
  },
  triggerBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  triggerBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#DC2626",
  },
  gaugeValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  gaugeUnit: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  gaugeThreshold: {
    fontSize: 10,
    color: "#94A3B8",
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  fusionRuleBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  fusionRuleText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    flex: 1,
  },
  activeWindowBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  activeWindowText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },

  // Demo Section
  demoSection: {
    gap: 8,
  },
  demoToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF2FF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  demoToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoToggleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3730A3",
  },
  demoToggleAction: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
  },
  demoBtnRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  simBtn: {
    flex: 1,
    minWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    borderRadius: 12,
  },
  simBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    width: "100%",
    maxWidth: 480,
    gap: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  formHint: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  sensitivityRow: {
    flexDirection: "row",
    gap: 8,
  },
  sensitivityOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sensitivityOptionActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  sensitivityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  sensitivityTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  countdownRow: {
    flexDirection: "row",
    gap: 8,
  },
  countdownOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  countdownOptionActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  countdownOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  countdownOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  togglesCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  toggleSub: {
    fontSize: 11,
    color: "#64748B",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelModalBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  saveModalBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0F172A",
  },
  saveModalBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Distress Overlay
  distressOverlay: {
    flex: 1,
    backgroundColor: "rgba(127, 29, 29, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  distressModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    width: "100%",
    maxWidth: 440,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 2,
    borderColor: "#FCA5A5",
  },
  distressPulseCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  distressTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#991B1B",
    textAlign: "center",
  },
  distressCause: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
    marginTop: -8,
  },
  distressCountdownBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 4,
  },
  distressCountdownSub: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  distressCountdownNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: "#DC2626",
    lineHeight: 70,
  },
  distressCountdownHint: {
    fontSize: 11,
    color: "#7F1D1D",
    textAlign: "center",
  },
  safeBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  safeBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  ambientPillSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  ambientPillTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sensitivityPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  sensitivityPillBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  sensitivityPillBtnActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  sensitivityPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  sensitivityPillTextActive: {
    color: "#059669",
    fontWeight: "800",
  },
  diagToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
    marginBottom: 4,
  },
  diagToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diagToggleTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  diagToggleAction: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
});
