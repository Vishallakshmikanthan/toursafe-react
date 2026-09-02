import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  User,
  Users,
  Radio,
  Activity,
  ArrowRight,
  MapPin,
  Sparkles,
  Lock,
  FileCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Fingerprint,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { ConnectionStatusBadge } from '@/components/ConnectionStatusBadge';

export default function TourSafeOfficialPortal() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 960;
  const isMobile = width < 640;

  const { user, isAuthenticated, initializeAuth, setUser } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  const openAdmin = () => {
    setUser({
      id: 'usr_admin_mock',
      email: 'admin@toursafe.gov',
      full_name: 'Command Administrator',
      role: 'authority',
    });
    router.push('/admin/(tabs)/dashboard');
  };

  const openTourist = () => {
    setUser({
      id: 'usr_tourist_mock',
      email: 'tourist@toursafe.dev',
      full_name: 'Priya Sharma (Tourist)',
      role: 'tourist',
    });
    router.push('/tourist/(tabs)/dashboard');
  };

  const openResponder = () => {
    setUser({
      id: 'usr_responder_mock',
      email: 'responder@toursafe.dev',
      full_name: 'Tactical Unit Commander',
      role: 'responder',
    });
    router.push('/responder');
  };

  const getRoleDashboardPath = (role?: string) => {
    switch (role) {
      case 'authority':
      case 'admin':
        return '/admin/(tabs)/dashboard';
      case 'responder':
        return '/responder';
      case 'tourist':
      default:
        return '/tourist/(tabs)/dashboard';
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Clean Light Floating Navbar */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Shield size={22} color="#059669" />
            </View>
            <View>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle}>TourSafe</Text>
                <View style={styles.govBadge}>
                  <View style={styles.govDot} />
                  <Text style={styles.govBadgeText}>OFFICIAL B2G PLATFORM</Text>
                </View>
              </View>
              <Text style={styles.brandSubtitle} numberOfLines={1}>
                Unified Tourist Safety & Tactical Response Platform
              </Text>
            </View>
          </View>

          <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
            <ConnectionStatusBadge showLabel={!isMobile} allowNavigateDev={false} />
            {isAuthenticated && user ? (
              <TouchableOpacity
                style={styles.activeUserButton}
                onPress={() => router.push(getRoleDashboardPath(user.role) as never)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${user.role} workspace`}
              >
                <View style={styles.userAvatar}>
                  <User size={13} color="#FFFFFF" />
                </View>
                <Text style={styles.activeUserText} numberOfLines={1}>
                  {user.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </Text>
                <ChevronRight size={14} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/auth/login')}
                accessibilityRole="button"
                accessibilityLabel="Sign in to TourSafe Portal"
              >
                <Lock size={13} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Sign In</Text>
                <ArrowRight size={13} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active Verified Session Bar */}
        {isAuthenticated && user && (
          <View style={styles.sessionBanner}>
            <View style={styles.sessionBannerLeft}>
              <View style={styles.sessionIconBox}>
                <CheckCircle2 size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionBannerTitle}>Active Verified Session Found</Text>
                <Text style={styles.sessionBannerSubtitle} numberOfLines={1}>
                  Authenticated as <Text style={styles.sessionHighlight}>{user.full_name || user.email}</Text> ({user.role?.toUpperCase() || 'TOURIST'})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sessionLaunchButton}
              onPress={() => router.push(getRoleDashboardPath(user.role) as never)}
              accessibilityRole="button"
            >
              <Text style={styles.sessionLaunchText}>Enter Workspace</Text>
              <ArrowRight size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Clean Light Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroChipEmerald}>
              <Zap size={12} color="#059669" />
              <Text style={styles.heroChipEmeraldText}>50Hz REAL-TIME SENSING</Text>
            </View>
            <View style={styles.heroChipIndigo}>
              <Lock size={12} color="#4F46E5" />
              <Text style={styles.heroChipIndigoText}>ZERO-TRUST ISO 27001</Text>
            </View>
          </View>

          <Text style={[styles.heroHeading, isMobile && styles.heroHeadingMobile]}>
            Next-Gen Tourist Safety & Rapid Emergency Response
          </Text>

          <Text style={styles.heroSubtext}>
            TourSafe connects travelers, tourism authorities, and field tactical units into an intelligent,
            motion-anomaly protected network with real-time geospatial safety and 1-tap deliberate emergency dispatch.
          </Text>

          {/* Quick Metrics Strip */}
          <View style={[styles.metricsStrip, isMobile && styles.metricsStripMobile]}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>50 Hz</Text>
              <Text style={styles.metricLabel}>Sensor AI Stream</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>&lt; 50 ms</Text>
              <Text style={styles.metricLabel}>Dispatch Latency</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>100%</Text>
              <Text style={styles.metricLabel}>DPDP Sovereign</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>Multi-Zone</Text>
              <Text style={styles.metricLabel}>Live Geofencing</Text>
            </View>
          </View>
        </View>

        {/* Operational Workspaces Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionOverline}>SELECT ROLE GATEWAY</Text>
            <Text style={styles.sectionTitle}>Operational Workspaces</Text>
          </View>
        </View>

        <View style={[styles.gatewayGrid, isCompact && styles.gatewayGridCompact]}>
          {/* Card 1: Authority Command Center */}
          <View style={[styles.gatewayCard, styles.gatewayCardAdmin]}>
            <View style={styles.gatewayHeader}>
              <View style={[styles.gatewayIconBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Building2 size={22} color="#2563EB" />
              </View>
              <View style={[styles.roleTag, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={[styles.roleTagText, { color: '#1D4ED8' }]}>COMMAND CENTER</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Authority Command</Text>
            <Text style={styles.cardDesc}>
              Real-time incident dispatch, multi-layer GIS safety maps, tactical responder coordination, and grounded AI operational intelligence.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#2563EB" />
                <Text style={styles.featureText}>Live multi-layer geospatial operations map</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#2563EB" />
                <Text style={styles.featureText}>AI Copilot tactical query & action execution</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#2563EB" />
                <Text style={styles.featureText}>E-FIR generation & legal audit governance</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
              onPress={openAdmin}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>Launch Command Center</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Card 2: Tourist Safety Companion */}
          <View style={[styles.gatewayCard, styles.gatewayCardTourist]}>
            <View style={styles.featuredBadgeContainer}>
              <Sparkles size={11} color="#059669" />
              <Text style={styles.featuredBadgeText}>RECOMMENDED</Text>
            </View>

            <View style={styles.gatewayHeader}>
              <View style={[styles.gatewayIconBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <ShieldCheck size={22} color="#059669" />
              </View>
              <View style={[styles.roleTag, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.roleTagText, { color: '#047857' }]}>TRAVELER APP</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Tourist Safety Companion</Text>
            <Text style={styles.cardDesc}>
              Traveler companion featuring continuous motion anomaly detection, verified digital credentials, hazard alerts, and 1-touch SOS.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.featureText}>One-touch deliberate emergency SOS trigger</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.featureText}>Verifiable Digital Tourist Credential (QR / KYC)</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.featureText}>Safe Corridors & high-risk zone breach alert</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#059669' }]}
              onPress={openTourist}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>Open Tourist Companion</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Card 3: Tactical Field Responder */}
          <View style={[styles.gatewayCard, styles.gatewayCardResponder]}>
            <View style={styles.gatewayHeader}>
              <View style={[styles.gatewayIconBadge, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                <Users size={22} color="#EA580C" />
              </View>
              <View style={[styles.roleTag, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                <Text style={[styles.roleTagText, { color: '#C2410C' }]}>TACTICAL UNIT</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Field Operations</Text>
            <Text style={styles.cardDesc}>
              Mission dispatch terminal for police, forest rangers, and medical teams with GPS navigation, on-scene assessment, and field notes sync.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#EA580C" />
                <Text style={styles.featureText}>Real-time mission assignment & GPS dispatch</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#EA580C" />
                <Text style={styles.featureText}>On-scene triage assessment & unit handover</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle2 size={14} color="#EA580C" />
                <Text style={styles.featureText}>Offline-resilient field notes & timeline</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EA580C' }]}
              onPress={openResponder}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>Access Field Operations</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Subsystem Architecture Grid */}
        <View style={styles.systemSection}>
          <Text style={styles.sectionOverline}>CORE ENGINE INTEGRITY</Text>
          <Text style={styles.sectionTitle}>Subsystem Live Status</Text>

          <View style={[styles.subsystemGrid, isCompact && styles.subsystemGridCompact]}>
            <View style={styles.subsystemCard}>
              <View style={styles.subsystemTop}>
                <Cpu size={18} color="#2563EB" />
                <View style={[styles.activePill, { backgroundColor: '#EFF6FF' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#2563EB' }]} />
                  <Text style={[styles.activePillText, { color: '#1D4ED8' }]}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.subsystemTitle}>FastAPI Core Gateway</Text>
              <Text style={styles.subsystemDesc}>
                Zero-trust JWT authentication, role-based access control, and audited microservice endpoints.
              </Text>
            </View>

            <View style={styles.subsystemCard}>
              <View style={styles.subsystemTop}>
                <Radio size={18} color="#059669" />
                <View style={[styles.activePill, { backgroundColor: '#ECFDF5' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#059669' }]} />
                  <Text style={[styles.activePillText, { color: '#047857' }]}>STREAMING</Text>
                </View>
              </View>
              <Text style={styles.subsystemTitle}>Realtime Event Bus</Text>
              <Text style={styles.subsystemDesc}>
                Sub-50ms WebSocket telemetry streaming with fallback event reconciliation and heartbeat.
              </Text>
            </View>

            <View style={styles.subsystemCard}>
              <View style={styles.subsystemTop}>
                <Layers size={18} color="#EA580C" />
                <View style={[styles.activePill, { backgroundColor: '#FFF7ED' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#EA580C' }]} />
                  <Text style={[styles.activePillText, { color: '#C2410C' }]}>50Hz CALIBRATED</Text>
                </View>
              </View>
              <Text style={styles.subsystemTitle}>LSTM Motion Anomaly AI</Text>
              <Text style={styles.subsystemDesc}>
                High-frequency 50Hz accelerometer & gyroscope anomaly inference with calibrated confidence.
              </Text>
            </View>

            <View style={styles.subsystemCard}>
              <View style={styles.subsystemTop}>
                <MapPin size={18} color="#7C3AED" />
                <View style={[styles.activePill, { backgroundColor: '#F5F3FF' }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#7C3AED' }]} />
                  <Text style={[styles.activePillText, { color: '#6D28D9' }]}>POLYGONS LIVE</Text>
                </View>
              </View>
              <Text style={styles.subsystemTitle}>Spatial Geofencing</Text>
              <Text style={styles.subsystemDesc}>
                Dynamic risk polygon intersection, hazard buffer zones, and instant boundary notifications.
              </Text>
            </View>
          </View>
        </View>

        {/* Clean Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <Shield size={18} color="#059669" />
            <Text style={styles.footerBrand}>TourSafe Sovereign Safety Infrastructure</Text>
          </View>
          <Text style={styles.footerCopyright}>
            Official National Tourism Safety & Emergency Management Network. All rights reserved.
          </Text>
          <View style={styles.footerPills}>
            <View style={styles.footerPill}>
              <Lock size={11} color="#64748B" />
              <Text style={styles.footerPillText}>TLS 1.3 / AES-256</Text>
            </View>
            <View style={styles.footerPill}>
              <FileCheck size={11} color="#64748B" />
              <Text style={styles.footerPillText}>DPDP Act 2023</Text>
            </View>
            <View style={styles.footerPill}>
              <Fingerprint size={11} color="#64748B" />
              <Text style={styles.footerPillText}>Zero-Trust RBAC</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 60,
  },
  container: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  govBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  govDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  govBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionsMobile: {
    width: '100%',
    justifyContent: 'space-between',
  },
  activeUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeUserText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  sessionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sessionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  sessionBannerSubtitle: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 1,
  },
  sessionHighlight: {
    color: '#0F172A',
    fontWeight: '800',
  },
  sessionLaunchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sessionLaunchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 28,
    marginBottom: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  heroChipEmerald: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  heroChipEmeraldText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  heroChipIndigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  heroChipIndigoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 38,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  heroHeadingMobile: {
    fontSize: 22,
    lineHeight: 28,
  },
  heroSubtext: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 24,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  metricsStripMobile: {
    flexDirection: 'column',
    gap: 14,
    alignItems: 'stretch',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    marginBottom: 16,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  gatewayGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  gatewayGridCompact: {
    flexDirection: 'column',
  },
  gatewayCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gatewayCardAdmin: {
    borderColor: '#DBEAFE',
  },
  gatewayCardTourist: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FAFCFB',
  },
  gatewayCardResponder: {
    borderColor: '#FFEDD5',
  },
  featuredBadgeContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  gatewayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  gatewayIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 18,
  },
  featureList: {
    gap: 10,
    marginBottom: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  systemSection: {
    marginBottom: 32,
  },
  subsystemGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  subsystemGridCompact: {
    flexDirection: 'column',
  },
  subsystemCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  subsystemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subsystemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subsystemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerCopyright: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  footerPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerPillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
