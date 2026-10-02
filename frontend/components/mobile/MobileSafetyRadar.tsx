import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Activity,
  Battery,
  MapPin,
  Wifi,
  Sparkles,
  ChevronRight,
} from "lucide-react-native";

interface MobileSafetyRadarProps {
  status: "safe" | "caution" | "emergency";
  zoneName?: string;
  batteryLevel?: number;
  gpsAccuracy?: number;
  isMoving?: boolean;
  onPressDetails?: () => void;
}

export function MobileSafetyRadar({
  status = "safe",
  zoneName = "Kodaikanal Lake Safe Haven",
  batteryLevel = 95,
  gpsAccuracy = 4,
  isMoving = false,
  onPressDetails,
}: MobileSafetyRadarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  const isSafe = status === "safe";
  const isCaution = status === "caution";
  const isEmergency = status === "emergency";

  const primaryColor = isSafe ? "#0284C7" : isCaution ? "#F59E0B" : "#EF4444";
  const badgeBgColor = isSafe
    ? "rgba(2, 132, 199, 0.1)"
    : isCaution
    ? "rgba(245, 158, 11, 0.1)"
    : "rgba(239, 68, 68, 0.1)";
  const badgeBorderColor = isSafe
    ? "rgba(2, 132, 199, 0.25)"
    : isCaution
    ? "rgba(245, 158, 11, 0.3)"
    : "rgba(239, 68, 68, 0.3)";

  const cardBg = isSafe
    ? "rgba(255, 255, 255, 0.94)"
    : isCaution
    ? "rgba(255, 251, 235, 0.95)"
    : "rgba(254, 242, 242, 0.95)";

  const cardBorder = isSafe
    ? "rgba(2, 132, 199, 0.2)"
    : isCaution
    ? "rgba(245, 158, 11, 0.3)"
    : "rgba(239, 68, 68, 0.3)";

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [status]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={onPressDetails}
      activeOpacity={onPressDetails ? 0.9 : 1}
    >
      {/* Zone Capsule Banner */}
      <View style={styles.zoneCapsuleRow}>
        <View style={styles.zoneCapsule}>
          <View style={[styles.statusDot, { backgroundColor: primaryColor }]} />
          <Text style={styles.zoneCapsuleText} numberOfLines={1}>
            {zoneName}
          </Text>
        </View>

        <View style={[styles.guardBadge, { backgroundColor: badgeBgColor, borderColor: badgeBorderColor }]}>
          <Sparkles size={11} color={primaryColor} />
          <Text style={[styles.guardBadgeText, { color: primaryColor }]}>
            {isSafe ? "GUARD ACTIVE" : isCaution ? "ELEVATED WATCH" : "ALERTING"}
          </Text>
        </View>
      </View>

      {/* Main Radar Visual + Status Info */}
      <View style={styles.radarContentRow}>
        {/* Pulsing Shield Ring */}
        <View style={styles.radarVisualContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: primaryColor,
                opacity: pulseOpacity,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View
            style={[
              styles.shieldCenterCircle,
              { backgroundColor: isSafe ? "#0284C7" : isCaution ? "#D97706" : "#DC2626" },
            ]}
          >
            {isSafe && <ShieldCheck size={30} color="#FFFFFF" />}
            {isCaution && <Shield size={30} color="#FFFFFF" />}
            {isEmergency && <ShieldAlert size={30} color="#FFFFFF" />}
          </View>
        </View>

        {/* Status Texts */}
        <View style={styles.statusInfoCol}>
          <Text style={[styles.radarStateTitle, { color: primaryColor }]}>
            {isSafe
              ? "ALL SYSTEMS SECURED"
              : isCaution
              ? "APPROACHING CAUTION"
              : "EMERGENCY ACTIVE"}
          </Text>
          <Text style={styles.radarStateDesc}>
            {isSafe
              ? "AI Geofencing & 24/7 Police Dispatch active."
              : isCaution
              ? "Entering unlit mountain corridor. Stay on trail."
              : "Emergency SOS broadcast transmitted to responders."}
          </Text>
        </View>
      </View>

      {/* Compact Status Indicator Strip (Floating Inner Capsule) */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricItem}>
          <MapPin size={13} color="#0284C7" />
          <Text style={styles.metricLabel}>GPS Lock: ±{gpsAccuracy}m</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Battery size={13} color="#0284C7" />
          <Text style={styles.metricLabel}>{batteryLevel}% Battery</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Activity size={13} color="#0284C7" />
          <Text style={styles.metricLabel}>
            {isMoving ? "In Transit" : "Stationary"}
          </Text>
        </View>

        {onPressDetails && (
          <ChevronRight size={14} color="#64748B" style={{ marginLeft: "auto" }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  zoneCapsuleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  zoneCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 249, 255, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  zoneCapsuleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  guardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  guardBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  radarContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
  },
  radarVisualContainer: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
  },
  shieldCenterCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statusInfoCol: {
    flex: 1,
  },
  radarStateTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  radarStateDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
  },
  metricsStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    gap: 8,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#CBD5E1",
  },
});
