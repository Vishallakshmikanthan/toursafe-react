import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { ChevronUp, ChevronDown, Minus } from "lucide-react-native";

export type SheetSnapState = "peek" | "half" | "full";

interface DraggableBottomSheetProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  initialSnap?: SheetSnapState;
  onSnapChange?: (snap: SheetSnapState) => void;
}

export function DraggableBottomSheet({
  children,
  headerContent,
  initialSnap = "peek",
  onSnapChange,
}: DraggableBottomSheetProps) {
  const { height } = useWindowDimensions();

  const SNAP_PEEK = 100;
  const SNAP_HALF = Math.min(380, height * 0.45);
  const SNAP_FULL = Math.min(620, height * 0.78);

  const getSnapHeight = (state: SheetSnapState) => {
    switch (state) {
      case "full":
        return SNAP_FULL;
      case "half":
        return SNAP_HALF;
      case "peek":
      default:
        return SNAP_PEEK;
    }
  };

  const [currentSnap, setCurrentSnap] = useState<SheetSnapState>(initialSnap);
  const sheetHeight = useRef(new Animated.Value(getSnapHeight(initialSnap))).current;

  const animateToSnap = (state: SheetSnapState) => {
    setCurrentSnap(state);
    onSnapChange?.(state);
    Animated.spring(sheetHeight, {
      toValue: getSnapHeight(state),
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  };

  const toggleSnap = () => {
    if (currentSnap === "peek") {
      animateToSnap("half");
    } else if (currentSnap === "half") {
      animateToSnap("full");
    } else {
      animateToSnap("peek");
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const startHeight = getSnapHeight(currentSnap);
        const newHeight = Math.max(
          SNAP_PEEK - 20,
          Math.min(SNAP_FULL + 40, startHeight - gestureState.dy)
        );
        sheetHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dy = gestureState.dy;
        const vy = gestureState.vy;

        if (dy < -60 || vy < -0.5) {
          // Swiped UP
          if (currentSnap === "peek") animateToSnap("half");
          else animateToSnap("full");
        } else if (dy > 60 || vy > 0.5) {
          // Swiped DOWN
          if (currentSnap === "full") animateToSnap("half");
          else animateToSnap("peek");
        } else {
          // Snap to closest
          const currentH = (sheetHeight as any)._value || getSnapHeight(currentSnap);
          const distPeek = Math.abs(currentH - SNAP_PEEK);
          const distHalf = Math.abs(currentH - SNAP_HALF);
          const distFull = Math.abs(currentH - SNAP_FULL);

          if (distPeek <= distHalf && distPeek <= distFull) {
            animateToSnap("peek");
          } else if (distHalf <= distPeek && distHalf <= distFull) {
            animateToSnap("half");
          } else {
            animateToSnap("full");
          }
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        {
          height: sheetHeight,
        },
      ]}
    >
      {/* Draggable Handle Bar */}
      <View style={styles.handleArea} {...panResponder.panHandlers}>
        <View style={styles.handleBar} />
      </View>

      {/* Header section (Always visible in peek) */}
      {headerContent && (
        <TouchableOpacity
          style={styles.headerArea}
          onPress={toggleSnap}
          activeOpacity={0.9}
        >
          {headerContent}
        </TouchableOpacity>
      )}

      {/* Sheet Content Body (Scrollable in half & full) */}
      <View style={styles.sheetBody}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 16,
    zIndex: 900,
    overflow: "hidden",
  },
  handleArea: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
