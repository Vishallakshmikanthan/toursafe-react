import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutChangeEvent,
  Platform,
  Vibration,
} from "react-native";
import { ShieldAlert, ChevronsRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SlideToTriggerSOSProps {
  onTrigger: () => void | Promise<void>;
  disabled?: boolean;
  active?: boolean;
  label?: string;
  activeLabel?: string;
}

export function SlideToTriggerSOS({
  onTrigger,
  disabled = false,
  active = false,
  label = "SLIDE FOR EMERGENCY SOS",
  activeLabel = "EMERGENCY DISPATCH ACTIVE",
}: SlideToTriggerSOSProps) {
  const [trackWidth, setTrackWidth] = useState(320);
  const dragX = useRef(new Animated.Value(0)).current;
  const lastHapticStep = useRef<number>(0);
  const isTriggered = useRef<boolean>(false);

  const KNOB_SIZE = 52;
  const PADDING = 4;
  const maxDrag = Math.max(1, trackWidth - KNOB_SIZE - PADDING * 2);

  // Trigger contextual haptic safely
  const triggerHaptic = (style: "light" | "medium" | "heavy" | "success" | "error") => {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        if (style === "light") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (style === "medium") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (style === "heavy") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (style === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        // Web fallback
        if (style === "heavy" || style === "error") {
          Vibration.vibrate(200);
        }
      }
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  };

  useEffect(() => {
    if (!active) {
      isTriggered.current = false;
      Animated.spring(dragX, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
      }).start();
    } else {
      Animated.timing(dragX, {
        toValue: maxDrag,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [active, maxDrag]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !active,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !disabled && !active && Math.abs(gestureState.dx) > 4,
      onPanResponderGrant: () => {
        lastHapticStep.current = 0;
        triggerHaptic("light");
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabled || isTriggered.current || active) return;
        const currentX = Math.max(0, Math.min(gestureState.dx, maxDrag));
        dragX.setValue(currentX);

        const progress = currentX / maxDrag;

        // Progressive haptic feedback steps (25%, 50%, 75%)
        if (progress >= 0.25 && lastHapticStep.current < 1) {
          lastHapticStep.current = 1;
          triggerHaptic("light");
        } else if (progress >= 0.5 && lastHapticStep.current < 2) {
          lastHapticStep.current = 2;
          triggerHaptic("medium");
        } else if (progress >= 0.75 && lastHapticStep.current < 3) {
          lastHapticStep.current = 3;
          triggerHaptic("heavy");
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabled || active) return;
        const currentX = gestureState.dx;
        const progress = currentX / maxDrag;

        if (progress >= 0.85) {
          // Trigger successful emergency activation!
          isTriggered.current = true;
          triggerHaptic("error");
          Animated.timing(dragX, {
            toValue: maxDrag,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            onTrigger();
          });
        } else {
          // Aborted: spring back smoothly
          lastHapticStep.current = 0;
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: false,
            friction: 7,
            tension: 50,
          }).start();
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== trackWidth) {
      setTrackWidth(width);
    }
  };

  const textOpacity = dragX.interpolate({
    inputRange: [0, maxDrag * 0.6, maxDrag],
    outputRange: [1, 0.2, 0],
    extrapolate: "clamp",
  });

  const trackBgColor = dragX.interpolate({
    inputRange: [0, maxDrag],
    outputRange: ["rgba(220, 38, 38, 0.12)", "rgba(220, 38, 38, 0.95)"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.track,
          disabled && styles.trackDisabled,
          active && styles.trackActive,
        ]}
        onLayout={handleLayout}
      >
        {/* Dynamic fill background */}
        <Animated.View
          style={[
            styles.trackFill,
            {
              width: dragX.interpolate({
                inputRange: [0, maxDrag],
                outputRange: [KNOB_SIZE + PADDING * 2, trackWidth],
                extrapolate: "clamp",
              }),
              backgroundColor: trackBgColor,
            },
          ]}
        />

        {/* Shimmering Center Text */}
        <Animated.View
          style={[styles.textContainer, { opacity: active ? 1 : textOpacity }]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.sliderText,
              active && styles.sliderTextActive,
              disabled && styles.sliderTextDisabled,
            ]}
          >
            {active ? activeLabel : label}
          </Text>
          {!active && (
            <View style={styles.chevronsRow}>
              <ChevronsRight size={18} color="#DC2626" />
            </View>
          )}
        </Animated.View>

        {/* Draggable Slider Knob */}
        <Animated.View
          style={[
            styles.knob,
            active && styles.knobActive,
            {
              transform: [{ translateX: dragX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <ShieldAlert size={26} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    paddingVertical: 6,
  },
  track: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(254, 242, 242, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  trackActive: {
    backgroundColor: "#DC2626",
    borderColor: "#B91C1C",
  },
  trackDisabled: {
    opacity: 0.6,
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
  },
  textContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 48,
    gap: 4,
  },
  sliderText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.8,
  },
  sliderTextActive: {
    color: "#FFFFFF",
  },
  sliderTextDisabled: {
    color: "#64748B",
  },
  chevronsRow: {
    marginLeft: 2,
  },
  knob: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    zIndex: 10,
  },
  knobActive: {
    backgroundColor: "#991B1B",
    borderColor: "#FCA5A5",
  },
});
