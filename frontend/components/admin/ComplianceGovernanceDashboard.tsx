import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  ShieldCheck,
  Layers,
  Lock,
  Building2,
  UserCheck,
  FileText,
  Play,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react-native';
import { useComplianceStore } from '../../store/complianceStore';
import { usePrivacyStore } from '../../store/privacyStore';
import { FrameworkType } from '../../types/compliance';

export const ComplianceGovernanceDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'FRAMEWORKS' | 'RETENTION' | 'LEGAL_HOLDS' | 'ACCESS_PAM' | 'VENDORS' | 'DSR_QUEUE' | 'AUDITOR'
  >('FRAMEWORKS');

  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('ISO_27001');
  const [bgRole, setBgRole] = useState('SUPER_ADMIN');
  const [bgReason, setBgReason] = useState('');
  const [bgScope, setBgScope] = useState('SYSTEM_RECOVERY');
  const [holdTitle, setHoldTitle] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [holdScopeId, setHoldScopeId] = useState('');

  const {
    policies,
    legalHolds,
    vendors,
    accessReviews,
    breakGlassSessions,
    readinessReports,
    isLoading,
    fetchPolicies,
    triggerRetentionRun,
    approvePolicy,
    fetchLegalHolds,
    createLegalHold,
    releaseLegalHold,
    fetchVendors,
    updateVendorReview,
    fetchAccessReviews,
    requestBreakGlass,
    fetchBreakGlassSessions,
    revokeBreakGlass,
    fetchFrameworkReadiness,
    fetchAuditorExport,
  } = useComplianceStore();

  const { requests: dsrRequests, fetchRequests: fetchDsrRequests, reviewRequest: reviewDsr } = usePrivacyStore();

  useEffect(() => {
    fetchPolicies();
    fetchLegalHolds();
    fetchVendors();
    fetchAccessReviews();
    fetchBreakGlassSessions();
    fetchFrameworkReadiness(selectedFramework);
    fetchDsrRequests();
  }, []);

  useEffect(() => {
    fetchFrameworkReadiness(selectedFramework);
  }, [selectedFramework]);

  const handleRequestBreakGlass = async () => {
    if (!bgReason.trim()) {
      Alert.alert('Validation Error', 'A specific justification is mandatory for emergency break-glass elevation.');
      return;
    }
    const sess = await requestBreakGlass(bgRole, bgReason, bgScope);
    if (sess) {
      Alert.alert('Break-Glass Session Activated', `Temporary elevated access granted. Expires: ${sess.expires_at}`);
      setBgReason('');
    } else {
      Alert.alert('Error', 'Failed to request break-glass access.');
    }
  };

  const handleCreateHold = async () => {
    if (!holdTitle.trim() || !holdScopeId.trim() || !holdReason.trim()) {
      Alert.alert('Validation Error', 'Title, target identifier, and statutory reason are required.');
      return;
    }
    const h = await createLegalHold({
      title: holdTitle,
      scope_type: 'USER',
      scope_id: holdScopeId,
      reason: holdReason,
    });
    if (h) {
      Alert.alert('Legal Hold Placed', `Records for ${holdScopeId} are now protected from automated retention purge.`);
      setHoldTitle('');
      setHoldReason('');
      setHoldScopeId('');
    } else {
      Alert.alert('Error', 'Failed to apply legal hold.');
    }
  };

  const currentReport = readinessReports[selectedFramework];

  return (
    <View style={styles.container}>
      {/* Top Section Nav Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScrollView}>
        <View style={styles.navRow}>
          {[
            { id: 'FRAMEWORKS', label: 'Framework Readiness', icon: ShieldCheck },
            { id: 'RETENTION', label: 'Retention & Purge', icon: Layers },
            { id: 'LEGAL_HOLDS', label: 'Legal Holds', icon: Lock },
            { id: 'ACCESS_PAM', label: 'Access & Break-Glass', icon: KeyRound },
            { id: 'VENDORS', label: 'Third-Party Processors', icon: Building2 },
            { id: 'DSR_QUEUE', label: 'Privacy DSR Queue', icon: UserCheck },
            { id: 'AUDITOR', label: 'Auditor Portal', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setActiveSection(t.id as any)}
                style={[styles.navButton, activeSection === t.id && styles.navButtonActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeSection === t.id }}
              >
                <Icon size={16} color={activeSection === t.id ? '#2DD4BF' : '#94A3B8'} />
                <Text style={[styles.navButtonText, activeSection === t.id && styles.navButtonTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Main Content Area */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: FRAMEWORKS */}
        {activeSection === 'FRAMEWORKS' && (
          <View style={styles.sectionBlock}>
            <View style={styles.frameworkChips}>
              {(['ISO_27001', 'SOC_2', 'GDPR_READINESS', 'DPDP_READINESS', 'NIST_CSF'] as FrameworkType[]).map((fw) => (
                <TouchableOpacity
                  key={fw}
                  onPress={() => setSelectedFramework(fw)}
                  style={[styles.fwChip, selectedFramework === fw && styles.fwChipActive]}
                >
                  <Text style={[styles.fwChipText, selectedFramework === fw && styles.fwChipTextActive]}>
                    {fw.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentReport ? (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeading}>{currentReport.framework} Readiness</Text>
                    <Text style={styles.cardSubheading}>{currentReport.total_controls} Technical Controls Mapped</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.scoreNumber}>{currentReport.readiness_percentage}%</Text>
                    <Text style={styles.scoreLabel}>Readiness Score</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${currentReport.readiness_percentage}%` }]} />
                </View>

                {/* Controls List */}
                <Text style={styles.sectionSubTitle}>Mapped Controls & Evidences</Text>
                {currentReport.controls_summary.map((ctrl) => (
                  <View key={ctrl.control_id} style={styles.controlItem}>
                    <View style={styles.controlItemHeader}>
                      <Text style={styles.controlTitle}>
                        {ctrl.control_id} • {ctrl.title}
                      </Text>
                      <View style={styles.badgeSuccess}>
                        <Text style={styles.badgeSuccessText}>{ctrl.implementation_status}</Text>
                      </View>
                    </View>
                    <Text style={styles.controlDesc}>{ctrl.description}</Text>
                    <Text style={styles.controlEvidence}>Evidence: {ctrl.evidence_refs.join(', ')}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <ActivityIndicator size="small" color="#2DD4BF" style={{ paddingVertical: 24 }} />
            )}
          </View>
        )}

        {/* SECTION 2: RETENTION */}
        {activeSection === 'RETENTION' && (
          <View style={styles.sectionBlock}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionMainTitle}>Active Retention Policies</Text>
              <TouchableOpacity
                onPress={async () => {
                  const res = await triggerRetentionRun(false);
                  Alert.alert('Retention Run Complete', `Deleted: ${res?.total_records_deleted || 0}, Blocked by Hold: ${res?.total_records_retained_legal_hold || 0}`);
                }}
                style={styles.actionBtnTeal}
              >
                <Play size={12} color="#fff" />
                <Text style={styles.actionBtnText}>Execute Sweep</Text>
              </TouchableOpacity>
            </View>

            {policies.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.cardHeading}>{p.data_type}</Text>
                    <Text style={styles.versionTag}>v{p.version}</Text>
                  </View>
                  <View style={[styles.statusBadge, p.status === 'ACTIVE' && styles.statusBadgeActive]}>
                    <Text style={[styles.statusBadgeText, p.status === 'ACTIVE' && styles.statusBadgeTextActive]}>
                      {p.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSubheading}>{p.description}</Text>
                <View style={styles.metaRowDivided}>
                  <Text style={styles.metaLabel}>Retention Window: <Text style={styles.metaValueHighlight}>{p.retention_period_days} Days</Text></Text>
                  <Text style={styles.metaLabel}>Action: <Text style={styles.metaValueHighlight}>{p.deletion_behavior}</Text></Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 3: LEGAL HOLDS */}
        {activeSection === 'LEGAL_HOLDS' && (
          <View style={styles.sectionBlock}>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Place New Legal Hold</Text>
              <TextInput
                value={holdTitle}
                onChangeText={setHoldTitle}
                placeholder="Case / Warrant / Investigation Title"
                placeholderTextColor="#64748B"
                style={styles.inputField}
              />
              <TextInput
                value={holdScopeId}
                onChangeText={setHoldScopeId}
                placeholder="Target User ID or Incident ID"
                placeholderTextColor="#64748B"
                style={styles.inputField}
              />
              <TextInput
                value={holdReason}
                onChangeText={setHoldReason}
                placeholder="Statutory / Investigative Reason"
                placeholderTextColor="#64748B"
                style={styles.inputField}
              />
              <TouchableOpacity onPress={handleCreateHold} style={styles.actionBtnAmber}>
                <Text style={styles.actionBtnText}>Apply Protective Hold</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionMainTitle}>Active Holds Register</Text>
            {legalHolds.map((h) => (
              <View key={h.id} style={[styles.card, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardHeading, { color: '#FCD34D' }]}>{h.title}</Text>
                  <View style={styles.badgeWarning}>
                    <Text style={styles.badgeWarningText}>{h.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubheading}>Target: {h.scope_id} ({h.scope_type})</Text>
                <Text style={styles.controlEvidence}>Reason: {h.reason}</Text>

                {h.status === 'ACTIVE' && (
                  <TouchableOpacity
                    onPress={async () => {
                      await releaseLegalHold(h.id, 'Investigation closed');
                      Alert.alert('Hold Released', `Legal hold #${h.id} released.`);
                    }}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Release Hold</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* SECTION 4: ACCESS & BREAK-GLASS */}
        {activeSection === 'ACCESS_PAM' && (
          <View style={styles.sectionBlock}>
            <View style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <KeyRound size={16} color="#F87171" />
                <Text style={[styles.cardHeading, { color: '#F87171' }]}>Emergency Break-Glass PAM Elevation</Text>
              </View>
              <Text style={styles.cardSubheading}>
                Grants temporary audited high-privilege access for disaster recovery or emergency incident overrides.
              </Text>
              <TextInput
                value={bgReason}
                onChangeText={setBgReason}
                placeholder="Operational justification (mandatory for audit)..."
                placeholderTextColor="#64748B"
                style={styles.inputField}
              />
              <TouchableOpacity onPress={handleRequestBreakGlass} style={styles.actionBtnRed}>
                <Text style={styles.actionBtnText}>Activate 2-Hour Elevation</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionMainTitle}>Break-Glass Audit Stream</Text>
            {breakGlassSessions.map((bg) => (
              <View key={bg.id} style={styles.controlItem}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeading}>{bg.user_email} • {bg.requested_role}</Text>
                  <Text style={styles.badgeSuccessText}>{bg.status}</Text>
                </View>
                <Text style={styles.controlDesc}>Justification: {bg.justification}</Text>
                <Text style={styles.controlEvidence}>Expires: {new Date(bg.expires_at).toLocaleTimeString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 5: VENDORS */}
        {activeSection === 'VENDORS' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionMainTitle}>Third-Party Data Processor Register</Text>
            {vendors.map((v) => (
              <View key={v.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeading}>{v.vendor_name} ({v.service_name})</Text>
                  <View style={styles.badgeSuccess}>
                    <Text style={styles.badgeSuccessText}>{v.security_review_status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubheading}>{v.purpose}</Text>
                <View style={styles.vendorMetaBox}>
                  <Text style={styles.metaLabel}>Data Shared: <Text style={styles.metaValueHighlight}>{v.data_shared.join(', ')}</Text></Text>
                  <Text style={styles.metaLabel}>Residency Region: <Text style={styles.metaValueHighlight}>{v.data_residency_region}</Text></Text>
                  <Text style={styles.metaLabel}>Cross-Border Transfer: <Text style={styles.metaValueHighlight}>{v.cross_border_transfer ? 'YES' : 'NO'}</Text></Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 6: DSR QUEUE */}
        {activeSection === 'DSR_QUEUE' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionMainTitle}>Pending Data Subject Requests (DSR)</Text>
            {dsrRequests.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeading}>#{r.id.slice(0, 8)} • {r.request_type}</Text>
                  <Text style={styles.badgeWarningText}>{r.status}</Text>
                </View>
                <Text style={styles.cardSubheading}>Subject: {r.subject_id}</Text>
                <Text style={styles.controlEvidence}>Scope: {r.scope.join(', ')}</Text>

                {r.status !== 'COMPLETED' && r.status !== 'REJECTED' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={async () => {
                        await reviewDsr(r.id, 'APPROVE');
                        Alert.alert('Approved', `Executed ${r.request_type} request #${r.id.slice(0, 8)}`);
                      }}
                      style={[styles.actionBtnTeal, { flex: 1 }]}
                    >
                      <Text style={styles.actionBtnText}>Approve & Execute</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        await reviewDsr(r.id, 'REJECT', 'Rejected by administrator');
                        Alert.alert('Rejected', `Rejected request #${r.id.slice(0, 8)}`);
                      }}
                      style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}
                    >
                      <Text style={styles.secondaryBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* SECTION 7: AUDITOR */}
        {activeSection === 'AUDITOR' && (
          <View style={styles.sectionBlock}>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Sanitized Compliance Evidence Export</Text>
              <Text style={styles.cardSubheading}>
                Generates a formal, machine-readable audit report containing framework control mappings, active retention policies, vendor DPA statuses, and hash-chained audit trails stripped of operational PII.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  const bundle = await fetchAuditorExport();
                  if (bundle) {
                    Alert.alert('Audit Package Ready', `Export generated. Total controls: ${Object.keys(bundle.framework_readiness).length} frameworks.`);
                  }
                }}
                style={styles.actionBtnTeal}
              >
                <Download size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Generate Auditor Package</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navScrollView: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  navButtonTextActive: {
    color: '#1D4ED8',
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  sectionBlock: {
    gap: 14,
    paddingBottom: 48,
  },
  frameworkChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  fwChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fwChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  fwChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  fwChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubheading: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0284C7',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
  },
  sectionSubTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  sectionMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  controlItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  controlItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  controlDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  controlEvidence: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccessText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  badgeWarning: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeWarningText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  actionBtnTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnAmber: {
    backgroundColor: '#D97706',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnRed: {
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  versionTag: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#64748B',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  statusBadgeTextActive: {
    color: '#1D4ED8',
  },
  metaRowDivided: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaValueHighlight: {
    color: '#0F172A',
    fontWeight: '700',
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 9,
    fontSize: 12,
    color: '#0F172A',
  },
  vendorMetaBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
});
