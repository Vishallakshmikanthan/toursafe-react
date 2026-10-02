import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { Smartphone, Monitor } from "lucide-react-native";

interface MobileDeviceFrameProps {
  children: React.ReactNode;
}

export function MobileDeviceFrame({ children }: MobileDeviceFrameProps) {
  const { width, height } = useWindowDimensions();
  const [forceFullWidth, setForceFullWidth] = useState(false);

  // If running on native iOS/Android, render edge-to-edge
  if (Platform.OS !== "web") {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  // If already on mobile screen or user explicitly requested full width
  const isDesktop = width >= 640;
  if (!isDesktop || forceFullWidth) {
    return (
      <View style={styles.webFullContainer}>
        {isDesktop && (
          <TouchableOpacity
            style={styles.floatingModeToggle}
            onPress={() => setForceFullWidth(false)}
            activeOpacity={0.8}
          >
            <Smartphone size={16} color="#38BDF8" />
            <Text style={styles.floatingModeText}>Device Frame View</Text>
          </TouchableOpacity>
        )}
        {children}
      </View>
    );
  }

  // Desktop web browser view: Elegant mobile device shell
  const frameHeight = Math.min(height - 48, 860);

  return (
    <View style={styles.desktopCanvas}>
      {/* Top Desktop Helper Toolbar */}
      <View style={styles.desktopToolbar}>
        <View style={styles.brandingPill}>
          <View style={styles.statusDot} />
          <Text style={styles.toolbarBrand}>TourSafe Mobile Companion</Text>
          <Text style={styles.toolbarSub}>• iOS / Android Simulator</Text>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setForceFullWidth(true)}
          activeOpacity={0.8}
        >
          <Monitor size={15} color="#94A3B8" />
          <Text style={styles.toggleButtonText}>Full Screen View</Text>
        </TouchableOpacity>
      </View>

      {/* Simulated Mobile Device Frame */}
      <View style={[styles.deviceShell, { height: frameHeight }]}>
        {/* Dynamic Island / Device Speaker */}
        <View style={styles.dynamicIslandContainer}>
          <View style={styles.dynamicIsland}>
            <View style={styles.cameraLens} />
          </View>
        </View>

        {/* Screen Viewport */}
        <View style={styles.deviceScreen}>{children}</View>

        {/* Home Indicator Bar */}
        <View style={styles.homeIndicatorContainer}>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
  },
  webFullContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  floatingModeToggle: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 99999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  floatingModeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  desktopCanvas: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  desktopToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 410,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  brandingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0284C7",
  },
  toolbarBrand: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  toolbarSub: {
    fontSize: 12,
    color: "#64748B",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0284C7",
  },
  deviceShell: {
    width: 410,
    backgroundColor: "#F8FAFC",
    borderRadius: 48,
    borderWidth: 9,
    borderColor: "#1E293B",
    overflow: "hidden",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 36,
    position: "relative",
  },
  dynamicIslandContainer: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
  dynamicIsland: {
    width: 110,
    height: 26,
    backgroundColor: "#000000",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  deviceScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  homeIndicatorContainer: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
  homeIndicator: {
    width: 130,
    height: 4,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    borderRadius: 2,
  },
});
