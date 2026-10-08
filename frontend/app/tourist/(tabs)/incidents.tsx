/**
 * TourSafe Active Incident & Responder Operations Screen
 * Upgraded to TourSafe Glassmorphism Design System & Live Backend API.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { useAuthStore } from "@/store/authStore";
import { emergencyApi } from "@/lib/api";
import {
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  Phone,
  AlertTriangle,
  Radio,
  Navigation,
  MessageSquare,
  Sparkles,
  Info,
  Shield,
  ShieldCheck,
  User,
  ArrowLeft,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

interface OperationalMessage {
  id: string;
  sender_type: "system" | "responder" | "tourist" | "authority";
  sender_name: string;
  message: string;
  timestamp: string;
}

export default function IncidentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    activeIncidentId,
    incidentState,
    assignedResponder,
  } = useSOSStore();

  const [messages, setMessages] = useState<OperationalMessage[]>([
    {
      id: "msg-1",
      sender_type: "system",
      sender_name: "TourSafe Automated Dispatch",
      message: "Emergency telemetry received. Kodaikanal Lake QRT-4 alert broadcast armed.",
      timestamp: "10:14 AM",
    },
    {
      id: "msg-2",
      sender_type: "responder",
      sender_name: "Sub-Inspector V. Ramanathan",
      message: "Unit dispatched from Boat Club outpost. Maintain position. ETA 3 mins.",
      timestamp: "10:15 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: OperationalMessage = {
      id: `msg-${Date.now()}`,
      sender_type: "tourist",
      sender_name: user?.full_name?.split(" ")[0] || "Tourist",
      message: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  const handleCall = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {});
  };

  return (
    <ImageBackground
      source={require("@/assets/hero-bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.mistOverlay} />

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
              <TouchableOpacity
                style={styles.backCircleBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#FFFFFF" />
              </TouchableOpacity>
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

          {/* ── GREETING & INCIDENT KICKER ───────────────────────── */}
          <View style={styles.headerBlock}>
            <View style={styles.badgeRow}>
              <Radio size={12} color="#EF4444" />
              <Text style={styles.badgeText}>LIVE OPERATIONAL SITUATION ROOM</Text>
            </View>
            <Text style={styles.headerTitle}>Incident Operations</Text>
            <Text style={styles.headerSub}>
              Direct 2-way tactical connection with assigned Quick Response Team (QRT).
            </Text>
          </View>

          {/* ── ACTIVE INCIDENT HUD CARD ─────────────────────────── */}
          <View style={styles.incidentCard}>
            <View style={styles.incidentCardHeader}>
              <View>
                <Text style={styles.incidentIdText}>INCIDENT #{activeIncidentId || "TS-8842"}</Text>
                <Text style={styles.incidentStatusText}>STATUS: DISPATCH IN PROGRESS</Text>
              </View>
              <View style={styles.pulseLiveBadge}>
                <View style={styles.pulseRedDot} />
                <Text style={styles.pulseLiveText}>LIVE</Text>
              </View>
            </View>

            {/* Responder Unit Box */}
            <View style={styles.responderBox}>
              <View style={styles.responderAvatar}>
                <ShieldCheck size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.responderName}>SI V. Ramanathan (Unit #4)</Text>
                <Text style={styles.responderSub}>Kodaikanal Lake Patrol QRT • ETA &lt;3 mins</Text>
              </View>
              <TouchableOpacity
                style={styles.callResponderBtn}
                onPress={() => handleCall("112")}
                activeOpacity={0.8}
              >
                <Phone size={13} color="#FFFFFF" />
                <Text style={styles.callResponderBtnText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 2-WAY OPERATIONAL MESSAGES ───────────────────────── */}
          <View style={styles.messagesCard}>
            <Text style={styles.sectionHeaderTitle}>TACTICAL COMMS STREAM</Text>

            <View style={styles.messagesList}>
              {messages.map((m) => {
                const isUser = m.sender_type === "tourist";
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.msgBubble,
                      isUser ? styles.msgBubbleUser : styles.msgBubbleOther,
                    ]}
                  >
                    <Text style={styles.msgSenderName}>{m.sender_name}</Text>
                    <Text style={styles.msgBodyText}>{m.message}</Text>
                    <Text style={styles.msgTimestamp}>{m.timestamp}</Text>
                  </View>
                );
              })}
            </View>

            {/* Input Bar */}
            <View style={styles.inputBarRow}>
              <TextInput
                style={styles.msgTextInput}
                placeholder="Type update to responders..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                activeOpacity={0.8}
              >
                <Send size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  backCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
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
    color: "#EF4444",
    letterSpacing: 0.8,
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

  /* ── INCIDENT CARD ── */
  incidentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 16,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        } as any)
      : {}),
  },
  incidentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  incidentIdText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  incidentStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pulseLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.28)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  pulseRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  pulseLiveText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  responderBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  responderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  responderName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  responderSub: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  callResponderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  callResponderBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* ── MESSAGES CARD ── */
  messagesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 20,
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
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  messagesList: {
    gap: 10,
    marginBottom: 14,
  },
  msgBubble: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  msgBubbleUser: {
    backgroundColor: "rgba(2, 132, 199, 0.3)",
    borderColor: "rgba(56, 189, 248, 0.4)",
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  msgBubbleOther: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "flex-start",
    maxWidth: "88%",
  },
  msgSenderName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    marginBottom: 2,
  },
  msgBodyText: {
    fontSize: 12.5,
    color: "#FFFFFF",
    lineHeight: 17,
  },
  msgTimestamp: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.6)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputBarRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  msgTextInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#FFFFFF",
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
});
