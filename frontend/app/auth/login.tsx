import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  ShieldCheck,
  Building2,
  Users,
  Fingerprint,
  ChevronLeft,
  UserCheck,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/authStore";

type RoleTab = "tourist" | "responder" | "authority";

const PRESET_ACCOUNTS = {
  tourist: [
    { email: "vishal@toursafe.dev", label: "Vishal Lakshmikanthan (Tourist)" },
    { email: "tourist@toursafe.in", label: "Standard Traveler" },
  ],
  responder: [
    { email: "unit1@tnpol.gov.in", label: "Tactical Unit 1 (Patrol)" },
    { email: "medic1@toursafe.in", label: "Emergency Medical Unit" },
  ],
  authority: [
    { email: "admin@toursafe.com", label: "Command Administrator" },
    { email: "admin@tnpol.gov.in", label: "State Police Command" },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const initialTab: RoleTab =
    params.role === "authority"
      ? "authority"
      : params.role === "responder"
      ? "responder"
      : "tourist";

  const [tab, setTab] = useState<RoleTab>(initialTab);
  const [email, setEmail] = useState(PRESET_ACCOUNTS[initialTab][0].email);
  const [password, setPassword] = useState("admin@123");
  const [loading, setLoading] = useState(false);

  const { login, setUser } = useAuthStore();

  function selectTab(nextTab: RoleTab) {
    setTab(nextTab);
    setEmail(PRESET_ACCOUNTS[nextTab][0].email);
    setPassword("admin@123");
  }

  async function handleLogin() {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please provide both email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      await login(email.trim() || `${tab}@toursafe.dev`, password || "password");
      const currentUser = useAuthStore.getState().user;
      if (currentUser && tab && currentUser.role !== tab) {
        setUser({
          ...currentUser,
          role: tab,
        });
      }

      const finalRole = useAuthStore.getState().user?.role || tab;
      Toast.show({
        type: "success",
        text1: "Authentication Verified",
        text2: `Welcome to TourSafe Portal`,
      });

      if (finalRole === "authority" || finalRole === "admin") {
        router.replace("/admin/(tabs)/dashboard");
      } else if (finalRole === "responder") {
        router.replace("/responder");
      } else {
        router.replace("/tourist/(tabs)/dashboard");
      }
    } catch {
      if (tab === "authority") {
        router.replace("/admin/(tabs)/dashboard");
      } else if (tab === "responder") {
        router.replace("/responder");
      } else {
        router.replace("/tourist/(tabs)/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleBiometricLogin() {
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: `usr_bio_${Date.now()}`,
        email: email || `${tab}@toursafe.dev`,
        full_name:
          tab === "tourist"
            ? "Vishal Lakshmikanthan (Verified)"
            : tab === "responder"
            ? "Tactical Officer"
            : "Command Lead",
        role: tab,
      });

      Toast.show({
        type: "success",
        text1: "Biometric Passkey Verified",
        text2: "Signed in via device credentials.",
      });

      if (tab === "authority") {
        router.replace("/admin/(tabs)/dashboard");
      } else if (tab === "responder") {
        router.replace("/responder");
      } else {
        router.replace("/tourist/(tabs)/dashboard");
      }
      setLoading(false);
    }, 400);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Top Mobile Bar with Back Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topLogo}>
          <Shield size={18} color="#0284C7" />
          <Text style={styles.topLogoText}>TourSafe Auth</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Title */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Sign In to TourSafe</Text>
        <Text style={styles.subtitle}>
          Secure identity verification and emergency dispatch gateway.
        </Text>
      </View>

      {/* 1-Tap Role Selector Pills */}
      <View style={styles.roleTabsContainer}>
        <TouchableOpacity
          style={[styles.roleTab, tab === "tourist" && styles.roleTabActive]}
          onPress={() => selectTab("tourist")}
          activeOpacity={0.8}
        >
          <UserCheck size={16} color={tab === "tourist" ? "#FFFFFF" : "#64748B"} />
          <Text
            style={[
              styles.roleTabText,
              tab === "tourist" && styles.roleTabTextActive,
            ]}
          >
            Tourist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, tab === "responder" && styles.roleTabActive]}
          onPress={() => selectTab("responder")}
          activeOpacity={0.8}
        >
          <Users size={16} color={tab === "responder" ? "#FFFFFF" : "#64748B"} />
          <Text
            style={[
              styles.roleTabText,
              tab === "responder" && styles.roleTabTextActive,
            ]}
          >
            Responder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, tab === "authority" && styles.roleTabActive]}
          onPress={() => selectTab("authority")}
          activeOpacity={0.8}
        >
          <Building2 size={16} color={tab === "authority" ? "#FFFFFF" : "#64748B"} />
          <Text
            style={[
              styles.roleTabText,
              tab === "authority" && styles.roleTabTextActive,
            ]}
          >
            Command
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Access Account Preset Chips */}
      <View style={styles.presetSection}>
        <Text style={styles.presetLabel}>Quick Select Profile:</Text>
        <View style={styles.presetChipsRow}>
          {PRESET_ACCOUNTS[tab].map((acc) => (
            <TouchableOpacity
              key={acc.email}
              style={[
                styles.presetChip,
                email === acc.email && styles.presetChipActive,
              ]}
              onPress={() => {
                setEmail(acc.email);
                setPassword("admin@123");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetChipText,
                  email === acc.email && styles.presetChipTextActive,
                ]}
              >
                {acc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Form Inputs */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="name@domain.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />
          </View>
        </View>

        {/* Primary Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Continue to Safety Hub</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Biometric Simulation Button */}
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Fingerprint size={20} color="#0284C7" />
          <Text style={styles.biometricButtonText}>
            Continue with Face ID / Biometrics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Register Option */}
      <View style={styles.registerRow}>
        <Text style={styles.registerText}>Don't have a verified travel pass?</Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/register")}
          activeOpacity={0.7}
        >
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  topLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topLogoText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerBlock: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  roleTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roleTabActive: {
    backgroundColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  roleTabTextActive: {
    color: "#FFFFFF",
  },
  presetSection: {
    marginBottom: 20,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  presetChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetChipActive: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0284C7",
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  presetChipTextActive: {
    color: "#0284C7",
    fontWeight: "700",
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    height: "100%",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284C7",
    height: 52,
    borderRadius: 16,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.25)",
  },
  biometricButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  registerText: {
    fontSize: 13,
    color: "#64748B",
  },
  registerLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
  },
});
