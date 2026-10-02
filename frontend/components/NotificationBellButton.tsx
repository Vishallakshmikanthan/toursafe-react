import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { realtimeClient } from "@/lib/realtimeClient";
import { NotificationCenterModal } from "./NotificationCenterModal";

interface Props {
  apiBaseUrl?: string;
  authToken?: string;
}

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export function NotificationBellButton({ apiBaseUrl = DEFAULT_API_BASE, authToken }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBaseUrl}/api/v1/notifications/unread-count`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // offline/dev fallback
    }
  };

  useEffect(() => {
    fetchUnread();
    const unsub = realtimeClient.onEvent("notification.created", () => {
      setUnreadCount((prev) => prev + 1);
    });
    return () => {
      unsub();
    };
  }, [authToken, apiBaseUrl]);

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
      >
        <Bell size={18} color="#0F172A" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationCenterModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          fetchUnread();
        }}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});
