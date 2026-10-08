/**
 * TourSafe Trips & Itinerary Management Screen
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
  Alert as RNAlert,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTripStore } from "@/store/tripStore";
import { useLocationStore } from "@/store/locationStore";
import { trackingSessionService } from "@/lib/tracking-session/trackingSessionService";
import {
  MapPin,
  Calendar,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  Navigation,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Flag,
  Shield,
  User,
  X,
  ArrowLeft,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import type { TouristTrip, TripItineraryStop } from "@/types";

export default function ItineraryScreen() {
  const router = useRouter();
  const {
    trips,
    activeTrip,
    upcomingTrips,
    completedTrips,
    loading,
    fetchTrips,
    createTrip,
    addStopToTrip,
    completeActiveTrip,
  } = useTripStore();
  const { trackingStatus } = useLocationStore();

  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed">("active");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [addStopModalVisible, setAddStopModalVisible] = useState(false);

  // Form states
  const [tripTitle, setTripTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Stop state
  const [stopName, setStopName] = useState("");
  const [stopLocation, setStopLocation] = useState("");
  const [stopTime, setStopTime] = useState("10:00 AM");

  useEffect(() => {
    fetchTrips();
  }, []);

  async function handleCreateTrip() {
    if (!tripTitle.trim() || !destination.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Title and destination are required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTrip({
        title: tripTitle.trim(),
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || undefined,
        status: "active",
      });

      if (created) {
        Toast.show({
          type: "success",
          text1: "Journey Created",
          text2: `Active corridor set to ${destination}`,
        });
        setCreateModalVisible(false);
        setTripTitle("");
        setDestination("");
        setDescription("");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Creation Failed",
        text2: err?.message || "Could not create trip",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddStop() {
    if (!stopName.trim() || !activeTrip) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Waypoint name is required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const newStop: TripItineraryStop = {
        name: stopName.trim(),
        location: stopLocation.trim() || stopName.trim(),
        planned_arrival: stopTime.trim(),
        status: "pending",
        order_index: (activeTrip.itinerary_stops?.length || 0) + 1,
      };

      await addStopToTrip(activeTrip.id, newStop);
      Toast.show({
        type: "success",
        text1: "Waypoint Added",
        text2: `${stopName} registered on itinerary trail.`,
      });
      setAddStopModalVisible(false);
      setStopName("");
      setStopLocation("");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.message || "Failed to add waypoint",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteTrip() {
    RNAlert.alert(
      "Complete Journey",
      "Conclude active GPS safety corridor monitoring and archive this itinerary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Conclude",
          style: "destructive",
          onPress: async () => {
            await trackingSessionService.stopTracking();
            const success = await completeActiveTrip();
            if (success) {
              Toast.show({
                type: "success",
                text1: "Trip Concluded",
                text2: "Safely archived to journey history.",
              });
              setActiveTab("completed");
            }
          },
        },
      ]
    );
  }

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

          {/* ── TITLE & CREATE ACTION ────────────────────────────── */}
          <View style={styles.headerBlock}>
            <View style={styles.headerKickerRow}>
              <Compass size={12} color="#38BDF8" />
              <Text style={styles.headerKicker}>TOURIST JOURNEY PLANNER</Text>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Trips & Itinerary</Text>
              <TouchableOpacity
                style={styles.newTripBtn}
                onPress={() => setCreateModalVisible(true)}
                activeOpacity={0.8}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.newTripBtnText}>New Trip</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── PILL TABS BAR ─────────────────────────────────────── */}
          <View style={styles.pillTabsBar}>
            <TouchableOpacity
              style={[styles.pillTab, activeTab === "active" && styles.pillTabActive]}
              onPress={() => setActiveTab("active")}
            >
              <Text style={[styles.pillTabText, activeTab === "active" && styles.pillTabTextActive]}>
                Active Journey
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillTab, activeTab === "upcoming" && styles.pillTabActive]}
              onPress={() => setActiveTab("upcoming")}
            >
              <Text style={[styles.pillTabText, activeTab === "upcoming" && styles.pillTabTextActive]}>
                Upcoming ({upcomingTrips.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillTab, activeTab === "completed" && styles.pillTabActive]}
              onPress={() => setActiveTab("completed")}
            >
              <Text style={[styles.pillTabText, activeTab === "completed" && styles.pillTabTextActive]}>
                Completed ({completedTrips.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── TAB CONTENT: ACTIVE TRIP ─────────────────────────── */}
          {activeTab === "active" && (
            <View>
              {activeTrip ? (
                <View>
                  {/* Hero Journey Card */}
                  <View style={styles.tripHeroCard}>
                    <View style={styles.tripHeroTopRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.liveTripBadge}>
                          <Text style={styles.liveTripBadgeText}>ACTIVE SAFETY CORRIDOR</Text>
                        </View>
                        <Text style={styles.tripHeroTitle}>{activeTrip.title}</Text>
                        <View style={styles.tripHeroMetaRow}>
                          <MapPin size={13} color="#38BDF8" />
                          <Text style={styles.tripHeroMetaText}>{activeTrip.destination}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.endTripBtn}
                        onPress={handleCompleteTrip}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.endTripBtnText}>Conclude</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Tracking Status Capsule */}
                    <View style={styles.trackingCapsule}>
                      <Navigation
                        size={14}
                        color={trackingStatus === "active" ? "#10B981" : "#94A3B8"}
                      />
                      <Text style={styles.trackingCapsuleText}>
                        {trackingStatus === "active"
                          ? "GPS Live Safety Telemetry: ENGAGED"
                          : "GPS Live Safety Telemetry: STANDBY"}
                      </Text>
                    </View>
                  </View>

                  {/* Waypoints Section */}
                  <View style={styles.waypointsSectionCard}>
                    <View style={styles.waypointsHeaderRow}>
                      <View>
                        <Text style={styles.sectionHeaderTitle}>CHRONOLOGICAL CHECKPOINTS</Text>
                        <Text style={styles.waypointsCountSub}>
                          {activeTrip.itinerary_stops?.length || 0} scheduled safety checkpoints
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addStopSmallBtn}
                        onPress={() => setAddStopModalVisible(true)}
                        activeOpacity={0.8}
                      >
                        <Plus size={13} color="#FFFFFF" />
                        <Text style={styles.addStopSmallBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Timeline List */}
                    {activeTrip.itinerary_stops && activeTrip.itinerary_stops.length > 0 ? (
                      <View style={styles.waypointsList}>
                        {activeTrip.itinerary_stops.map((stop, index) => (
                          <View key={index} style={styles.waypointRow}>
                            <View style={styles.waypointNumberCircle}>
                              <Text style={styles.waypointNumber}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.waypointName}>{stop.name}</Text>
                              <Text style={styles.waypointSub}>
                                {stop.location} {stop.planned_arrival ? `• ${stop.planned_arrival}` : ""}
                              </Text>
                            </View>
                            <View style={styles.waypointStatusBadge}>
                              <Text style={styles.waypointStatusText}>Verified</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.emptyStopsBox}>
                        <Flag size={24} color="rgba(255, 255, 255, 0.4)" />
                        <Text style={styles.emptyStopsText}>
                          No waypoints added yet. Add stops to plot corridor checkpoints.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.noActiveCard}>
                  <Compass size={36} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.noActiveTitle}>No Active Journey</Text>
                  <Text style={styles.noActiveSub}>
                    Start a new trip to activate safe route corridor tracking and waypoint check-ins.
                  </Text>
                  <TouchableOpacity
                    style={styles.startTripBigBtn}
                    onPress={() => setCreateModalVisible(true)}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.startTripBigBtnText}>Create New Itinerary</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── TAB CONTENT: UPCOMING / COMPLETED ────────────────── */}
          {activeTab !== "active" && (
            <View style={styles.otherTripsList}>
              {(activeTab === "upcoming" ? upcomingTrips : completedTrips).map((t) => (
                <View key={t.id} style={styles.archivedTripCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.archivedTripTitle}>{t.title}</Text>
                    <Text style={styles.archivedTripSub}>
                      {t.destination} • {new Date(t.start_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── CREATE TRIP MODAL ──────────────────────────────────── */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Plan New Journey</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>JOURNEY TITLE</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Kodaikanal Hill Station & Forest Trail"
                placeholderTextColor="#94A3B8"
                value={tripTitle}
                onChangeText={setTripTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PRIMARY DESTINATION</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Kodaikanal, Tamil Nadu"
                placeholderTextColor="#94A3B8"
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleCreateTrip}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Create Active Journey</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ADD STOP MODAL ────────────────────────────────────── */}
      <Modal
        visible={addStopModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddStopModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Corridor Checkpoint</Text>
              <TouchableOpacity onPress={() => setAddStopModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CHECKPOINT / STOP NAME</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Pillar Rocks Safe Kiosk"
                placeholderTextColor="#94A3B8"
                value={stopName}
                onChangeText={setStopName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LOCATION / AREA</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Pillar Rocks Road"
                placeholderTextColor="#94A3B8"
                value={stopLocation}
                onChangeText={setStopLocation}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAddStop}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Add Checkpoint</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  /* ── TITLE BLOCK ── */
  headerBlock: {
    marginBottom: 14,
  },
  headerKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  headerKicker: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284C7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  newTripBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* ── TABS ── */
  pillTabsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 16,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  pillTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 13,
  },
  pillTabActive: {
    backgroundColor: "#FFFFFF",
  },
  pillTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  pillTabTextActive: {
    color: "#0F172A",
  },

  /* ── ACTIVE TRIP HERO ── */
  tripHeroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        } as any)
      : {}),
  },
  tripHeroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  liveTripBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    marginBottom: 6,
  },
  liveTripBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  tripHeroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  tripHeroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  tripHeroMetaText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
  },
  endTripBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  endTripBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FCA5A5",
  },
  trackingCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  trackingCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* ── WAYPOINTS CARD ── */
  waypointsSectionCard: {
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
  waypointsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.8,
  },
  waypointsCountSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  addStopSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284C7",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  addStopSmallBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  waypointsList: {
    gap: 8,
  },
  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  waypointNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  waypointNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38BDF8",
  },
  waypointName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  waypointSub: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },
  waypointStatusBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  waypointStatusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
  },
  emptyStopsBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  emptyStopsText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  noActiveCard: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 8,
    marginBottom: 20,
  },
  noActiveTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  noActiveSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 17,
  },
  startTripBigBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginTop: 8,
  },
  startTripBigBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  otherTripsList: {
    gap: 10,
    marginBottom: 20,
  },
  archivedTripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  archivedTripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  archivedTripSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
  },

  /* ── MODALS ── */
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  inputGroup: {
    marginBottom: 14,
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
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  modalSubmitBtn: {
    backgroundColor: "#0284C7",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
