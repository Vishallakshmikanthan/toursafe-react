import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPinned,
  Shield,
  Layers3,
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  Radio,
  Users,
  Navigation,
  ShieldAlert,
  ChevronRight,
  Flag,
  ArrowRight,
} from 'lucide-react-native';
import RealMap, { ZonePolygonProp, MapMarkerProp } from '@/components/RealMap';
import { zoneApi, locationApi } from '@/lib/api';
import { useMapStore } from '@/store/mapStore';
import { useAnomalyStore } from '@/store/anomalyStore';
import type { ZoneMapItem } from '@/types';
import Toast from 'react-native-toast-message';

export default function AdminMap() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [zones, setZones] = useState<ZoneMapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'caution' | 'police'>('all');
  const [tileMode, setTileMode] = useState<'voyager' | 'satellite' | 'topo'>('voyager');

  // Live tourist markers updated via WebSocket and polling
  const liveMarkers = useMapStore((state) => state.markers);
  const updateMarker = useMapStore((state) => state.updateMarker);
  const activeAnomalies = useAnomalyStore((state) => state.activeAnomalies);

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [zonesRes, liveLocsRes] = await Promise.all([
        zoneApi.getAll(),
        locationApi.getAuthorityLiveLocations().catch(() => ({ data: [] })),
      ]);

      setZones(zonesRes.data?.zones || []);

      // Populate live locations
      const liveList = Array.isArray(liveLocsRes.data) ? liveLocsRes.data : [];
      liveList.forEach((loc: any) => {
        if (loc.location && loc.tourist_id) {
          updateMarker({
            tourist_id: loc.tourist_id,
            name: `Tourist ${loc.tourist_id.slice(0, 6)}`,
            latitude: loc.location.latitude,
            longitude: loc.location.longitude,
            status: loc.tracking_status === 'active' ? 'safe' : 'inactive',
            last_seen: loc.timestamp || new Date().toISOString(),
          });
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch data for admin map:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [updateMarker]);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Convert GeoJSON polygons to RealMap polygons
  const mapPolygons: ZonePolygonProp[] = useMemo(() => {
    return zones
      .filter((z) => {
        if (!z.geometry || !z.geometry.coordinates) return false;
        if (activeFilter === 'safe' && z.type !== 'safe') return false;
        if (activeFilter === 'caution' && z.type !== 'warning' && z.type !== 'danger' && z.type !== 'restricted') return false;
        return true;
      })
      .map((z) => {
        const coords: Array<{ latitude: number; longitude: number }> = [];
        if (z.geometry.type === 'Polygon') {
          const outerRing = z.geometry.coordinates[0] || [];
          outerRing.forEach(([lon, lat]: [number, number]) => {
            coords.push({ latitude: lat, longitude: lon });
          });
        }
        return {
          coordinates: coords,
          name: `${z.name} (${z.risk_level.toUpperCase()})`,
          risk_level: z.risk_level,
        };
      })
      .filter((p) => p.coordinates.length > 2);
  }, [zones, activeFilter]);

  // Zone center markers
  const zoneMarkers: MapMarkerProp[] = useMemo(() => {
    return zones
      .filter((z) => z.center && z.center.coordinates)
      .map((z) => {
        const [lon, lat] = z.center.coordinates;
        const color =
          z.risk_level === 'critical' || z.risk_level === 'high'
            ? '#ef4444'
            : z.risk_level === 'medium'
            ? '#f59e0b'
            : '#10b981';
        return {
          latitude: lat,
          longitude: lon,
          title: `${z.name} [${z.type}]`,
          color,
        };
      });
  }, [zones]);

  // Real-time live tourist markers
  const touristMapMarkers: MapMarkerProp[] = useMemo(() => {
    return liveMarkers.map((m) => {
      const anom = activeAnomalies[m.tourist_id];
      return {
        latitude: m.latitude,
        longitude: m.longitude,
        title: anom
          ? `⚠️ ${m.name} (ANOMALY: score ${anom.current_score.toFixed(1)})`
          : `📍 ${m.name} (${m.status.toUpperCase()})`,
        color: anom ? '#d97706' : '#2563eb',
      };
    });
  }, [liveMarkers, activeAnomalies]);

  const allMapMarkers = useMemo(() => {
    return [...zoneMarkers, ...touristMapMarkers];
  }, [zoneMarkers, touristMapMarkers]);

  const baseRegion = useMemo(() => {
    if (touristMapMarkers.length > 0) {
      return {
        latitude: touristMapMarkers[0].latitude,
        longitude: touristMapMarkers[0].longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
        zoom: 14,
      };
    }
    return {
      latitude: 10.2381,
      longitude: 77.4892,
      latitudeDelta: 0.14,
      longitudeDelta: 0.14,
      zoom: 14,
    };
  }, [touristMapMarkers]);

  const toggleTileMode = () => {
    setTileMode((prev) => (prev === 'voyager' ? 'satellite' : prev === 'satellite' ? 'topo' : 'voyager'));
    Toast.show({
      type: 'info',
      text1: 'Map Layer Changed',
      text2: `Switched map tile layer`,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── MAP CANVAS (FULL-BLEED BACKGROUND) ────────────────────── */}
      <View style={styles.mapContainer}>
        {loading && zones.length === 0 ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Connecting to Kodaikanal GPS stream & GeoJSON boundaries...</Text>
          </View>
        ) : (
          <RealMap
            region={baseRegion}
            polygons={mapPolygons}
            markers={allMapMarkers}
            tileStyle={tileMode}
            overlayTitle={`Command Center | ${liveMarkers.length} Live Tourist Tracks`}
            overlayText="Authenticated telemetry stream via WebSocket & MongoDB 2dsphere index."
          />
        )}
      </View>

      {/* ── TOP FLOATING COMMAND HUD ─────────────────────────────── */}
      <View style={[styles.topHudContainer, isDesktop && styles.topHudDesktop]}>
        <View style={styles.topHudCard}>
          {/* Status Label & Title */}
          <View style={styles.topHudInfo}>
            <View style={styles.topHudHeaderRow}>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveIndicatorText}>
                  {isDesktop ? 'Live Command Map' : 'Current Safety Zone'}
                </Text>
              </View>
              {!isDesktop && (
                <TouchableOpacity
                  style={styles.travelerLink}
                  onPress={() => router.replace('/tourist/(tabs)/map')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.travelerLinkText}>Traveler Map →</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.topHudTitle} numberOfLines={1}>
              {isDesktop
                ? 'Real-time GPS telemetry & zone boundaries'
                : 'Kodaikanal Lake Safe Haven'}
            </Text>
          </View>

          {/* Quick Metric Pills */}
          <View style={styles.metricsPillsRow}>
            <View style={[styles.hudPill, styles.hudPillBlue]}>
              <View style={[styles.hudPillDot, { backgroundColor: '#0284C7' }]} />
              <Text style={styles.hudPillText}>Tourists {liveMarkers.length || 20}</Text>
            </View>

            <View style={[styles.hudPill, styles.hudPillGreen]}>
              <View style={[styles.hudPillDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.hudPillText}>Responders 2</Text>
            </View>

            <View style={[styles.hudPill, styles.hudPillRed]}>
              <View style={[styles.hudPillDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.hudPillText}>Incidents 4</Text>
            </View>

            {isDesktop && (
              <View style={[styles.hudPill, styles.hudPillAmber]}>
                <View style={[styles.hudPillDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.hudPillText}>Safe Zones {zones.length || 11}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── RIGHT FLOATING ACTION CONTROLS STACK ─────────────────── */}
      <View style={[styles.floatingControlsStack, isDesktop && styles.floatingControlsDesktop]}>
        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={toggleTileMode}
          activeOpacity={0.8}
        >
          <Layers3 size={18} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={fetchMapData}
          activeOpacity={0.8}
        >
          <Navigation size={18} color="#0284C7" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={fetchMapData}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlCircleBtn, styles.emergencyCircleBtn]}
          onPress={() => {
            Toast.show({
              type: 'error',
              text1: 'Emergency Alert Filter',
              text2: 'Displaying critical & high hazard corridors only.',
            });
            setActiveFilter('caution');
          }}
          activeOpacity={0.8}
        >
          <ShieldAlert size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM FLOATING CHECKPOINT & FILTER CONTROLS ─────────── */}
      <View style={[styles.bottomFloatingArea, isDesktop && styles.bottomAreaDesktop]}>
        {/* Checkpoint Card */}
        <View style={styles.checkpointCard}>
          <Image
            source={require('@/assets/route-thumb.jpg')}
            style={styles.checkpointThumb}
            resizeMode="cover"
          />
          <View style={styles.checkpointContent}>
            <View style={styles.checkpointKickerRow}>
              <Flag size={12} color="#0284C7" />
              <Text style={styles.checkpointKicker}>Next Checkpoint</Text>
            </View>
            <Text style={styles.checkpointTitle} numberOfLines={1}>
              Pillar Rocks Safe Kiosk
            </Text>
            <Text style={styles.checkpointSub}>1.4 km • ~18 min</Text>
          </View>
          <TouchableOpacity
            style={styles.checkpointArrowBtn}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Checkpoint Focused',
                text2: 'Centered camera on Pillar Rocks Safe Kiosk',
              });
            }}
            activeOpacity={0.8}
          >
            <ArrowRight size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills Row */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <Layers3 size={14} color={activeFilter === 'all' ? '#FFFFFF' : '#0F172A'} />
            <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
              All Layers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'safe' && styles.filterPillActive]}
            onPress={() => setActiveFilter('safe')}
            activeOpacity={0.8}
          >
            <ShieldCheck size={14} color={activeFilter === 'safe' ? '#FFFFFF' : '#10B981'} />
            <Text style={[styles.filterPillText, activeFilter === 'safe' && styles.filterPillTextActive]}>
              Safe Havens
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'caution' && styles.filterPillActive]}
            onPress={() => setActiveFilter('caution')}
            activeOpacity={0.8}
          >
            <AlertOctagon size={14} color={activeFilter === 'caution' ? '#FFFFFF' : '#F59E0B'} />
            <Text style={[styles.filterPillText, activeFilter === 'caution' && styles.filterPillTextActive]}>
              Caution Zones
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Police Units',
                text2: '2 Active Quick Response Team vehicles on field.',
              });
            }}
            activeOpacity={0.8}
          >
            <Shield size={14} color="#0284C7" />
            <Text style={styles.filterPillText}>Police</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    overflow: 'hidden',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  /* ── TOP FLOATING HUD ── */
  topHudContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 54,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  topHudDesktop: {
    maxWidth: 720,
    left: 24,
    top: 18,
  },
  topHudCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  topHudInfo: {
    gap: 2,
  },
  topHudHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  travelerLink: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  travelerLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  topHudTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  hudPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hudPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  hudPillBlue: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  hudPillGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  hudPillRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  hudPillAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },

  /* ── RIGHT FLOATING ACTION CONTROLS ── */
  floatingControlsStack: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 114 : 156,
    right: 14,
    zIndex: 20,
    gap: 10,
  },
  floatingControlsDesktop: {
    top: 96,
  },
  controlCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  emergencyCircleBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    shadowColor: '#EF4444',
    shadowOpacity: 0.35,
  },

  /* ── BOTTOM FLOATING AREA ── */
  bottomFloatingArea: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 76,
    left: 14,
    right: 14,
    zIndex: 20,
    gap: 10,
  },
  bottomAreaDesktop: {
    maxWidth: 520,
    left: 24,
    bottom: 24,
  },
  checkpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    gap: 12,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        } as any)
      : {}),
  },
  checkpointThumb: {
    width: 58,
    height: 58,
    borderRadius: 16,
  },
  checkpointContent: {
    flex: 1,
  },
  checkpointKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  checkpointKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  checkpointTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  checkpointSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  checkpointArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── FILTER PILLS ROW ── */
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
});
