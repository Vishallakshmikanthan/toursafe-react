import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  ShieldCheck,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Lock,
} from 'lucide-react-native';
import { usePrivacyStore } from '../../store/privacyStore';
import { ConsentPurpose, PrivacyRequestType } from '../../types/privacy';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PURPOSES_CONFIG: Array<{
  id: ConsentPurpose;
  title: string;
  category: string;
  description: string;
  retention: string;
  access: string;
  requiredForSafety: boolean;
}> = [
  {
    id: 'LOCATION_TRACKING',
    title: 'Real-Time Location Tracking',
    category: 'Operational Safety',
    description: 'Enables safety zone geofencing, hazard perimeter alerts, and immediate responder dispatch during emergencies.',
    retention: '90 days (730 days if incident-linked)',
    access: 'Authorized Dispatcher, Assigned Field Responders (within 500m / mission)',
    requiredForSafety: true,
  },
  {
    id: 'TELEMETRY_PROCESSING',
    title: 'IMU Sensor Telemetry & Anomaly Inference',
    category: 'Safety Intelligence',
    description: 'Samples 50Hz accelerometer and gyroscope motion vectors to infer falls, collisions, and sudden impact events.',
    retention: '30 days raw / 180 days anomaly events',
    access: 'Automated ML Inference Engine only (no human surveillance)',
    requiredForSafety: false,
  },
  {
    id: 'KYC_VERIFICATION',
    title: 'Digital Tourist Credential (KYC)',
    category: 'Identity & Access',
    description: 'Cryptographically verifies identity documents for issuing verifiable TSQR tourist credentials.',
    retention: '365 days post-departure',
    access: 'Verified Authority KYC reviewers & QR gate scanners',
    requiredForSafety: false,
  },
  {
    id: 'EMERGENCY_COMMUNICATION',
    title: 'Emergency Contact & SMS Notifications',
    category: 'Emergency Dispatch',
    description: 'Enables automated SMS and voice broadcast to designated emergency contacts during SOS escalations.',
    retention: 'Duration of active trip',
    access: 'Automated notification gateway & emergency dispatchers',
    requiredForSafety: true,
  },
];

export function PrivacyConsentCenterModal({ visible, onClose }: Props) {
  const {
    consents,
    requests,
    isLoading,
    fetchConsents,
    grantConsent,
    withdrawConsent,
    fetchRequests,
    submitRequest,
    verifyRequest,
  } = usePrivacyStore();

  const [activeTab, setActiveTab] = useState<'CONSENTS' | 'REQUESTS' | 'EXPORTS'>('CONSENTS');
  const [selectedReqType, setSelectedReqType] = useState<PrivacyRequestType>('ACCESS');
  const [reqNotes, setReqNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchConsents();
      fetchRequests();
    }
  }, [visible]);

  const isConsentGranted = (purpose: ConsentPurpose): boolean => {
    const c = consents.find((x) => x.purpose === purpose);
    return c ? c.status === 'GRANTED' : false;
  };

  const handleToggleConsent = async (purpose: ConsentPurpose, currentGranted: boolean) => {
    try {
      if (currentGranted) {
        await withdrawConsent(purpose, 'Revoked in privacy center');
      } else {
        await grantConsent(purpose);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update consent preference.');
    }
  };

  const handleCreateRequest = async () => {
    setSubmitting(true);
    const req = await submitRequest(selectedReqType, [], reqNotes);
    setSubmitting(false);
    if (req) {
      Alert.alert('Request Submitted', `Your privacy request #${req.id.slice(0, 8)} has been logged. Please complete identity verification.`);
      setReqNotes('');
    } else {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <ShieldCheck size={22} color="#0D7680" />
              </View>
              <View>
                <Text style={styles.title}>Privacy & Consent Center</Text>
                <Text style={styles.subtitle}>DPDP Act 2023 / GDPR Sovereign Privacy Management</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close privacy center">
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {(['CONSENTS', 'REQUESTS', 'EXPORTS'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'CONSENTS' ? 'Data Consents' : tab === 'REQUESTS' ? 'Privacy Requests' : 'Data Portability'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {activeTab === 'CONSENTS' && (
              <View style={styles.contentBlock}>
                <View style={styles.infoBanner}>
                  <Info size={14} color="#93C5FD" />
                  <Text style={styles.infoBannerText}>
                    Privacy by Design: TourSafe collects data solely for verified safety & rescue operations. You have the right to modify optional permissions anytime.
                  </Text>
                </View>

                {PURPOSES_CONFIG.map((p) => {
                  const granted = isConsentGranted(p.id);
                  return (
                    <View key={p.id} style={styles.consentCard}>
                      <View style={styles.consentCardTop}>
                        <View style={styles.consentCardLeft}>
                          <View style={styles.consentTitleRow}>
                            <Text style={styles.consentTitle}>{p.title}</Text>
                            {p.requiredForSafety && (
                              <View style={styles.safetyTag}>
                                <Text style={styles.safetyTagText}>Safety Core</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.consentDesc}>{p.description}</Text>
                        </View>
                        <Switch
                          value={granted}
                          onValueChange={() => handleToggleConsent(p.id, granted)}
                          trackColor={{ false: '#334155', true: '#0D7680' }}
                          thumbColor={granted ? '#2DD4BF' : '#94A3B8'}
                        />
                      </View>

                      <View style={styles.consentMeta}>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Retention:</Text>
                          <Text style={styles.metaValue}>{p.retention}</Text>
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>Authorized Access:</Text>
                          <Text style={styles.metaValue}>{p.access}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'REQUESTS' && (
              <View style={styles.contentBlock}>
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>Submit Data Subject Request (DSR)</Text>
                  <Text style={styles.formCardSubtitle}>
                    Exercise statutory rights under the DPDP Act 2023 to access, export, correct, or erase your records.
                  </Text>

                  <Text style={styles.fieldLabel}>Request Type:</Text>
                  <View style={styles.pillRow}>
                    {(['ACCESS', 'EXPORT', 'CORRECTION', 'DELETION'] as PrivacyRequestType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setSelectedReqType(type)}
                        style={[styles.pill, selectedReqType === type && styles.pillActive]}
                      >
                        <Text style={[styles.pillText, selectedReqType === type && styles.pillTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Details / Scope Notes (Optional):</Text>
                  <TextInput
                    value={reqNotes}
                    onChangeText={setReqNotes}
                    placeholder="Specify details, date range, or reason..."
                    placeholderTextColor="#64748B"
                    style={styles.input}
                    multiline
                    numberOfLines={2}
                  />

                  <TouchableOpacity
                    onPress={handleCreateRequest}
                    disabled={submitting}
                    style={styles.submitBtn}
                    accessibilityRole="button"
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Privacy Request</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Existing Requests */}
                <Text style={styles.historyHeading}>Request History</Text>
                {requests.length === 0 ? (
                  <Text style={styles.emptyHistory}>No privacy requests logged yet.</Text>
                ) : (
                  requests.map((r) => (
                    <View key={r.id} style={styles.requestItem}>
                      <View style={styles.requestItemHeader}>
                        <Text style={styles.requestId}>
                          #{r.id.slice(0, 8)} • {r.request_type}
                        </Text>
                        <View
                          style={[
                            styles.requestBadge,
                            r.status === 'COMPLETED'
                              ? styles.badgeSuccess
                              : r.status === 'REJECTED'
                              ? styles.badgeDanger
                              : styles.badgeWarning,
                          ]}
                        >
                          <Text style={styles.requestBadgeText}>{r.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.requestDate}>
                        Submitted: {new Date(r.created_at).toLocaleDateString()} • Deadline: {new Date(r.deadline_at).toLocaleDateString()}
                      </Text>

                      {!r.identity_verified && r.status === 'SUBMITTED' && (
                        <TouchableOpacity
                          onPress={async () => {
                            await verifyRequest(r.id);
                            Alert.alert('Verified', 'Session identity verification confirmed.');
                          }}
                          style={styles.verifyBtn}
                        >
                          <Text style={styles.verifyBtnText}>Verify Identity with Session</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'EXPORTS' && (
              <View style={styles.contentBlock}>
                <View style={styles.formCard}>
                  <Text style={styles.formCardTitle}>Portable Data Export Bundle</Text>
                  <Text style={styles.formCardSubtitle}>
                    Generate a machine-readable JSON package containing all location telemetry, itineraries, verified KYC metadata, and audit events.
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedReqType('EXPORT');
                      setActiveTab('REQUESTS');
                    }}
                    style={styles.exportTokenBtn}
                  >
                    <Download size={15} color="#0D7680" />
                    <Text style={styles.exportTokenText}>Generate New Export Token</Text>
                  </TouchableOpacity>
                </View>

                {requests.filter((r) => r.export_token).map((r) => (
                  <View key={r.id} style={styles.exportReadyCard}>
                    <View style={styles.requestItemHeader}>
                      <Text style={styles.exportReadyTitle}>Export Ready ({r.id.slice(0, 8)})</Text>
                      <Text style={styles.exportExpiry}>Expires in 24h</Text>
                    </View>
                    <Text style={styles.exportTokenLine}>Token: {r.export_token}</Text>
                    <Text style={styles.exportEndpointLine}>Endpoint: /api/v1/privacy/export/{r.export_token}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  scrollArea: {
    marginTop: 16,
  },
  contentBlock: {
    gap: 14,
    paddingBottom: 36,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    borderRadius: 12,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
  },
  consentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  consentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  consentCardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  safetyTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  safetyTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  consentDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  consentMeta: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  formCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pillActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  pillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  emptyHistory: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  requestItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  requestItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  badgeDanger: {
    backgroundColor: '#FEF2F2',
  },
  badgeWarning: {
    backgroundColor: '#FFFBEB',
  },
  requestBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  requestDate: {
    fontSize: 10,
    color: '#64748B',
  },
  verifyBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  verifyBtnText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  exportTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportTokenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  exportReadyCard: {
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  exportReadyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  exportExpiry: {
    fontSize: 10,
    color: '#64748B',
  },
  exportTokenLine: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'monospace',
  },
  exportEndpointLine: {
    fontSize: 10,
    color: '#64748B',
  },
});
