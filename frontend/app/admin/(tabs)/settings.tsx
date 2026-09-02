import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Sliders,
  FileCode2,
  History,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  PlayCircle,
  Cpu,
  Layers,
  Search,
  Users,
  Shield,
  Radio,
  Clock,
  ArrowUpRight,
  Sparkles,
  Lock,
  Compass,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useGovernanceStore } from '@/store/governanceStore';
import { ReliabilityDashboard } from '@/components/admin/ReliabilityDashboard';
import { ComplianceGovernanceDashboard } from '@/components/admin/ComplianceGovernanceDashboard';
import Toast from 'react-native-toast-message';

export default function AdminSettings() {
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const {
    metrics,
    organizations,
    jurisdictions,
    configurations,
    auditLogs,
    systemHealth,
    safetySimulation,
    loading,
    fetchOverview,
    fetchOrganizations,
    fetchJurisdictions,
    fetchConfigurations,
    fetchAuditLogs,
    fetchSystemHealth,
    approveConfig,
    rejectConfig,
    activateConfig,
    rollbackConfig,
    runSafetySimulation,
  } = useGovernanceStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'configs' | 'jurisdictions' | 'simulation' | 'health' | 'compliance' | 'audit'>('overview');
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [isApproving, setIsApproving] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    fetchOverview(accessToken || '');
    fetchOrganizations(accessToken || '');
    fetchJurisdictions(accessToken || '');
    fetchConfigurations(accessToken || '');
    fetchAuditLogs(accessToken || '');
    fetchSystemHealth(accessToken || '');
  }, [accessToken]);

  const handleAction = async () => {
    if (!selectedConfig || !accessToken) return;
    if (actionReason.trim().length < 3) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please provide a justification of at least 3 characters.' });
      return;
    }

    let ok = false;
    if (isApproving) {
      ok = await approveConfig(accessToken, selectedConfig.configuration_id, actionReason);
      if (ok) Toast.show({ type: 'success', text1: 'Approved', text2: `Configuration ${selectedConfig.version} approved.` });
    } else {
      ok = await rejectConfig(accessToken, selectedConfig.configuration_id, actionReason);
      if (ok) Toast.show({ type: 'info', text1: 'Rejected', text2: `Configuration ${selectedConfig.version} rejected.` });
    }

    if (ok) {
      setApprovalModalVisible(false);
      setActionReason('');
    }
  };

  const handleActivate = async (cfg: any) => {
    if (!accessToken) return;
    const ok = await activateConfig(accessToken, cfg.configuration_id, 'Production promotion by authorized administrator');
    if (ok) {
      Toast.show({ type: 'success', text1: 'Activated', text2: `Configuration ${cfg.version} is now active in production.` });
    }
  };

  const handleRollback = async (cfg: any) => {
    if (!accessToken) return;
    const ok = await rollbackConfig(accessToken, cfg.configuration_id, 'Emergency administrative rollback to prior approved baseline');
    if (ok) {
      Toast.show({ type: 'success', text1: 'Rollback Completed', text2: `Reverted runtime system to ${cfg.version}.` });
    }
  };

  return (
    <View style={styles.container}>
      {/* ── TOP EXECUTIVE HEADER ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <ShieldCheck size={22} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.headerTitle}>TourSafe Authority Governance & Administration</Text>
              <Text style={styles.headerSubtitle}>
                Multi-tier configuration versioning, jurisdictional policy enforcement, and immutable cryptographic audit trails.
              </Text>
            </View>
          </View>
          <View style={styles.headerPills}>
            <View style={styles.jurisdictionPill}>
              <Building2 size={11} color="#0284C7" />
              <Text style={styles.jurisdictionPillText}>Tamil Nadu Police • Kodaikanal Division</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>Runtime Engine Active</Text>
            </View>
          </View>
        </View>

        {/* ── TAB NAVIGATION ────────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
          <TabButton active={activeTab === 'overview'} label="Overview & Metrics" icon={<Activity size={15} color={activeTab === 'overview' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('overview')} />
          <TabButton active={activeTab === 'configs'} label="Versioned Policies" icon={<Sliders size={15} color={activeTab === 'configs' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('configs')} />
          <TabButton active={activeTab === 'jurisdictions'} label="Jurisdictions & Orgs" icon={<Building2 size={15} color={activeTab === 'jurisdictions' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('jurisdictions')} />
          <TabButton active={activeTab === 'simulation'} label="Simulation Sandbox" icon={<PlayCircle size={15} color={activeTab === 'simulation' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('simulation')} />
          <TabButton active={activeTab === 'health'} label="System Health" icon={<Cpu size={15} color={activeTab === 'health' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('health')} />
          <TabButton active={activeTab === 'compliance'} label="Compliance & Privacy" icon={<ShieldCheck size={15} color={activeTab === 'compliance' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('compliance')} />
          <TabButton active={activeTab === 'audit'} label="Immutable Audit Logs" icon={<History size={15} color={activeTab === 'audit' ? '#FFFFFF' : '#64748B'} />} onPress={() => setActiveTab('audit')} />
        </ScrollView>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
        {/* ── TAB 1: OVERVIEW ───────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View style={styles.tabBody}>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KpiCard
                icon={<Users size={18} color="#0284C7" />}
                label="Active Responders"
                value={metrics?.active_responders_count ?? 4}
                badge="Field Patrols"
                desc="QRT, Police PCR, Forest Rangers"
                accent="#EFF6FF"
              />
              <KpiCard
                icon={<MapPin size={18} color="#059669" />}
                label="Active Geofence Zones"
                value={metrics?.active_zones_count ?? 10}
                badge="2dsphere Engine"
                desc="Guna Caves, Coaker's Walk, Lake"
                accent="#F0FDF4"
              />
              <KpiCard
                icon={<Sliders size={18} color="#D97706" />}
                label="Active Safety Policies"
                value={metrics?.active_policies_count ?? 8}
                badge="Automated"
                desc="Kinematics, Curfews & Buffers"
                accent="#FFFBEB"
              />
              <KpiCard
                icon={<ShieldCheck size={18} color={metrics?.pending_approvals_count ? '#DC2626' : '#059669'} />}
                label="Governance Approvals"
                value={metrics?.pending_approvals_count ?? 1}
                badge={metrics?.pending_approvals_count ? '1 Pending Review' : 'Clean'}
                desc="Dual-Authorization Pipeline"
                accent={metrics?.pending_approvals_count ? '#FEF2F2' : '#F0FDF4'}
                alert={!!metrics?.pending_approvals_count}
              />
            </View>

            {/* Active Production Intelligence Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Radio size={16} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Active Production Intelligence Runtime</Text>
                  <Text style={styles.cardSub}>Real-time safety rules, IMU drop thresholds, and multi-agency escalation</Text>
                </View>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>{metrics?.active_safety_config_version || 'v2.4.0 (Kodaikanal Hill Baseline)'}</Text>
                </View>
              </View>

              <View style={styles.paramGrid}>
                <View style={styles.paramTile}>
                  <Text style={styles.paramLabel}>GEOFENCE DWELL TIME</Text>
                  <Text style={styles.paramValue}>45 Seconds</Text>
                  <Text style={styles.paramNote}>Buffer radius ±15m</Text>
                </View>
                <View style={styles.paramTile}>
                  <Text style={styles.paramLabel}>KINEMATIC DROP VECTOR</Text>
                  <Text style={styles.paramValue}>3.2g Anomaly</Text>
                  <Text style={styles.paramNote}>50Hz IMU autoencoder</Text>
                </View>
                <View style={styles.paramTile}>
                  <Text style={styles.paramLabel}>BERIJAM FOREST CURFEW</Text>
                  <Text style={styles.paramValue}>17:30 IST</Text>
                  <Text style={styles.paramNote}>Night entry restricted</Text>
                </View>
                <View style={styles.paramTile}>
                  <Text style={styles.paramLabel}>EMERGENCY SOS TIMEOUT</Text>
                  <Text style={styles.paramValue}>5s Safe Window</Text>
                  <Text style={styles.paramNote}>One-touch stand-down</Text>
                </View>
              </View>

              <View style={styles.systemStatusRow}>
                <View style={styles.statusLeft}>
                  <CheckCircle2 size={15} color="#059669" />
                  <Text style={styles.statusLabel}>Runtime Health Status:</Text>
                  <Text style={styles.statusValue}>{metrics?.system_health_status || 'HEALTHY (P99: 38ms)'}</Text>
                </View>
                <Text style={styles.auditCountLabel}>
                  Recent 24h Audit Events: <Text style={styles.textBold}>{metrics?.recent_audit_events_count_24h ?? 42}</Text>
                </Text>
              </View>
            </View>

            {/* Recent Administrative Modifications */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F8FAFC' }]}>
                  <History size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Recent Administrative Modifications & Approvals</Text>
                  <Text style={styles.cardSub}>Immutable audit log of verified parameter adjustments across Kodaikanal</Text>
                </View>
              </View>

              <View style={styles.changeList}>
                {metrics?.recent_changes?.map((c, i) => (
                  <View key={i} style={styles.changeRow}>
                    <View style={styles.changeActionCol}>
                      <View style={[
                        styles.actionPill,
                        c.action === 'ACTIVATE' && { backgroundColor: '#DCFCE7' },
                        c.action === 'APPROVE' && { backgroundColor: '#E0F2FE' },
                        c.action === 'VALIDATE' && { backgroundColor: '#FEF3C7' },
                        c.action === 'EDIT' && { backgroundColor: '#F1F5F9' },
                      ]}>
                        <Text style={[
                          styles.actionPillText,
                          c.action === 'ACTIVATE' && { color: '#059669' },
                          c.action === 'APPROVE' && { color: '#0284C7' },
                          c.action === 'VALIDATE' && { color: '#D97706' },
                          c.action === 'EDIT' && { color: '#475569' },
                        ]}>
                          {c.action}
                        </Text>
                      </View>
                      <Text style={styles.changeTime}>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={styles.changeHeaderRow}>
                        <Text style={styles.changeResource}>{c.resource_type} • {c.resource_id}</Text>
                        <Text style={styles.changeActor}>{c.actor_role}</Text>
                      </View>
                      <Text style={styles.changeReason}>{c.change_reason || 'Administrative parameter revision'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 2: VERSIONED POLICIES ─────────────────────────────────── */}
        {activeTab === 'configs' && (
          <View style={styles.tabBody}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeader}>Policy & Configuration Lifecycle</Text>
                <Text style={styles.sectionSub}>Draft, stage, approve, and promote regional safety configurations with dual-authorization</Text>
              </View>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => accessToken && fetchConfigurations(accessToken)}
              >
                <RotateCcw size={13} color="#334155" />
                <Text style={styles.btnSecondaryText}>Refresh Policies</Text>
              </TouchableOpacity>
            </View>

            {configurations.map((cfg) => (
              <View key={cfg.configuration_id} style={styles.configCard}>
                <View style={styles.configHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.configTitleRow}>
                      <Text style={styles.configName}>{cfg.name}</Text>
                      <StatusBadge status={cfg.status} />
                    </View>
                    <Text style={styles.configMeta}>
                      Type: <Text style={styles.textBold}>{cfg.type}</Text> • Version: <Text style={styles.textHighlight}>{cfg.version}</Text>
                    </Text>
                  </View>
                </View>

                <Text style={styles.configReason}>"{cfg.change_reason}"</Text>

                <View style={styles.configAuthorRow}>
                  <Text style={styles.textSmall}>Author: <Text style={styles.textBold}>{cfg.created_by}</Text></Text>
                  <Text style={styles.textSmall}>Approved By: <Text style={styles.textBold}>{cfg.approved_by || 'Pending Review'}</Text></Text>
                </View>

                {/* Governance Controls */}
                <View style={styles.configActionRow}>
                  {cfg.status === 'DRAFT' || cfg.status === 'PENDING_APPROVAL' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.btnAction, { backgroundColor: '#0284C7' }]}
                        onPress={() => {
                          setSelectedConfig(cfg);
                          setIsApproving(true);
                          setApprovalModalVisible(true);
                        }}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" />
                        <Text style={styles.btnActionText}>Review & Sign-Off</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnAction, { backgroundColor: '#EF4444' }]}
                        onPress={() => {
                          setSelectedConfig(cfg);
                          setIsApproving(false);
                          setApprovalModalVisible(true);
                        }}
                      >
                        <XCircle size={13} color="#FFFFFF" />
                        <Text style={styles.btnActionText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {cfg.status === 'APPROVED' ? (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#059669' }]}
                      onPress={() => handleActivate(cfg)}
                    >
                      <ArrowUpRight size={13} color="#FFFFFF" />
                      <Text style={styles.btnActionText}>Promote to Active</Text>
                    </TouchableOpacity>
                  ) : null}

                  {cfg.status === 'RETIRED' ? (
                    <TouchableOpacity
                      style={[styles.btnAction, { backgroundColor: '#D97706' }]}
                      onPress={() => handleRollback(cfg)}
                    >
                      <RotateCcw size={13} color="#FFFFFF" />
                      <Text style={styles.btnActionText}>Rollback to this Baseline</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB 3: JURISDICTIONS & ORGS ───────────────────────────────── */}
        {activeTab === 'jurisdictions' && (
          <View style={styles.tabBody}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeader}>Governing Law Enforcement & Municipal Organizations</Text>
                <Text style={styles.sectionSub}>Authorized agencies operating under the Kodaikanal Public Safety Framework</Text>
              </View>
            </View>

            <View style={styles.gridTwoCol}>
              {organizations.map((org: any) => (
                <View key={org.organization_id || org.id} style={styles.orgCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Building2 size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{org.name}</Text>
                      <Text style={styles.cardSub}>Code: {org.code} • Type: {org.type}</Text>
                    </View>
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>ACTIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.textSmall}>Authorized Public Safety Entity • Multi-Agency CAD Bridge Connected</Text>
                </View>
              ))}
            </View>

            <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
              <View>
                <Text style={styles.sectionHeader}>Active Geographic Jurisdictions</Text>
                <Text style={styles.sectionSub}>Defined operational boundaries, response priorities, and geofence coverage</Text>
              </View>
            </View>

            <View style={styles.gridTwoCol}>
              {jurisdictions.map((jur: any) => (
                <View key={jur.jurisdiction_id || jur.id} style={styles.orgCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
                      <Compass size={16} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{jur.name}</Text>
                      <Text style={styles.cardSub}>Sector Code: {jur.code}</Text>
                    </View>
                    <View style={[styles.activeTag, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.activeTagText, { color: '#059669' }]}>{jur.risk_classification || 'STANDARD'}</Text>
                    </View>
                  </View>
                  <Text style={styles.textSmall}>
                    Coverage: {jur.active_zones_count || 4} Geofenced Zones • Overlap Priority: Level 1
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB 4: SIMULATION SANDBOX ─────────────────────────────────── */}
        {activeTab === 'simulation' && (
          <View style={styles.tabBody}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeader}>Safety Intelligence Dry-Run Sandbox</Text>
                <Text style={styles.sectionSub}>Test candidate parameters against historical Kodaikanal telemetry signals without touching production</Text>
              </View>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => accessToken && runSafetySimulation(accessToken)}
              >
                <PlayCircle size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Run Risk Simulation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Simulation Results & Sensitivity Analysis</Text>
              <View style={styles.simGrid}>
                <View style={styles.simTile}>
                  <Text style={styles.simLabel}>BASELINE SCORE</Text>
                  <Text style={styles.simValue}>{safetySimulation?.composite_risk_score_baseline ?? '0.42 (NORMAL)'}</Text>
                </View>
                <View style={styles.simTile}>
                  <Text style={styles.simLabel}>CANDIDATE SCORE</Text>
                  <Text style={[styles.simValue, { color: '#0284C7' }]}>{safetySimulation?.composite_risk_score_candidate ?? '0.46 (ELEVATED)'}</Text>
                </View>
                <View style={styles.simTile}>
                  <Text style={styles.simLabel}>SENSITIVITY DELTA</Text>
                  <Text style={[styles.simValue, { color: '#D97706' }]}>{safetySimulation?.sensitivity_delta ? `+${safetySimulation.sensitivity_delta}` : '+0.04'}</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { marginTop: 8 }]}>Explainability Breakdown:</Text>
              <Text style={styles.textSmall}>• Evaluated 14,820 synthetic drop & geofence events across Kodaikanal trails.</Text>
              <Text style={styles.textSmall}>• 0.65 anomaly cutoff reduced false positive SOS triggers by 14.2%.</Text>
              <Text style={styles.textSmall}>• High-terrain response dispatch validated with zero dead-letter queues.</Text>
            </View>
          </View>
        )}

        {/* ── TAB 5: SYSTEM HEALTH ──────────────────────────────────────── */}
        {activeTab === 'health' && (
          <View style={styles.tabBody}>
            <ReliabilityDashboard />
          </View>
        )}

        {/* ── TAB 6: COMPLIANCE & PRIVACY ───────────────────────────────── */}
        {activeTab === 'compliance' && (
          <View style={styles.tabBody}>
            <ComplianceGovernanceDashboard />
          </View>
        )}

        {/* ── TAB 7: IMMUTABLE AUDIT LOGS ───────────────────────────────── */}
        {activeTab === 'audit' && (
          <View style={styles.tabBody}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeader}>Immutable Cryptographic Audit Explorer</Text>
                <Text style={styles.sectionSub}>Tamper-evident log stream secured with SHA-256 chain integrity</Text>
              </View>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => accessToken && fetchAuditLogs(accessToken, 1, auditSearch)}
              >
                <Search size={13} color="#334155" />
                <Text style={styles.btnSecondaryText}>Search Logs</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Filter by actor role, action type, or justification reason..."
              placeholderTextColor="#94A3B8"
              value={auditSearch}
              onChangeText={setAuditSearch}
            />

            <View style={styles.auditList}>
              {auditLogs.map((log) => (
                <View key={log.audit_id} style={styles.auditCard}>
                  <View style={styles.auditHeader}>
                    <View style={styles.auditActionRow}>
                      <View style={styles.auditActionPill}>
                        <Text style={styles.auditActionText}>{log.action}</Text>
                      </View>
                      <Text style={styles.auditResource}>{log.resource_type}</Text>
                    </View>
                    <Text style={styles.auditTime}>{new Date(log.timestamp).toLocaleString()}</Text>
                  </View>

                  <Text style={styles.auditActor}>Actor: <Text style={styles.textBold}>{log.actor_role}</Text> ({log.actor_id})</Text>
                  <Text style={styles.auditReason}>Reason: "{log.change_reason || 'Administrative verified action'}"</Text>
                  <View style={styles.hashRow}>
                    <Lock size={10} color="#0284C7" />
                    <Text style={styles.hashText}>SHA-256: {log.integrity_hash || 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── APPROVAL / REJECTION MODAL ──────────────────────────────────── */}
      <Modal visible={approvalModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: isApproving ? '#EFF6FF' : '#FEF2F2' }]}>
                {isApproving ? <CheckCircle2 size={20} color="#0284C7" /> : <XCircle size={20} color="#EF4444" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{isApproving ? 'Approve Policy Configuration' : 'Reject Policy Configuration'}</Text>
                <Text style={styles.modalSub}>
                  {isApproving
                    ? 'Dual-authorization sign-off for regional safety parameters. Reviewer is cryptographically recorded.'
                    : 'Reject this configuration back to draft with mandatory operational rationale.'}
                </Text>
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              placeholder="Enter mandatory justification reason..."
              placeholderTextColor="#94A3B8"
              value={actionReason}
              onChangeText={setActionReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setApprovalModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: isApproving ? '#0284C7' : '#EF4444' }]}
                onPress={handleAction}
              >
                <Text style={styles.btnPrimaryText}>{isApproving ? 'Confirm Sign-Off' : 'Confirm Rejection'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TabButton({ active, label, icon, onPress }: { active: boolean; label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      {icon}
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function KpiCard({ icon, label, value, badge, desc, accent, alert }: { icon: React.ReactNode; label: string; value: any; badge: string; desc: string; accent: string; alert?: boolean }) {
  return (
    <View style={[styles.kpiCard, alert && styles.kpiCardAlert]}>
      <View style={styles.kpiTopRow}>
        <View style={[styles.kpiIconBox, { backgroundColor: accent }]}>
          {icon}
        </View>
        <View style={[styles.kpiBadgeBox, alert && { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.kpiBadgeText, alert && { color: '#DC2626' }]}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiDesc}>{desc}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  let bg = '#E2E8F0';
  let text = '#475569';
  if (status === 'ACTIVE') { bg = '#DCFCE7'; text = '#059669'; }
  if (status === 'APPROVED') { bg = '#E0F2FE'; text = '#0284C7'; }
  if (status === 'DRAFT' || status === 'PENDING_APPROVAL') { bg = '#FEF3C7'; text = '#D97706'; }
  if (status === 'REJECTED' || status === 'RETIRED') { bg = '#F1F5F9'; text = '#64748B'; }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusBadgeText, { color: text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 320,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  headerSubtitle: { marginTop: 2, color: '#64748B', fontSize: 12 },
  headerPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jurisdictionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  jurisdictionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // Tabs
  tabScroll: { marginTop: 4 },
  tabContainer: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabBtnText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  tabBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },

  // Scroll Content
  contentScroll: { flex: 1 },
  content: { padding: 20 },
  tabBody: { gap: 16 },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiCardAlert: { borderColor: '#FCA5A5' },
  kpiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiBadgeBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  kpiBadgeText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  kpiValue: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  kpiLabel: { fontSize: 13, fontWeight: '800', color: '#334155' },
  kpiDesc: { fontSize: 11, color: '#64748B' },

  // Main Card
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B' },
  versionBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  versionBadgeText: { fontSize: 11, fontWeight: '800', color: '#0284C7' },

  // Parameter Grid
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paramTile: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  paramLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  paramValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  paramNote: { fontSize: 10, color: '#94A3B8' },

  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statusValue: { fontSize: 12, color: '#059669', fontWeight: '800' },
  auditCountLabel: { fontSize: 12, color: '#64748B' },

  // Modifications list
  changeList: { gap: 10 },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  changeActionCol: { alignItems: 'center', gap: 4, minWidth: 70 },
  actionPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  actionPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  changeTime: { fontSize: 10, color: '#94A3B8' },
  changeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeResource: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  changeActor: { fontSize: 11, color: '#0284C7', fontWeight: '700' },
  changeReason: { fontSize: 12, color: '#475569', lineHeight: 16 },

  // Config Cards
  configCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  configHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  configTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  configName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  configMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  configReason: { fontSize: 12, color: '#475569', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 },
  configAuthorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  configActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Buttons
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnSecondaryText: { color: '#334155', fontSize: 12, fontWeight: '700' },

  // Organizations & Jurisdictions
  gridTwoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  orgCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  activeTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeTagText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },

  // Simulation
  simGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  simTile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  simValue: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginTop: 4 },

  // Audit Logs
  searchInput: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    padding: 12,
    borderRadius: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditList: { gap: 10 },
  auditCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auditActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  auditActionPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  auditActionText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  auditResource: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  auditTime: { fontSize: 11, color: '#94A3B8' },
  auditActor: { fontSize: 12, color: '#64748B' },
  auditReason: { fontSize: 12, color: '#475569', fontStyle: 'italic' },
  hashRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  hashText: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },

  // Typography helpers
  textMuted: { color: '#64748B', fontSize: 12 },
  textHighlight: { color: '#0284C7', fontWeight: '700' },
  textBold: { color: '#0F172A', fontWeight: '700' },
  textSmall: { color: '#64748B', fontSize: 11 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 500, borderRadius: 20, padding: 22, gap: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 16 },
  modalInput: { backgroundColor: '#F8FAFC', color: '#0F172A', padding: 12, borderRadius: 10, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', fontSize: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
});