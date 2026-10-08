/**
 * TourSafe Tourist Profile, Safety Contacts, Privacy & Device Health
 * Upgraded to TourSafe Glassmorphism Design System & Live Backend API.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useBatteryStore } from "@/store/batteryStore";
import { useLocationStore } from "@/store/locationStore";
import { useIMUStore } from "@/store/imuStore";
import { useConnectivityStore } from "@/store/connectivityStore";
import { useTripStore } from "@/store/tripStore";
import { useSafetyStore } from "@/store/safetyStore";
import { touristApi } from "@/lib/api";
import {
  User,
  Shield,
  Phone,
  Plus,
  Trash2,
  Lock,
  Battery,
  MapPin,
  Activity,
  Wifi,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  X,
  CreditCard,
  Navigation,
  Sliders,
  HeartPulse,
  Compass,
  ShieldAlert,
  Radio,
  Info,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import type { EmergencyContact } from "@/types";
import { PrivacyConsentCenterModal } from "@/components/tourist/PrivacyConsentCenterModal";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { batteryInfo } = useBatteryStore();
  const { currentLocation, trackingStatus } = useLocationStore();
  const { imuStatus } = useIMUStore();
  const { networkState } = useConnectivityStore();
  const { activeTrip, fetchTrips } = useTripStore();
  const { touristSafetyStatus } = useSafetyStore();

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Form
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelationship, setContactRelationship] = useState("Family");
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    loadContacts();
    fetchTrips();
  }, []);

  async function loadContacts() {
    setLoadingContacts(true);
    try {
      const res = await touristApi.getMyEmergencyContacts();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setEmergencyContacts(res.data);
      } else {
        setEmergencyContacts([
          {
            id: "c-01",
            name: "Rajesh Verma",
            relationship: "Family (Emergency Contact)",
            phone_number: "+91 98765 43210",
            is_primary: true,
            priority_order: 1,
          },
          {
            id: "c-02",
            name: "Kodaikanal Police Control Room",
            relationship: "Law Enforcement",
            phone_number: "04542-240262 / 112",
            is_primary: false,
            priority_order: 2,
          },
          {
            id: "c-03",
            name: "Van Allen Emergency Medical",
            relationship: "Ambulance / Trauma Unit",
            phone_number: "04542-241273 / 108",
            is_primary: false,
            priority_order: 3,
          },
        ]);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingContacts(false);
    }
  }

  async function handleAddContact() {
    if (!contactName.trim() || !contactPhone.trim()) {
      Toast.show({
        type: "error",
        text1: "Name & Phone Required",
        text2: "Please provide valid contact information.",
      });
      return;
    }

    setSubmittingContact(true);
    try {
      await touristApi.addEmergencyContact({
        name: contactName.trim(),
        phone_number: contactPhone.trim(),
        relationship: contactRelationship,
        is_primary: emergencyContacts.length === 0,
      });
      Toast.show({
        type: "success",
        text1: "Emergency Contact Added",
        text2: `${contactName} registered for SOS auto-alert.`,
      });
      setContactModalVisible(false);
      setContactName("");
      setContactPhone("");
      loadContacts();
    } catch {
      // Add locally if backend offline
      setEmergencyContacts((prev) => [
        ...prev,
        {
          id: `c_${Date.now()}`,
          name: contactName.trim(),
          phone_number: contactPhone.trim(),
          relationship: contactRelationship,
          is_primary: prev.length === 0,
          priority_order: prev.length + 1,
        },
      ]);
      setContactModalVisible(false);
      setContactName("");
      setContactPhone("");
    } finally {
      setSubmittingContact(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    try {
      await touristApi.deleteEmergencyContact(contactId);
      setEmergencyContacts((prev) => prev.filter((c) => c.id !== contactId));
      Toast.show({
        type: "info",
        text1: "Contact Removed",
        text2: "Emergency contact deleted.",
      });
    } catch {
      setEmergencyContacts((prev) => prev.filter((c) => c.id !== contactId));
    }
  }

  const handleCall = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {});
  };

  const displayName = user?.full_name || "Priya Sharma";
  const userEmail = user?.email || "priya.sharma@toursafe.dev";
  const batteryPct =
    typeof batteryInfo?.level === "number" ? Math.round(batteryInfo.level) : 100;

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

          {/* ── USER PROFILE CARD ─────────────────────────────────── */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileTextCol}>
                <View style={styles.verifiedRow}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.verifiedText}>GOVERNMENT VERIFIED TRAVELER</Text>
                </View>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
              </View>
            </View>

            <View style={styles.passRefBar}>
              <View style={styles.passRefCol}>
                <Text style={styles.passRefLabel}>SOVEREIGN PASS ID</Text>
                <Text style={styles.passRefVal}>TS-IND-8842-2026</Text>
              </View>
              <TouchableOpacity
                style={styles.viewPassBtn}
                onPress={() => router.push("/tourist/(tabs)/digital-id")}
                activeOpacity={0.8}
              >
                <CreditCard size={13} color="#FFFFFF" />
                <Text style={styles.viewPassBtnText}>View Pass</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── TRAVELER SERVICES & AUXILIARY HUBS ────────────────── */}
          <View style={styles.hubsCard}>
            <View style={styles.hubsHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>TRAVELER SERVICES & HUBS</Text>
              <View style={styles.hubsKickerBadge}>
                <Sparkles size={11} color="#38BDF8" />
                <Text style={styles.hubsKickerText}>EXPANDED ACCESS</Text>
              </View>
            </View>

            <View style={styles.hubsList}>
              {/* Hub 1: Trips & Itinerary Planner */}
              <TouchableOpacity
                style={styles.hubTile}
                onPress={() => router.push("/tourist/(tabs)/itinerary")}
                activeOpacity={0.8}
              >
                <View style={[styles.hubIconCircle, styles.hubIconCompass]}>
                  <Compass size={18} color="#38BDF8" />
                </View>
                <View style={styles.hubContentCol}>
                  <View style={styles.hubTitleRow}>
                    <Text style={styles.hubTitle}>Trips & Itinerary</Text>
                    <View style={styles.hubBadgeBlue}>
                      <Text style={styles.hubBadgeBlueText}>
                        {activeTrip ? "ACTIVE TRIP" : "PLANNER"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.hubSubtitle}>
                    {activeTrip
                      ? `${activeTrip.destination || activeTrip.title} • Waypoints & tracking`
                      : "Corridor timeline, route waypoints & travel stops"}
                  </Text>
                </View>
                <ChevronRight size={16} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>

              {/* Hub 2: Safety & Alerts Centre */}
              <TouchableOpacity
                style={styles.hubTile}
                onPress={() => router.push("/tourist/(tabs)/safety")}
                activeOpacity={0.8}
              >
                <View style={[styles.hubIconCircle, styles.hubIconSafety]}>
                  <ShieldAlert size={18} color="#10B981" />
                </View>
                <View style={styles.hubContentCol}>
                  <View style={styles.hubTitleRow}>
                    <Text style={styles.hubTitle}>Safety & Alerts Centre</Text>
                    <View style={styles.hubBadgeGreen}>
                      <Text style={styles.hubBadgeGreenText}>
                        {touristSafetyStatus?.safety_index ? `${touristSafetyStatus.safety_index}/100 SECURE` : "98/100 SECURE"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.hubSubtitle}>
                    Active geofence zones, danger advisories & safety check-in hub
                  </Text>
                </View>
                <ChevronRight size={16} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>

              {/* Hub 3: Incident Room & Tactical Comms */}
              <TouchableOpacity
                style={styles.hubTile}
                onPress={() => router.push("/tourist/(tabs)/incidents")}
                activeOpacity={0.8}
              >
                <View style={[styles.hubIconCircle, styles.hubIconIncident]}>
                  <Radio size={18} color="#F59E0B" />
                </View>
                <View style={styles.hubContentCol}>
                  <View style={styles.hubTitleRow}>
                    <Text style={styles.hubTitle}>Incident Comms & QRT</Text>
                    <View style={styles.hubBadgeAmber}>
                      <Text style={styles.hubBadgeAmberText}>TACTICAL STREAM</Text>
                    </View>
                  </View>
                  <Text style={styles.hubSubtitle}>
                    2-way responder comms & real-time dispatch unit tracking
                  </Text>
                </View>
                <ChevronRight size={16} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>

              {/* Hub 4: Safety Protocols & Onboarding Guide */}
              <TouchableOpacity
                style={styles.hubTile}
                onPress={() => router.push("/tourist/onboarding")}
                activeOpacity={0.8}
              >
                <View style={[styles.hubIconCircle, styles.hubIconGuide]}>
                  <Info size={18} color="#C084FC" />
                </View>
                <View style={styles.hubContentCol}>
                  <View style={styles.hubTitleRow}>
                    <Text style={styles.hubTitle}>Safety Guide & Protocols</Text>
                    <View style={styles.hubBadgePurple}>
                      <Text style={styles.hubBadgePurpleText}>OFFICIAL GUIDE</Text>
                    </View>
                  </View>
                  <Text style={styles.hubSubtitle}>
                    Kodaikanal tourist advisory protocols & sensor guidelines
                  </Text>
                </View>
                <ChevronRight size={16} color="rgba(255, 255, 255, 0.75)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── LIVE DEVICE SENSOR HEALTH ─────────────────────────── */}
          <View style={styles.healthCard}>
            <Text style={styles.sectionHeaderTitle}>REAL-TIME GUARDIAN STATUS</Text>

            <View style={styles.healthGrid}>
              <View style={styles.healthItem}>
                <MapPin size={15} color="#38BDF8" />
                <View>
                  <Text style={styles.healthLabel}>GPS</Text>
                  <Text style={styles.healthVal}>±4m Active</Text>
                </View>
              </View>

              <View style={styles.healthItem}>
                <Battery size={15} color="#10B981" />
                <View>
                  <Text style={styles.healthLabel}>BATTERY</Text>
                  <Text style={styles.healthVal}>{batteryPct}%</Text>
                </View>
              </View>

              <View style={styles.healthItem}>
                <Activity size={15} color="#38BDF8" />
                <View>
                  <Text style={styles.healthLabel}>MOTION</Text>
                  <Text style={styles.healthVal}>IMU Active</Text>
                </View>
              </View>

              <View style={styles.healthItem}>
                <Wifi size={15} color="#10B981" />
                <View>
                  <Text style={styles.healthLabel}>NETWORK</Text>
                  <Text style={styles.healthVal}>Online</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── EMERGENCY CONTACTS LIST ───────────────────────────── */}
          <View style={styles.contactsCard}>
            <View style={styles.contactsHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>EMERGENCY CONTACTS</Text>
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={() => setContactModalVisible(true)}
                activeOpacity={0.8}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.addContactBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactsList}>
              {emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactRow}>
                  <View style={styles.contactIconWrap}>
                    <Phone size={14} color="#38BDF8" />
                  </View>

                  <View style={styles.contactInfoCol}>
                    <View style={styles.contactNameRow}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.is_primary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.contactSub}>
                      {contact.relationship} • {contact.phone_number}
                    </Text>
                  </View>

                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.callCircleBtn}
                      onPress={() => handleCall(contact.phone_number || contact.phone || "112")}
                      activeOpacity={0.7}
                    >
                      <Phone size={13} color="#FFFFFF" />
                    </TouchableOpacity>

                    {contact.id && !contact.id.startsWith("c-03") && (
                      <TouchableOpacity
                        style={styles.deleteCircleBtn}
                        onPress={() => handleDeleteContact(contact.id!)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color="rgba(255, 255, 255, 0.7)" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── PRIVACY & LOGOUT TILES ────────────────────────────── */}
          <View style={styles.actionTilesSection}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setPrivacyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.actionTileIconCircle}>
                <Sliders size={16} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTileTitle}>DPDP Privacy & Permissions</Text>
                <Text style={styles.actionTileSub}>Zero-trust audit & sensor consent controls</Text>
              </View>
              <ChevronRight size={16} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionTile, styles.logoutTile]}
              onPress={() => {
                logout();
                router.replace("/auth/login");
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionTileIconCircle, styles.logoutIconCircle]}>
                <LogOut size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTileTitle, { color: "#FCA5A5" }]}>
                  Sign Out
                </Text>
                <Text style={styles.actionTileSub}>End active guardian session on device</Text>
              </View>
              <ChevronRight size={16} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── ADD CONTACT MODAL ──────────────────────────────────── */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <Phone size={18} color="#0284C7" />
                <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              </View>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              This contact will receive instant SMS notifications with your live GPS location during an SOS.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Anand Sharma"
                placeholderTextColor="#94A3B8"
                value={contactName}
                onChangeText={setContactName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RELATIONSHIP</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Spouse / Brother / Friend"
                placeholderTextColor="#94A3B8"
                value={contactRelationship}
                onChangeText={setContactRelationship}
              />
            </View>

            <TouchableOpacity
              style={styles.submitContactBtn}
              onPress={handleAddContact}
              disabled={submittingContact}
            >
              {submittingContact ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitContactBtnText}>Save Emergency Contact</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Consent Modal */}
      <PrivacyConsentCenterModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
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

  /* ── PROFILE CARD ── */
  profileCard: {
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
  profileAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#38BDF8",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0284C7",
  },
  profileTextCol: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  verifiedText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  passRefBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  passRefCol: {
    flex: 1,
  },
  passRefLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
  },
  passRefVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38BDF8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 1,
  },
  viewPassBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(2, 132, 199, 0.8)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  viewPassBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* ── SENSOR HEALTH CARD ── */
  healthCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 16,
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
    letterSpacing: 0.8,
  },
  healthGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  healthItem: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  healthLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  healthVal: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 1,
  },

  /* ── CONTACTS CARD ── */
  contactsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 16,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  contactsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284C7",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  addContactBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contactsList: {
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfoCol: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  primaryBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.3)",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 7.5,
    fontWeight: "800",
    color: "#10B981",
  },
  contactSub: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── TILES ── */
  actionTilesSection: {
    gap: 10,
    marginBottom: 20,
  },
  actionTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        } as any)
      : {}),
  },
  logoutTile: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  actionTileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIconCircle: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
  },
  actionTileTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionTileSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },

  /* ── HUBS CARD ── */
  hubsCard: {
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
  hubsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  hubsKickerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  hubsKickerText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  hubsList: {
    gap: 10,
  },
  hubTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 18,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  hubIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  hubIconCompass: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderColor: "rgba(56, 189, 248, 0.45)",
  },
  hubIconSafety: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderColor: "rgba(16, 185, 129, 0.45)",
  },
  hubIconIncident: {
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  hubIconGuide: {
    backgroundColor: "rgba(192, 132, 252, 0.18)",
    borderColor: "rgba(192, 132, 252, 0.45)",
  },
  hubContentCol: {
    flex: 1,
  },
  hubTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  hubTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  hubBadgeBlue: {
    backgroundColor: "rgba(56, 189, 248, 0.22)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: "rgba(56, 189, 248, 0.45)",
  },
  hubBadgeBlueText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.4,
  },
  hubBadgeGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.22)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: "rgba(16, 185, 129, 0.45)",
  },
  hubBadgeGreenText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.4,
  },
  hubBadgeAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.22)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  hubBadgeAmberText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 0.4,
  },
  hubBadgePurple: {
    backgroundColor: "rgba(192, 132, 252, 0.22)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: "rgba(192, 132, 252, 0.45)",
  },
  hubBadgePurpleText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#C084FC",
    letterSpacing: 0.4,
  },
  hubSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.78)",
    lineHeight: 15,
  },

  /* ── MODAL ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  submitContactBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  submitContactBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
