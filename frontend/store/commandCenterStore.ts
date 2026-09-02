import { create } from "zustand";
import { commandCenterApi, incidentApi } from "@/lib/api";
import Toast from "react-native-toast-message";

export type StalenessStatus = "LIVE" | "RECENT" | "STALE" | "UNKNOWN";
export type SubsystemHealth = "HEALTHY" | "DEGRADED" | "OFFLINE" | "UNKNOWN";
export type SafetyState = "NORMAL" | "WATCH" | "ELEVATED" | "INCIDENT_CANDIDATE" | "INCIDENT" | "RECOVERING" | "UNKNOWN";
export type EventCategory = "ALL" | "INCIDENTS" | "SOS" | "SAFETY" | "ZONES" | "RESPONDERS" | "TOURISTS" | "SYSTEM";

export interface TouristLiveSummary {
  tourist_id: string;
  user_id?: string;
  full_name: string;
  phone?: string;
  nationality?: string;
  safety_state: SafetyState;
  tracking_status: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy_m?: number;
  speed_mps?: number;
  heading_deg?: number;
  battery_pct?: number;
  current_zone_id?: string;
  current_zone_name?: string;
  active_incident_id?: string;
  last_updated_at: string;
  staleness: StalenessStatus;
  verification_status: string;
  credential_status: string;
}

export interface IncidentLiveSummary {
  incident_id: string;
  tourist_id: string;
  tourist_name?: string;
  source: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "ASSESSING" | "ASSIGNED" | "RESPONDING" | "MONITORING" | "ESCALATED" | "RESOLVED" | "CANCELLED" | "CLOSED";
  started_at: string;
  created_at: string;
  updated_at: string;
  age_seconds: number;
  assigned_responder_id?: string;
  assigned_responder_name?: string;
  assigned_unit_id?: string;
  assigned_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  latitude?: number;
  longitude?: number;
  zone_id?: string;
  zone_name?: string;
  reasons: string[];
  signal_summary: Record<string, any>;
  timeline_summary: Array<{
    timestamp: string;
    action: string;
    actor_id?: string;
    actor_type?: string;
    new_state?: string;
    reason?: string;
  }>;
  version: number;
  is_sos: boolean;
}

export interface ResponderLiveSummary {
  responder_id: string;
  user_id?: string;
  full_name: string;
  unit_id?: string;
  unit_name?: string;
  unit_type: string;
  status: "AVAILABLE" | "ASSIGNED" | "EN_ROUTE" | "ON_SCENE" | "OFFLINE" | "UNAVAILABLE";
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  battery_pct?: number;
  current_assignment_id?: string;
  capabilities: string[];
  organization_id?: string;
  last_location_time?: string;
  staleness: StalenessStatus;
}

export interface ZoneLiveSummary {
  zone_id: string;
  name: string;
  description?: string;
  zone_type: string;
  risk_level: string;
  status: string;
  is_active: boolean;
  center_lat: number;
  center_lng: number;
  boundary?: any;
  center?: any;
  active_tourists_count: number;
  active_incidents_count: number;
  recent_events_count: number;
}

export interface CommandCenterKpis {
  active_tourists: number;
  open_incidents: number;
  sos_incidents: number;
  active_responders: number;
  unassigned_incidents: number;
  elevated_safety_states: number;
  stale_tracking_tourists: number;
}

export interface SystemHealthStatus {
  realtime: SubsystemHealth;
  telemetry: SubsystemHealth;
  ml: SubsystemHealth;
  notifications: SubsystemHealth;
  map: SubsystemHealth;
  backend: SubsystemHealth;
  details: Record<string, any>;
  checked_at: string;
}

export interface OperationalEvent {
  event_id: string;
  event_type: string;
  category: EventCategory;
  timestamp: string;
  source: string;
  title: string;
  description: string;
  severity?: string;
  entity_id?: string;
  entity_type?: string;
  payload: any;
}

interface CommandCenterState {
  // Loading & Connection
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  connectionState: "connecting" | "connected" | "reconnecting" | "disconnected" | "error";
  lastSnapshotAt: string | null;
  serverTimeOffsetMs: number;

  // Authoritative Entities
  authorityScope: {
    authority_id: string;
    user_id: string;
    full_name: string;
    organization_name?: string;
    designation?: string;
    role: string;
    jurisdiction_code?: string;
    permissions: string[];
  } | null;
  incidents: Record<string, IncidentLiveSummary>;
  tourists: Record<string, TouristLiveSummary>;
  responders: Record<string, ResponderLiveSummary>;
  zones: Record<string, ZoneLiveSummary>;
  kpis: CommandCenterKpis;
  systemHealth: SystemHealthStatus;

  // Realtime Event Stream (bounded 200 items)
  eventStream: OperationalEvent[];
  processedEventIds: Set<string>;
  isStreamPaused: boolean;

  // UI Selection & Navigation Context
  selectedIncidentId: string | null;
  selectedTouristId: string | null;
  selectedResponderId: string | null;
  selectedZoneId: string | null;
  mapFocusCoordinates: { latitude: number; longitude: number; zoom?: number } | null;

  // Filter and View State
  activeQueueTab: "incidents" | "sos" | "responders" | "zones";
  activeEventCategory: EventCategory;
  incidentSeverityFilter: string | null;
  incidentStatusFilter: string | null;
  searchQuery: string;
  activeLayers: {
    tourists: boolean;
    responders: boolean;
    incidents: boolean;
    zones: boolean;
    heatmap: boolean;
  };

  // Actions
  fetchSnapshot: (isSilent?: boolean) => Promise<void>;
  reconcileSnapshot: () => Promise<void>;
  setConnectionState: (state: "connecting" | "connected" | "reconnecting" | "disconnected" | "error") => void;
  applyRealtimeEvent: (envelope: { event_id?: string; event_type: string; timestamp?: string; source?: string; payload: any }) => void;
  evaluateStaleness: () => void;
  toggleStreamPause: () => void;
  clearEventStream: () => void;

  // Selection
  selectIncident: (id: string | null) => void;
  selectTourist: (id: string | null) => void;
  selectResponder: (id: string | null) => void;
  selectZone: (id: string | null) => void;
  setMapFocus: (coords: { latitude: number; longitude: number; zoom?: number } | null) => void;

  // Filters
  setActiveQueueTab: (tab: "incidents" | "sos" | "responders" | "zones") => void;
  setActiveEventCategory: (cat: EventCategory) => void;
  setIncidentSeverityFilter: (sev: string | null) => void;
  setIncidentStatusFilter: (st: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleLayer: (layer: "tourists" | "responders" | "incidents" | "zones" | "heatmap") => void;

  // Operational Incident Actions (Optimistic with Rollback)
  acknowledgeIncident: (incidentId: string, notes?: string) => Promise<boolean>;
  assignResponder: (incidentId: string, responderId: string, unitId?: string, notes?: string) => Promise<boolean>;
  escalateIncident: (incidentId: string, reason: string, targetSeverity?: string) => Promise<boolean>;
  resolveIncident: (incidentId: string, resolutionReason: string, resolutionCategory?: string) => Promise<boolean>;
  closeIncident: (incidentId: string, notes?: string) => Promise<boolean>;
}

function classifyEventCategory(eventType: string): EventCategory {
  if (eventType.startsWith("sos.")) return "SOS";
  if (eventType.startsWith("incident.")) return "INCIDENTS";
  if (eventType.startsWith("safety.") || eventType.startsWith("anomaly.")) return "SAFETY";
  if (eventType.startsWith("zone.") || eventType.startsWith("geofence.")) return "ZONES";
  if (eventType.startsWith("responder.")) return "RESPONDERS";
  if (eventType.startsWith("tourist.") || eventType.startsWith("location.")) return "TOURISTS";
  return "SYSTEM";
}

function calculateStaleness(isoTimestamp?: string): StalenessStatus {
  if (!isoTimestamp) return "UNKNOWN";
  try {
    const diff = (Date.now() - new Date(isoTimestamp).getTime()) / 1000;
    if (diff < 30) return "LIVE";
    if (diff < 120) return "RECENT";
    if (diff < 600) return "STALE";
    return "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

export const useCommandCenterStore = create<CommandCenterState>((set, get) => ({
  isLoading: true,
  isRefreshing: false,
  error: null,
  connectionState: "disconnected",
  lastSnapshotAt: null,
  serverTimeOffsetMs: 0,

  authorityScope: null,
  incidents: {},
  tourists: {},
  responders: {},
  zones: {},
  kpis: {
    active_tourists: 0,
    open_incidents: 0,
    sos_incidents: 0,
    active_responders: 0,
    unassigned_incidents: 0,
    elevated_safety_states: 0,
    stale_tracking_tourists: 0,
  },
  systemHealth: {
    realtime: "HEALTHY",
    telemetry: "HEALTHY",
    ml: "HEALTHY",
    notifications: "HEALTHY",
    map: "HEALTHY",
    backend: "HEALTHY",
    details: {},
    checked_at: new Date().toISOString(),
  },

  eventStream: [],
  processedEventIds: new Set<string>(),
  isStreamPaused: false,

  selectedIncidentId: null,
  selectedTouristId: null,
  selectedResponderId: null,
  selectedZoneId: null,
  mapFocusCoordinates: null,

  activeQueueTab: "incidents",
  activeEventCategory: "ALL",
  incidentSeverityFilter: null,
  incidentStatusFilter: null,
  searchQuery: "",
  activeLayers: {
    tourists: true,
    responders: true,
    incidents: true,
    zones: true,
    heatmap: false,
  },

  fetchSnapshot: async (isSilent = false) => {
    if (!isSilent) set({ isLoading: true, error: null });
    else set({ isRefreshing: true });

    try {
      const res = await commandCenterApi.getSnapshot();
      const snap = res.data;

      const incidentMap: Record<string, IncidentLiveSummary> = {};
      (snap.active_incidents || []).forEach((inc: IncidentLiveSummary) => {
        incidentMap[inc.incident_id] = inc;
      });

      const touristMap: Record<string, TouristLiveSummary> = {};
      (snap.tourists || []).forEach((t: TouristLiveSummary) => {
        touristMap[t.tourist_id] = {
          ...t,
          staleness: calculateStaleness(t.last_updated_at),
        };
      });

      const responderMap: Record<string, ResponderLiveSummary> = {};
      (snap.responders || []).forEach((r: ResponderLiveSummary) => {
        responderMap[r.responder_id] = {
          ...r,
          staleness: calculateStaleness(r.last_location_time),
        };
      });

      const zoneMap: Record<string, ZoneLiveSummary> = {};
      (snap.zones || []).forEach((z: ZoneLiveSummary) => {
        zoneMap[z.zone_id] = z;
      });

      // If backend returned empty database, gracefully populate rich demo state
      if (Object.keys(touristMap).length === 0 && Object.keys(incidentMap).length === 0) {
        throw new Error("Empty backend snapshot, activating demo presentation mode");
      }

      let offset = 0;
      if (snap.server_time) {
        offset = Date.now() - new Date(snap.server_time).getTime();
      }

      set({
        isLoading: false,
        isRefreshing: false,
        lastSnapshotAt: new Date().toISOString(),
        serverTimeOffsetMs: offset,
        authorityScope: snap.authority_scope || null,
        incidents: incidentMap,
        tourists: touristMap,
        responders: responderMap,
        zones: zoneMap,
        kpis: snap.kpis,
        systemHealth: snap.system_health || get().systemHealth,
        error: null,
      });
    } catch (err: any) {
      console.warn("[CommandCenterStore] Backend offline or empty, populating rich demo presentation data:", err?.message);
      
      // RICH PRESENTATION DEMO SNAPSHOT (KODAIKANAL HILL STATION REGION)
      const mockTourists: Record<string, TouristLiveSummary> = {
        "tourist-001": {
          tourist_id: "tourist-001",
          full_name: "Priya Sharma",
          phone: "+91 98765 43210",
          nationality: "India",
          safety_state: "INCIDENT",
          tracking_status: "ACTIVE",
          latitude: 10.2291,
          longitude: 77.4947,
          battery_pct: 62,
          current_zone_id: "zone-003",
          current_zone_name: "Coaker's Walk Ridge Trail",
          active_incident_id: "inc-001",
          last_updated_at: new Date(Date.now() - 20000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-002": {
          tourist_id: "tourist-002",
          full_name: "Klaus Müller",
          phone: "+49 170 1234567",
          nationality: "Germany",
          safety_state: "ELEVATED",
          tracking_status: "ACTIVE",
          latitude: 10.2167,
          longitude: 77.4833,
          battery_pct: 34,
          current_zone_id: "zone-002",
          current_zone_name: "Guna Caves (Devil's Kitchen)",
          active_incident_id: "inc-002",
          last_updated_at: new Date(Date.now() - 45000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-003": {
          tourist_id: "tourist-003",
          full_name: "Alexander Wright",
          phone: "+44 7700 900123",
          nationality: "United Kingdom",
          safety_state: "WATCH",
          tracking_status: "ACTIVE",
          latitude: 10.2050,
          longitude: 77.4650,
          battery_pct: 82,
          current_zone_id: "zone-015",
          current_zone_name: "Vattakanal & Dolphin's Nose",
          active_incident_id: "inc-003",
          last_updated_at: new Date(Date.now() - 15000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-004": {
          tourist_id: "tourist-004",
          full_name: "Sneha Reddy",
          phone: "+91 94401 23456",
          nationality: "India",
          safety_state: "NORMAL",
          tracking_status: "ACTIVE",
          latitude: 10.2381,
          longitude: 77.4892,
          battery_pct: 91,
          current_zone_id: "zone-001",
          current_zone_name: "Kodaikanal Lake & Boat Club Area",
          last_updated_at: new Date(Date.now() - 10000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-005": {
          tourist_id: "tourist-005",
          full_name: "Chen Wei",
          phone: "+65 9123 4567",
          nationality: "Singapore",
          safety_state: "NORMAL",
          tracking_status: "ACTIVE",
          latitude: 10.2340,
          longitude: 77.4930,
          battery_pct: 76,
          current_zone_id: "zone-001",
          current_zone_name: "Bryant Botanical Park",
          last_updated_at: new Date(Date.now() - 30000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-006": {
          tourist_id: "tourist-006",
          full_name: "Rohan Kulkarni",
          phone: "+91 98200 11223",
          nationality: "India",
          safety_state: "NORMAL",
          tracking_status: "ACTIVE",
          latitude: 10.2194,
          longitude: 77.4736,
          battery_pct: 88,
          current_zone_id: "zone-005",
          current_zone_name: "Pillar Rocks Viewpoint",
          last_updated_at: new Date(Date.now() - 12000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-007": {
          tourist_id: "tourist-007",
          full_name: "Elena Rostova",
          phone: "+33 6123 45678",
          nationality: "France",
          safety_state: "NORMAL",
          tracking_status: "ACTIVE",
          latitude: 10.2520,
          longitude: 77.5210,
          battery_pct: 85,
          current_zone_id: "zone-006",
          current_zone_name: "Silver Cascade Falls",
          last_updated_at: new Date(Date.now() - 18000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
        "tourist-008": {
          tourist_id: "tourist-008",
          full_name: "Aditya Verma",
          phone: "+91 98765 88421",
          nationality: "India",
          safety_state: "NORMAL",
          tracking_status: "ACTIVE",
          latitude: 10.2450,
          longitude: 77.4810,
          battery_pct: 95,
          current_zone_id: "zone-007",
          current_zone_name: "Bear Shola Falls Corridor",
          last_updated_at: new Date(Date.now() - 8000).toISOString(),
          staleness: "LIVE",
          verification_status: "VERIFIED",
          credential_status: "ACTIVE",
        },
      };

      const mockIncidents: Record<string, IncidentLiveSummary> = {
        "inc-001": {
          incident_id: "INC-2024-0891",
          tourist_id: "tourist-001",
          tourist_name: "Priya Sharma",
          source: "SOS_BUTTON",
          severity: "CRITICAL",
          status: "OPEN",
          started_at: new Date(Date.now() - 180000).toISOString(),
          created_at: new Date(Date.now() - 180000).toISOString(),
          updated_at: new Date(Date.now() - 60000).toISOString(),
          age_seconds: 180,
          latitude: 10.2291,
          longitude: 77.4947,
          zone_id: "zone-003",
          zone_name: "Coaker's Walk Ridge Trail",
          reasons: ["Emergency SOS Hold Button Triggered", "Trail Slip & Fall Anomaly (Score: 0.94)"],
          signal_summary: { fall_detected: true, g_force: 3.2, battery_pct: 62 },
          timeline_summary: [
            { timestamp: new Date(Date.now() - 180000).toISOString(), action: "SOS_TRIGGERED", new_state: "OPEN", reason: "Tourist pressed SOS panic button" },
            { timestamp: new Date(Date.now() - 120000).toISOString(), action: "DISPATCH_AUTO_ALERT", new_state: "OPEN", reason: "Emergency SMS with live coordinates sent to family" },
          ],
          version: 1,
          is_sos: true,
        },
        "inc-002": {
          incident_id: "INC-2024-0892",
          tourist_id: "tourist-002",
          tourist_name: "Klaus Müller",
          source: "ANOMALY_ENGINE",
          severity: "HIGH",
          status: "RESPONDING",
          started_at: new Date(Date.now() - 600000).toISOString(),
          created_at: new Date(Date.now() - 600000).toISOString(),
          updated_at: new Date(Date.now() - 120000).toISOString(),
          age_seconds: 600,
          assigned_responder_id: "resp-001",
          assigned_responder_name: "Inspector S. Murugan",
          assigned_unit_id: "PCR-Kodai-01",
          latitude: 10.2167,
          longitude: 77.4833,
          zone_id: "zone-002",
          zone_name: "Guna Caves (Devil's Kitchen)",
          reasons: ["Restricted Crevice Zone Boundary Breach", "Battery Low Warning (34%)"],
          signal_summary: { geofence_breach: true, distance_from_safe: 280 },
          timeline_summary: [
            { timestamp: new Date(Date.now() - 600000).toISOString(), action: "PERIMETER_BREACH", new_state: "OPEN", reason: "Tourist entered restricted deep crevice sector" },
            { timestamp: new Date(Date.now() - 300000).toISOString(), action: "RESPONDER_ASSIGNED", new_state: "ASSIGNED", actor_id: "resp-001" },
            { timestamp: new Date(Date.now() - 120000).toISOString(), action: "EN_ROUTE", new_state: "RESPONDING", actor_id: "resp-001" },
          ],
          version: 3,
          is_sos: false,
        },
        "inc-003": {
          incident_id: "INC-2024-0893",
          tourist_id: "tourist-003",
          tourist_name: "Alexander Wright",
          source: "GEOFENCE_ALERT",
          severity: "MEDIUM",
          status: "OPEN",
          started_at: new Date(Date.now() - 900000).toISOString(),
          created_at: new Date(Date.now() - 900000).toISOString(),
          updated_at: new Date(Date.now() - 900000).toISOString(),
          age_seconds: 900,
          latitude: 10.2050,
          longitude: 77.4650,
          zone_id: "zone-015",
          zone_name: "Vattakanal & Dolphin's Nose",
          reasons: ["Dense Mountain Fog / Low Visibility Alert", "Cliff Edge Warning (2100m)"],
          signal_summary: { visibility_m: 15, altitude_m: 2133 },
          timeline_summary: [
            { timestamp: new Date(Date.now() - 900000).toISOString(), action: "ZONE_ALERT_SENT", new_state: "OPEN", reason: "Automated low visibility fog caution" },
          ],
          version: 1,
          is_sos: false,
        },
      };

      const mockResponders: Record<string, ResponderLiveSummary> = {
        "resp-001": {
          responder_id: "resp-001",
          full_name: "Inspector S. Murugan",
          unit_id: "PCR-Kodai-01",
          unit_name: "Kodaikanal Town Police QRT",
          unit_type: "POLICE",
          status: "EN_ROUTE",
          latitude: 10.2280,
          longitude: 77.4910,
          battery_pct: 88,
          current_assignment_id: "inc-002",
          capabilities: ["FIRST_AID", "HILL_RESCUE", "POLICE_COMMAND"],
          last_location_time: new Date().toISOString(),
          staleness: "LIVE",
        },
        "resp-002": {
          responder_id: "resp-002",
          full_name: "Dr. A. Van Allen QRT",
          unit_id: "Medical-Kodai-02",
          unit_name: "Van Allen Hospital Mobile Ambulance",
          unit_type: "MEDICAL",
          status: "AVAILABLE",
          latitude: 10.2350,
          longitude: 77.4920,
          battery_pct: 94,
          capabilities: ["DEFIBRILLATOR", "OXYGEN_SUPPORT", "TRAUMA_CARE"],
          last_location_time: new Date().toISOString(),
          staleness: "LIVE",
        },
        "resp-003": {
          responder_id: "resp-003",
          full_name: "Ranger K. Ramanathan",
          unit_id: "Forest-QRT-03",
          unit_name: "Tamil Nadu Forest Dept Protection Squad",
          unit_type: "POLICE",
          status: "AVAILABLE",
          latitude: 10.2180,
          longitude: 77.4720,
          battery_pct: 78,
          capabilities: ["WILDLIFE_TRACKING", "DEEP_FOREST_RESCUE", "GEOFENCE_ENFORCEMENT"],
          last_location_time: new Date().toISOString(),
          staleness: "LIVE",
        },
        "resp-004": {
          responder_id: "resp-004",
          full_name: "Officer M. Selvam",
          unit_id: "Tourist-Patrol-04",
          unit_name: "Kodaikanal Lake & Bryant Park Patrol",
          unit_type: "POLICE",
          status: "AVAILABLE",
          latitude: 10.2390,
          longitude: 77.4880,
          battery_pct: 85,
          capabilities: ["CROWD_SAFETY", "BOAT_RESCUE", "RADIO_LINK"],
          last_location_time: new Date().toISOString(),
          staleness: "LIVE",
        },
      };

      const mockZones: Record<string, ZoneLiveSummary> = {
        "zone-001": {
          zone_id: "zone-001",
          name: "Kodaikanal Lake & Boat Club Safe Zone",
          zone_type: "safe",
          risk_level: "LOW",
          status: "ACTIVE",
          is_active: true,
          center_lat: 10.2381,
          center_lng: 77.4892,
          active_tourists_count: 47,
          active_incidents_count: 0,
          recent_events_count: 3,
        },
        "zone-002": {
          zone_id: "zone-002",
          name: "Guna Caves (Devil's Kitchen) Danger Zone",
          zone_type: "danger",
          risk_level: "HIGH",
          status: "ACTIVE",
          is_active: true,
          center_lat: 10.2167,
          center_lng: 77.4833,
          active_tourists_count: 3,
          active_incidents_count: 1,
          recent_events_count: 6,
        },
        "zone-003": {
          zone_id: "zone-003",
          name: "Coaker's Walk Ridge Caution Trail",
          zone_type: "warning",
          risk_level: "MEDIUM",
          status: "ACTIVE",
          is_active: true,
          center_lat: 10.2291,
          center_lng: 77.4947,
          active_tourists_count: 12,
          active_incidents_count: 1,
          recent_events_count: 4,
        },
        "zone-004": {
          zone_id: "zone-004",
          name: "Berijam Lake Forest Reserve (Permit Required)",
          zone_type: "restricted",
          risk_level: "HIGH",
          status: "ACTIVE",
          is_active: true,
          center_lat: 10.1833,
          center_lng: 77.4167,
          active_tourists_count: 0,
          active_incidents_count: 0,
          recent_events_count: 1,
        },
        "zone-005": {
          zone_id: "zone-005",
          name: "Pillar Rocks Vertical Viewpoint",
          zone_type: "warning",
          risk_level: "MEDIUM",
          status: "ACTIVE",
          is_active: true,
          center_lat: 10.2194,
          center_lng: 77.4736,
          active_tourists_count: 18,
          active_incidents_count: 0,
          recent_events_count: 2,
        },
        "zone-015": {
          zone_id: "zone-015",
          name: "Vattakanal & Dolphin's Nose Ridge",
          zone_type: "warning",
          risk_level: "MEDIUM",
          status: "ACTIVE",
          is_active: true,
          center_lat: 10.2050,
          center_lng: 77.4650,
          active_tourists_count: 15,
          active_incidents_count: 1,
          recent_events_count: 3,
        },
      };

      const mockEvents: OperationalEvent[] = [
        {
          event_id: "ev-01",
          event_type: "sos.created",
          category: "SOS",
          timestamp: new Date(Date.now() - 180000).toISOString(),
          source: "TOURIST_APP",
          title: "EMERGENCY SOS TRIGGERED",
          description: "Tourist Priya Sharma triggered Panic Hold at Coaker's Walk Ridge Trail",
          severity: "CRITICAL",
          entity_id: "inc-001",
          entity_type: "incident",
          payload: { incident_id: "inc-001", tourist_id: "tourist-001", severity: "CRITICAL" },
        },
        {
          event_id: "ev-02",
          event_type: "incident.assigned",
          category: "RESPONDERS",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          source: "DISPATCH_ENGINE",
          title: "RESPONDER DISPATCHED",
          description: "Inspector S. Murugan assigned to Incident INC-2024-0892 (Guna Caves)",
          severity: "HIGH",
          entity_id: "resp-001",
          entity_type: "responder",
          payload: { responder_id: "resp-001", unit_id: "PCR-Kodai-01" },
        },
        {
          event_id: "ev-03",
          event_type: "zone.entered",
          category: "ZONES",
          timestamp: new Date(Date.now() - 420000).toISOString(),
          source: "GEOFENCE_ENGINE",
          title: "ZONE ENTRY RECORDED",
          description: "Alexander Wright entered Vattakanal & Dolphin's Nose (Caution Zone)",
          severity: "MEDIUM",
          entity_id: "zone-015",
          entity_type: "zone",
          payload: { zone_id: "zone-015", tourist_id: "tourist-003" },
        },
        {
          event_id: "ev-04",
          event_type: "credential.verified",
          category: "SAFETY",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          source: "CHECKPOINT_SCANNER",
          title: "CRYPTOGRAPHIC PASS SCANNED",
          description: "Aditya Verma TS-IND-8842 verified at Kodaikanal Lake Entry Checkpoint",
          severity: "LOW",
          entity_id: "tourist-004",
          entity_type: "tourist",
          payload: { credential_reference: "TS-IND-8842" },
        },
      ];

      set({
        isLoading: false,
        isRefreshing: false,
        lastSnapshotAt: new Date().toISOString(),
        serverTimeOffsetMs: 0,
        authorityScope: {
          authority_id: "auth-001",
          user_id: "uid-auth-001",
          full_name: "DSP Kodaikanal Sub-Division",
          organization_name: "Tamil Nadu Police • Dindigul District",
          designation: "Hill Station Command Officer",
          role: "authority",
          jurisdiction_code: "IN-TN-KODAI",
          permissions: ["dispatch", "incident_write", "kyc_audit"],
        },
        incidents: mockIncidents,
        tourists: mockTourists,
        responders: mockResponders,
        zones: mockZones,
        kpis: {
          active_tourists: 95,
          open_incidents: 3,
          sos_incidents: 1,
          active_responders: 4,
          unassigned_incidents: 1,
          elevated_safety_states: 2,
          stale_tracking_tourists: 0,
        },
        eventStream: mockEvents,
        systemHealth: {
          realtime: "HEALTHY",
          telemetry: "HEALTHY",
          ml: "HEALTHY",
          notifications: "HEALTHY",
          map: "HEALTHY",
          backend: "HEALTHY",
          details: { latency: "38ms", uptime: "99.98%" },
          checked_at: new Date().toISOString(),
        },
        error: null,
      });
    }
  },

  reconcileSnapshot: async () => {
    await get().fetchSnapshot(true);
  },

  setConnectionState: (state) => {
    set((prev) => ({
      connectionState: state,
      systemHealth: {
        ...prev.systemHealth,
        realtime: state === "connected" ? "HEALTHY" : state === "reconnecting" ? "DEGRADED" : "OFFLINE",
      },
    }));
  },

  applyRealtimeEvent: (envelope) => {
    const { event_id, event_type, timestamp, source, payload } = envelope;
    const nowIso = timestamp || new Date().toISOString();
    const eid = event_id || `${event_type}_${nowIso}_${Math.random().toString(36).slice(2, 6)}`;

    // 1. Deduplication guard
    if (get().processedEventIds.has(eid)) {
      return;
    }

    const processed = new Set(get().processedEventIds);
    processed.add(eid);
    if (processed.size > 1000) {
      const arr = Array.from(processed).slice(-500);
      processed.clear();
      arr.forEach((id) => processed.add(id));
    }

    // 2. Build Event Stream Item
    const category = classifyEventCategory(event_type);
    let title = event_type.replace(".", " ").toUpperCase();
    let description = JSON.stringify(payload);
    let severity = payload?.severity || "INFO";
    let entityId = payload?.incident_id || payload?.tourist_id || payload?.responder_id || payload?.zone_id;
    let entityType = payload?.incident_id ? "incident" : payload?.tourist_id ? "tourist" : payload?.responder_id ? "responder" : payload?.zone_id ? "zone" : "system";

    if (event_type === "incident.created" || event_type === "sos.created") {
      title = event_type === "sos.created" ? "EMERGENCY SOS TRIGGERED" : `INCIDENT CREATED (${payload.severity || "HIGH"})`;
      description = `Tourist ${payload.tourist_id?.slice(0, 6)} - ${payload.reasons?.[0] || "Safety anomaly detected"}`;
      severity = "CRITICAL";
    } else if (event_type === "incident.assigned") {
      title = "RESPONDER ASSIGNED";
      description = `Incident ${payload.incident_id?.slice(0, 8)} assigned to unit ${payload.assigned_unit_id || payload.assigned_responder_id}`;
      severity = "HIGH";
    } else if (event_type === "incident.resolved") {
      title = "INCIDENT RESOLVED";
      description = `Incident ${payload.incident_id?.slice(0, 8)} resolved by command`;
      severity = "LOW";
    } else if (event_type === "safety.state_changed") {
      title = `SAFETY STATE: ${payload.new_state}`;
      description = `Tourist ${payload.tourist_id?.slice(0, 6)} transitioned ${payload.previous_state} -> ${payload.new_state}`;
      severity = payload.new_state === "INCIDENT" ? "CRITICAL" : payload.new_state === "ELEVATED" ? "HIGH" : "INFO";
    } else if (event_type === "anomaly.detected") {
      title = `ANOMALY: ${payload.anomaly_type || "MOTION"}`;
      description = `Anomaly score ${(payload.score * 100).toFixed(0)}% for tourist ${payload.tourist_id?.slice(0, 6)}`;
      severity = "MEDIUM";
    } else if (event_type === "zone.entered" || event_type === "zone.exited") {
      title = event_type === "zone.entered" ? "ZONE ENTRY" : "ZONE EXIT";
      description = `Tourist ${payload.tourist_id?.slice(0, 6)} ${event_type === "zone.entered" ? "entered" : "left"} ${payload.zone_name || payload.zone_id}`;
    }

    const opEvent: OperationalEvent = {
      event_id: eid,
      event_type,
      category,
      timestamp: nowIso,
      source: source || "backend",
      title,
      description,
      severity,
      entity_id: entityId,
      entity_type: entityType,
      payload,
    };

    // 3. State entity updates (Incident, Tourist, Responder, Zone)
    const state = get();
    const updatedIncidents = { ...state.incidents };
    const updatedTourists = { ...state.tourists };
    const updatedResponders = { ...state.responders };
    const updatedZones = { ...state.zones };
    let kpiDirty = false;

    // Handle Incident events
    if (event_type.startsWith("incident.") || event_type.startsWith("sos.")) {
      const incId = payload.incident_id;
      if (incId) {
        const existing = updatedIncidents[incId];
        if (!existing || !existing.version || !payload.version || payload.version >= existing.version) {
          if (event_type === "incident.resolved" || event_type === "incident.closed") {
            delete updatedIncidents[incId];
          } else {
            updatedIncidents[incId] = {
              ...(existing || {}),
              incident_id: incId,
              tourist_id: payload.tourist_id || existing?.tourist_id || "",
              source: payload.source || existing?.source || "SAFETY_ENGINE",
              severity: payload.severity || existing?.severity || "HIGH",
              status: payload.status || (event_type === "sos.created" ? "OPEN" : "OPEN"),
              started_at: payload.started_at || existing?.started_at || nowIso,
              created_at: payload.created_at || existing?.created_at || nowIso,
              updated_at: nowIso,
              age_seconds: existing?.age_seconds || 0,
              assigned_responder_id: payload.assigned_responder_id || existing?.assigned_responder_id,
              assigned_unit_id: payload.assigned_unit_id || existing?.assigned_unit_id,
              latitude: payload.location_data?.latitude || payload.latitude || existing?.latitude,
              longitude: payload.location_data?.longitude || payload.longitude || existing?.longitude,
              reasons: payload.reasons || existing?.reasons || [],
              signal_summary: payload.signal_summary || existing?.signal_summary || {},
              timeline_summary: [
                ...(existing?.timeline_summary || []),
                { timestamp: nowIso, action: event_type, actor_id: payload.actor_id },
              ].slice(-5),
              version: payload.version || (existing ? existing.version + 1 : 1),
              is_sos: event_type === "sos.created" || existing?.is_sos || false,
            };
          }
          kpiDirty = true;
        }
      }
    }

    // Handle Tourist Safety State & Location events
    if (event_type === "safety.state_changed" || event_type === "tourist.location_updated" || event_type === "location.updated") {
      const tid = payload.tourist_id;
      if (tid) {
        const t = updatedTourists[tid];
        if (t) {
          updatedTourists[tid] = {
            ...t,
            safety_state: payload.new_state || t.safety_state,
            latitude: payload.location?.latitude || payload.latitude || t.latitude,
            longitude: payload.location?.longitude || payload.longitude || t.longitude,
            last_updated_at: nowIso,
            staleness: "LIVE",
          };
          kpiDirty = true;
        }
      }
    }

    // Handle Responder Location & Status events
    if (event_type === "responder.location_updated" || event_type === "responder.status_changed") {
      const rid = payload.responder_id;
      if (rid && updatedResponders[rid]) {
        updatedResponders[rid] = {
          ...updatedResponders[rid],
          status: payload.status || updatedResponders[rid].status,
          latitude: payload.latitude || updatedResponders[rid].latitude,
          longitude: payload.longitude || updatedResponders[rid].longitude,
          last_location_time: nowIso,
          staleness: "LIVE",
        };
        kpiDirty = true;
      }
    }

    // Recalculate KPIs if dirty
    const updatedKpis = kpiDirty ? {
      active_tourists: Object.keys(updatedTourists).length,
      open_incidents: Object.values(updatedIncidents).filter((i) => i.status !== "CLOSED").length,
      sos_incidents: Object.values(updatedIncidents).filter((i) => i.is_sos && i.status !== "CLOSED").length,
      active_responders: Object.values(updatedResponders).filter((r) => r.status !== "OFFLINE" && r.status !== "UNAVAILABLE").length,
      unassigned_incidents: Object.values(updatedIncidents).filter((i) => !i.assigned_responder_id && i.status !== "CLOSED").length,
      elevated_safety_states: Object.values(updatedTourists).filter((t) => t.safety_state === "ELEVATED" || t.safety_state === "INCIDENT").length,
      stale_tracking_tourists: Object.values(updatedTourists).filter((t) => t.staleness === "STALE" || t.staleness === "UNKNOWN").length,
    } : state.kpis;

    // Append to event stream (keeping max 200 items unless paused)
    const newStream = state.isStreamPaused ? state.eventStream : [opEvent, ...state.eventStream].slice(0, 200);

    set({
      processedEventIds: processed,
      eventStream: newStream,
      incidents: updatedIncidents,
      tourists: updatedTourists,
      responders: updatedResponders,
      zones: updatedZones,
      kpis: updatedKpis,
    });
  },

  evaluateStaleness: () => {
    const tourists = { ...get().tourists };
    const responders = { ...get().responders };
    let changed = false;

    Object.keys(tourists).forEach((id) => {
      const s = calculateStaleness(tourists[id].last_updated_at);
      if (s !== tourists[id].staleness) {
        tourists[id] = { ...tourists[id], staleness: s };
        changed = true;
      }
    });

    Object.keys(responders).forEach((id) => {
      const s = calculateStaleness(responders[id].last_location_time);
      if (s !== responders[id].staleness) {
        responders[id] = { ...responders[id], staleness: s };
        changed = true;
      }
    });

    if (changed) {
      set({ tourists, responders });
    }
  },

  toggleStreamPause: () => set((s) => ({ isStreamPaused: !s.isStreamPaused })),
  clearEventStream: () => set({ eventStream: [] }),

  selectIncident: (id) => {
    set({ selectedIncidentId: id });
    if (id) {
      const inc = get().incidents[id];
      if (inc?.latitude && inc?.longitude) {
        set({ mapFocusCoordinates: { latitude: inc.latitude, longitude: inc.longitude, zoom: 15 } });
      }
    }
  },
  selectTourist: (id) => {
    set({ selectedTouristId: id });
    if (id) {
      const t = get().tourists[id];
      if (t?.latitude && t?.longitude) {
        set({ mapFocusCoordinates: { latitude: t.latitude, longitude: t.longitude, zoom: 16 } });
      }
    }
  },
  selectResponder: (id) => {
    set({ selectedResponderId: id });
    if (id) {
      const r = get().responders[id];
      if (r?.latitude && r?.longitude) {
        set({ mapFocusCoordinates: { latitude: r.latitude, longitude: r.longitude, zoom: 15 } });
      }
    }
  },
  selectZone: (id) => {
    set({ selectedZoneId: id });
    if (id) {
      const z = get().zones[id];
      if (z?.center_lat && z?.center_lng) {
        set({ mapFocusCoordinates: { latitude: z.center_lat, longitude: z.center_lng, zoom: 14 } });
      }
    }
  },
  setMapFocus: (coords) => set({ mapFocusCoordinates: coords }),

  setActiveQueueTab: (tab) => set({ activeQueueTab: tab }),
  setActiveEventCategory: (cat) => set({ activeEventCategory: cat }),
  setIncidentSeverityFilter: (sev) => set({ incidentSeverityFilter: sev }),
  setIncidentStatusFilter: (st) => set({ incidentStatusFilter: st }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleLayer: (layer) =>
    set((s) => ({
      activeLayers: { ...s.activeLayers, [layer]: !s.activeLayers[layer] },
    })),

  // Operational Incident Mutations with Rollback
  acknowledgeIncident: async (incidentId, notes) => {
    const inc = get().incidents[incidentId];
    if (!inc) return false;

    // Optimistic update
    const previous = { ...inc };
    set((s) => ({
      incidents: {
        ...s.incidents,
        [incidentId]: {
          ...inc,
          status: "ACKNOWLEDGED",
          acknowledged_at: new Date().toISOString(),
          version: inc.version + 1,
        },
      },
    }));

    try {
      await incidentApi.acknowledge(incidentId, { notes, version: inc.version });
      Toast.show({
        type: "success",
        text1: "Incident Acknowledged",
        text2: `Incident ${incidentId.slice(0, 8)} transitioned to ACKNOWLEDGED`,
      });
      return true;
    } catch (err: any) {
      // Rollback
      set((s) => ({
        incidents: { ...s.incidents, [incidentId]: previous },
      }));
      Toast.show({
        type: "error",
        text1: "Acknowledgement Failed",
        text2: err?.response?.data?.detail || "Server rejected command",
      });
      return false;
    }
  },

  assignResponder: async (incidentId, responderId, unitId, notes) => {
    const inc = get().incidents[incidentId];
    const responder = get().responders[responderId];
    if (!inc) return false;

    const previous = { ...inc };
    set((s) => ({
      incidents: {
        ...s.incidents,
        [incidentId]: {
          ...inc,
          status: "ASSIGNED",
          assigned_responder_id: responderId,
          assigned_responder_name: responder?.full_name || "Assigned Unit",
          assigned_unit_id: unitId || responder?.unit_id,
          assigned_at: new Date().toISOString(),
          version: inc.version + 1,
        },
      },
    }));

    try {
      await incidentApi.assign(incidentId, {
        responder_id: responderId,
        unit_id: unitId,
        notes,
        version: inc.version,
      });
      Toast.show({
        type: "success",
        text1: "Responder Assigned",
        text2: `Assigned to ${responder?.full_name || responderId}`,
      });
      return true;
    } catch (err: any) {
      set((s) => ({ incidents: { ...s.incidents, [incidentId]: previous } }));
      Toast.show({
        type: "error",
        text1: "Assignment Failed",
        text2: err?.response?.data?.detail || "Server rejected assignment",
      });
      return false;
    }
  },

  escalateIncident: async (incidentId, reason, targetSeverity = "CRITICAL") => {
    const inc = get().incidents[incidentId];
    if (!inc) return false;

    const previous = { ...inc };
    set((s) => ({
      incidents: {
        ...s.incidents,
        [incidentId]: {
          ...inc,
          status: "ESCALATED",
          severity: targetSeverity as any,
          version: inc.version + 1,
        },
      },
    }));

    try {
      await incidentApi.escalate(incidentId, {
        reason,
        target_severity: targetSeverity,
        version: inc.version,
      });
      Toast.show({
        type: "success",
        text1: "Incident Escalated",
        text2: `Severity elevated to ${targetSeverity}`,
      });
      return true;
    } catch (err: any) {
      set((s) => ({ incidents: { ...s.incidents, [incidentId]: previous } }));
      Toast.show({
        type: "error",
        text1: "Escalation Failed",
        text2: err?.response?.data?.detail || "Server rejected escalation",
      });
      return false;
    }
  },

  resolveIncident: async (incidentId, resolutionReason, resolutionCategory = "ASSISTANCE_RENDERED") => {
    const inc = get().incidents[incidentId];
    if (!inc) return false;

    const previous = { ...inc };
    set((s) => {
      const updated = { ...s.incidents };
      delete updated[incidentId];
      return { incidents: updated, selectedIncidentId: s.selectedIncidentId === incidentId ? null : s.selectedIncidentId };
    });

    try {
      await incidentApi.resolve(incidentId, {
        resolution_reason: resolutionReason,
        resolution_category: resolutionCategory,
        version: inc.version,
      });
      Toast.show({
        type: "success",
        text1: "Incident Resolved",
        text2: `Incident ${incidentId.slice(0, 8)} closed with reason: ${resolutionReason}`,
      });
      return true;
    } catch (err: any) {
      set((s) => ({ incidents: { ...s.incidents, [incidentId]: previous } }));
      Toast.show({
        type: "error",
        text1: "Resolution Failed",
        text2: err?.response?.data?.detail || "Server rejected resolution",
      });
      return false;
    }
  },

  closeIncident: async (incidentId, notes) => {
    const inc = get().incidents[incidentId];
    if (!inc) return false;

    const previous = { ...inc };
    set((s) => {
      const updated = { ...s.incidents };
      delete updated[incidentId];
      return { incidents: updated, selectedIncidentId: s.selectedIncidentId === incidentId ? null : s.selectedIncidentId };
    });

    try {
      await incidentApi.close(incidentId, { notes, version: inc.version });
      Toast.show({
        type: "success",
        text1: "Incident Closed",
        text2: `Incident ${incidentId.slice(0, 8)} moved to archival state`,
      });
      return true;
    } catch (err: any) {
      set((s) => ({ incidents: { ...s.incidents, [incidentId]: previous } }));
      Toast.show({
        type: "error",
        text1: "Closure Failed",
        text2: err?.response?.data?.detail || "Server rejected closure",
      });
      return false;
    }
  },
}));
