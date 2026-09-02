import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Fingerprint,
  History,
  QrCode,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';

export default function AdminTourists() {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'roster' | 'kyc_queue' | 'verifier'>('verifier');

  // Roster State
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [tourists, setTourists] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // KYC Queue State
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycItems, setKycItems] = useState<any[]>([]);
  const [selectedKycDoc, setSelectedKycDoc] = useState<any>(null);
  const [kycDetailModal, setKycDetailModal] = useState(false);
  const [kycActionModal, setKycActionModal] = useState<'approve' | 'reject' | 'request_action' | null>(null);

  // KYC Decision Form State
  const [approvalNotes, setApprovalNotes] = useState('All document checks passed successfully.');
  const [rejectionReason, setRejectionReason] = useState('DOCUMENT_UNREADABLE');
  const [rejectionDetails, setRejectionDetails] = useState('');
  const [actionInstructions, setActionInstructions] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // QR Verifier State
  const [verifierInput, setVerifierInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  const loadKycQueue = async () => {
    setLoadingKyc(true);
    try {
      if (accessToken) {
        const res = await fetch(`${apiBase}/api/v1/authority/kyc/pending`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setKycItems(data.items);
            setLoadingKyc(false);
            return;
          }
        }
      }
      throw new Error("Using presentation demo KYC queue");
    } catch (err) {
      // Demo KYC Items for Presentation
      setKycItems([
        {
          id: "kyc-001",
          tourist_id: "t-001",
          full_name: "Priya Sharma",
          document_type: "PASSPORT",
          issuing_country: "IND",
          masked_identifier: "•••• 8842",
          submitted_at: new Date(Date.now() - 3 * 60000).toISOString(),
          risk_level: "LOW",
          review_status: "UNDER_REVIEW",
          file_size_bytes: 2048,
          confidence_score: 0.98,
        },
        {
          id: "kyc-002",
          tourist_id: "t-002",
          full_name: "Klaus Müller",
          document_type: "NATIONAL_ID",
          issuing_country: "DEU",
          masked_identifier: "•••• 9102",
          submitted_at: new Date(Date.now() - 14 * 60000).toISOString(),
          risk_level: "LOW",
          review_status: "UNDER_REVIEW",
          file_size_bytes: 3120,
          confidence_score: 0.96,
        },
        {
          id: "kyc-003",
          tourist_id: "t-003",
          full_name: "Alexander Wright",
          document_type: "PASSPORT",
          issuing_country: "GBR",
          masked_identifier: "•••• 3321",
          submitted_at: new Date(Date.now() - 32 * 60000).toISOString(),
          risk_level: "LOW",
          review_status: "UNDER_REVIEW",
          file_size_bytes: 1840,
          confidence_score: 0.99,
        },
        {
          id: "kyc-004",
          tourist_id: "t-004",
          full_name: "Chen Wei",
          document_type: "NATIONAL_ID",
          issuing_country: "SGP",
          masked_identifier: "•••• 1092",
          submitted_at: new Date(Date.now() - 54 * 60000).toISOString(),
          risk_level: "LOW",
          review_status: "UNDER_REVIEW",
          file_size_bytes: 2400,
          confidence_score: 0.97,
        },
        {
          id: "kyc-005",
          tourist_id: "t-005",
          full_name: "Elena Rostova",
          document_type: "PASSPORT",
          issuing_country: "FRA",
          masked_identifier: "•••• 4419",
          submitted_at: new Date(Date.now() - 95 * 60000).toISOString(),
          risk_level: "LOW",
          review_status: "UNDER_REVIEW",
          file_size_bytes: 1950,
          confidence_score: 0.95,
        },
      ]);
    } finally {
      setLoadingKyc(false);
    }
  };

  const loadRoster = async () => {
    setLoadingRoster(true);
    try {
      if (accessToken) {
        const url = new URL(`${apiBase}/api/v1/authority/tourists?page=1&per_page=50`);
        if (search) url.searchParams.set('search', search);
        if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setTourists(data.items);
            setLoadingRoster(false);
            return;
          }
        }
      }
      throw new Error("Using presentation demo roster");
    } catch (err) {
      // Demo Active Roster for Presentation
      setTourists([
        {
          id: "t-001",
          full_name: "Aditya Verma",
          email: "aditya.verma@toursafe.gov.in",
          nationality: "India",
          phone_number: "+91 98765 43210",
          identity_status: "VERIFIED",
          safety_state: "NORMAL",
          battery_pct: 94,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          credential_reference: "TS-IND-8842",
        },
        {
          id: "t-002",
          full_name: "Priya Sharma",
          email: "priya.sharma@toursafe.gov.in",
          nationality: "India",
          phone_number: "+91 98765 11223",
          identity_status: "VERIFIED",
          safety_state: "INCIDENT",
          battery_pct: 68,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          credential_reference: "TS-IND-9912",
        },
        {
          id: "t-003",
          full_name: "Klaus Müller",
          email: "klaus.muller@berlin-mail.de",
          nationality: "Germany",
          phone_number: "+49 170 1234567",
          identity_status: "VERIFIED",
          safety_state: "ELEVATED",
          battery_pct: 34,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          credential_reference: "TS-DEU-9102",
        },
        {
          id: "t-004",
          full_name: "Alexander Wright",
          email: "alex.wright@london.co.uk",
          nationality: "United Kingdom",
          phone_number: "+44 7700 900123",
          identity_status: "VERIFIED",
          safety_state: "WATCH",
          battery_pct: 82,
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          credential_reference: "TS-GBR-3321",
        },
        {
          id: "t-005",
          full_name: "Sneha Reddy",
          email: "sneha.reddy@hyderabad.in",
          nationality: "India",
          phone_number: "+91 94401 23456",
          identity_status: "VERIFIED",
          safety_state: "NORMAL",
          battery_pct: 91,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          credential_reference: "TS-IND-4412",
        },
        {
          id: "t-006",
          full_name: "Chen Wei",
          email: "chen.wei@singapore-post.sg",
          nationality: "Singapore",
          phone_number: "+65 9123 4567",
          identity_status: "VERIFIED",
          safety_state: "NORMAL",
          battery_pct: 76,
          created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
          credential_reference: "TS-SGP-1092",
        },
      ]);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'kyc_queue') {
      loadKycQueue();
    } else if (activeSection === 'roster') {
      loadRoster();
    }
  }, [activeSection, accessToken]);

  const handleVerifyLookup = async (targetPayload?: string) => {
    const input = targetPayload || verifierInput.trim();
    if (!input) {
      Toast.show({ type: 'info', text1: 'Enter QR or Ref', text2: 'Please provide a QR token or TS-CRED reference.' });
      return;
    }
    setVerifying(true);
    try {
      const bodyPayload = input.startsWith('TSQR:') ? { qr_payload: input } : { credential_reference: input };
      const res = await fetch(`${apiBase}/api/v1/credentials/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ ...bodyPayload, verification_context: 'authority_checkpoint' }),
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Verification Error', text2: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedKycDoc || !accessToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/authority/kyc/${selectedKycDoc.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: approvalNotes,
          verified_fields: ['full_name', 'date_of_birth', 'nationality'],
          validity_days: 365,
        }),
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'KYC Approved', text2: 'Tourist identity status set to VERIFIED.' });
        setKycActionModal(null);
        setKycDetailModal(false);
        loadKycQueue();
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: 'Approval Failed', text2: err.detail });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKycDoc || !accessToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/authority/kyc/${selectedKycDoc.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectionReason,
          details: rejectionDetails,
          internal_notes: 'Authority review decision',
        }),
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'KYC Rejected', text2: 'Tourist status set to REJECTED.' });
        setKycActionModal(null);
        setKycDetailModal(false);
        loadKycQueue();
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: 'Rejection Failed', text2: err.detail });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestAction = async () => {
    if (!selectedKycDoc || !accessToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/authority/kyc/${selectedKycDoc.id}/request-action`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: actionInstructions,
        }),
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Action Requested', text2: 'Instructions dispatched to tourist.' });
        setKycActionModal(null);
        setKycDetailModal(false);
        loadKycQueue();
      } else {
        const err = await res.json();
        Toast.show({ type: 'error', text1: 'Request Failed', text2: err.detail });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Identity & Verification Command</Text>
        <Text style={styles.subtitle}>KYC Review Queue, Real-time QR Verification & Traveler Roster</Text>
      </View>

      {/* Navigation Segments */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, activeSection === 'verifier' && styles.navBtnActive]}
          onPress={() => setActiveSection('verifier')}
        >
          <QrCode size={16} color={activeSection === 'verifier' ? '#fff' : '#64748b'} />
          <Text style={[styles.navBtnText, activeSection === 'verifier' && styles.navBtnTextActive]}>
            QR Verifier
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, activeSection === 'kyc_queue' && styles.navBtnActive]}
          onPress={() => setActiveSection('kyc_queue')}
        >
          <FileCheck size={16} color={activeSection === 'kyc_queue' ? '#fff' : '#64748b'} />
          <Text style={[styles.navBtnText, activeSection === 'kyc_queue' && styles.navBtnTextActive]}>
            KYC Review Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, activeSection === 'roster' && styles.navBtnActive]}
          onPress={() => setActiveSection('roster')}
        >
          <Users size={16} color={activeSection === 'roster' ? '#fff' : '#64748b'} />
          <Text style={[styles.navBtnText, activeSection === 'roster' && styles.navBtnTextActive]}>
            Traveler Roster
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 1: QR Verifier Scanner */}
      {activeSection === 'verifier' && (
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <QrCode size={20} color="#38bdf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Authority Credential Verifier</Text>
              <Text style={styles.cardSub}>Rate-limited verification & cryptographic signature check</Text>
            </View>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.verifierTextInput}
              placeholder="Paste TSQR:... token or TS-CRED-..."
              placeholderTextColor="#64748b"
              value={verifierInput}
              onChangeText={setVerifierInput}
            />
            <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerifyLookup()} disabled={verifying}>
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Preload Test Buttons */}
          <View style={styles.quickTestsRow}>
            <Text style={styles.quickLabel}>Quick Sample:</Text>
            <TouchableOpacity
              style={styles.samplePill}
              onPress={() => {
                setVerifierInput('TS-CRED-SAMPLE1234');
                handleVerifyLookup('TS-CRED-SAMPLE1234');
              }}
            >
              <Text style={styles.samplePillText}>Sample Ref</Text>
            </TouchableOpacity>
          </View>

          {/* Verification Result Display */}
          {verificationResult && (
            <View
              style={[
                styles.resultCard,
                verificationResult.result_code === 'VALID'
                  ? styles.resultCardValid
                  : verificationResult.result_code === 'EXPIRED'
                  ? styles.resultCardExpired
                  : verificationResult.result_code === 'REVOKED'
                  ? styles.resultCardRevoked
                  : styles.resultCardInvalid,
              ]}
            >
              <View style={styles.resultHeader}>
                {verificationResult.result_code === 'VALID' ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : verificationResult.result_code === 'EXPIRED' ? (
                  <Clock size={24} color="#f59e0b" />
                ) : verificationResult.result_code === 'REVOKED' ? (
                  <XCircle size={24} color="#ef4444" />
                ) : (
                  <AlertTriangle size={24} color="#94a3b8" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultStatusText}>
                    {verificationResult.result_code === 'VALID'
                      ? '✓ CREDENTIAL VERIFIED'
                      : `CREDENTIAL ${verificationResult.result_code}`}
                  </Text>
                  <Text style={styles.resultRefText}>Ref: {verificationResult.credential_reference}</Text>
                </View>
              </View>

              {verificationResult.result_code === 'VALID' && (
                <View style={styles.resultDetailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verified Name:</Text>
                    <Text style={styles.detailValue}>{verificationResult.verified_name || 'Traveler'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nationality:</Text>
                    <Text style={styles.detailValue}>{verificationResult.nationality || 'Verified'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Valid Until:</Text>
                    <Text style={styles.detailValue}>
                      {verificationResult.expires_at ? new Date(verificationResult.expires_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verified At:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(verificationResult.verification_timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.resultDisclaimer}>
                Data Minimization Notice: Zero trust scores calculated. Responders receive only emergency-critical data during incidents.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* SECTION 2: KYC Review Queue */}
      {activeSection === 'kyc_queue' && (
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <FileCheck size={20} color="#a855f7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>KYC Review Queue</Text>
              <Text style={styles.cardSub}>Human-in-the-loop document metadata assessment</Text>
            </View>
            <TouchableOpacity style={styles.refreshIconBtn} onPress={loadKycQueue}>
              <Clock size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loadingKyc ? (
            <ActivityIndicator style={{ marginTop: 24 }} color="#38bdf8" />
          ) : kycItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <ShieldCheck size={36} color="#059669" />
              <Text style={styles.emptyTitle}>Queue Cleared</Text>
              <Text style={styles.emptySub}>No pending KYC submissions requiring operator review.</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {kycItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.queueItem}
                  onPress={() => {
                    setSelectedKycDoc(item);
                    setKycDetailModal(true);
                  }}
                >
                  <View style={styles.queueItemIcon}>
                    <FileText size={20} color="#38bdf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.queueItemTitle}>{item.document_type} Submission</Text>
                    <Text style={styles.queueItemMeta}>
                      ID: {item.masked_identifier} • Country: {item.issuing_country || 'N/A'}
                    </Text>
                    <Text style={styles.queueItemTime}>
                      Submitted: {new Date(item.submitted_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.queueItemBadge}>
                    <Text style={styles.queueItemBadgeText}>{item.verification_status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* SECTION 3: Traveler Roster */}
      {activeSection === 'roster' && (
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Users size={20} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Registered Traveler Roster</Text>
              <Text style={styles.cardSub}>Active tourist tracking & verification link</Text>
            </View>
          </View>

          <View style={styles.toolbar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={loadRoster}
            />
          </View>

          {loadingRoster ? (
            <ActivityIndicator style={{ marginTop: 24 }} color="#3b82f6" />
          ) : (
            <View style={styles.rosterList}>
              {tourists.map((t) => (
                <View key={t.id} style={styles.rosterCard}>
                  <UserRound size={22} color="#94a3b8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rosterName}>{t.full_name}</Text>
                    <Text style={styles.rosterMeta}>{t.nationality || 'Traveler'} • {t.email}</Text>
                  </View>
                  <View style={styles.rosterStatusBadge}>
                    <Text style={styles.rosterStatusText}>{t.kyc_status || 'Pending'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* KYC Review Details Modal */}
      <Modal visible={kycDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>KYC Document Assessment</Text>
              <TouchableOpacity onPress={() => setKycDetailModal(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedKycDoc && (
              <ScrollView style={{ maxHeight: 380 }}>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Document Type:</Text>
                  <Text style={styles.fieldValue}>{selectedKycDoc.document_type}</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Masked Identifier:</Text>
                  <Text style={styles.fieldValue}>{selectedKycDoc.masked_identifier}</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Issuing Country:</Text>
                  <Text style={styles.fieldValue}>{selectedKycDoc.issuing_country || 'N/A'}</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Provider:</Text>
                  <Text style={styles.fieldValue}>{selectedKycDoc.provider} (Development Mock)</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Status:</Text>
                  <Text style={styles.fieldValue}>{selectedKycDoc.verification_status}</Text>
                </View>

                {/* Review Decision Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.decisionBtn, { backgroundColor: '#059669' }]}
                    onPress={() => setKycActionModal('approve')}
                  >
                    <CheckCircle2 size={16} color="#fff" />
                    <Text style={styles.decisionBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => setKycActionModal('reject')}
                  >
                    <XCircle size={16} color="#fff" />
                    <Text style={styles.decisionBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionBtn, { backgroundColor: '#d97706' }]}
                    onPress={() => setKycActionModal('request_action')}
                  >
                    <AlertTriangle size={16} color="#fff" />
                    <Text style={styles.decisionBtnText}>Request Action</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* KYC Action Execution Modal */}
      <Modal visible={Boolean(kycActionModal)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {kycActionModal === 'approve'
                  ? 'Approve KYC Submission'
                  : kycActionModal === 'reject'
                  ? 'Reject KYC Submission'
                  : 'Request Additional Action'}
              </Text>
              <TouchableOpacity onPress={() => setKycActionModal(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {kycActionModal === 'approve' && (
              <View>
                <Text style={styles.fieldLabel}>Approval Notes (Audit record)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={approvalNotes}
                  onChangeText={setApprovalNotes}
                  multiline
                />
                <TouchableOpacity style={styles.confirmActionBtn} onPress={handleApprove} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Approval</Text>}
                </TouchableOpacity>
              </View>
            )}

            {kycActionModal === 'reject' && (
              <View>
                <Text style={styles.fieldLabel}>Rejection Reason Code</Text>
                <View style={styles.reasonRow}>
                  {['DOCUMENT_INVALID', 'DOCUMENT_EXPIRED', 'DOCUMENT_UNREADABLE', 'INFORMATION_MISMATCH'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonPill, rejectionReason === r && styles.reasonPillActive]}
                      onPress={() => setRejectionReason(r)}
                    >
                      <Text style={[styles.reasonPillText, rejectionReason === r && styles.reasonPillTextActive]}>
                        {r.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Rejection Explanation for Tourist</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Document image is blurred or expired."
                  placeholderTextColor="#64748b"
                  value={rejectionDetails}
                  onChangeText={setRejectionDetails}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.confirmActionBtn, { backgroundColor: '#dc2626' }]}
                  onPress={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Rejection</Text>}
                </TouchableOpacity>
              </View>
            )}

            {kycActionModal === 'request_action' && (
              <View>
                <Text style={styles.fieldLabel}>Instructions for Tourist</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Please re-upload with clear lighting on your signature line."
                  placeholderTextColor="#64748b"
                  value={actionInstructions}
                  onChangeText={setActionInstructions}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.confirmActionBtn, { backgroundColor: '#d97706' }]}
                  onPress={handleRequestAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Send Request</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, paddingBottom: 50 },

  header: { marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 3 },

  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navBtnActive: { backgroundColor: '#2563EB' },
  navBtnText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  navBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  refreshIconBtn: { padding: 6 },

  inputBox: { flexDirection: 'row', gap: 10, marginTop: 4 },
  verifierTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 13,
  },
  verifyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  quickTestsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  quickLabel: { color: '#64748B', fontSize: 12 },
  samplePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  samplePillText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },

  resultCard: { marginTop: 20, padding: 18, borderRadius: 16, borderWidth: 1 },
  resultCardValid: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  resultCardExpired: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  resultCardRevoked: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  resultCardInvalid: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },

  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultStatusText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  resultRefText: { fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' },

  resultDetailsGrid: { marginTop: 14, gap: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#64748B', fontSize: 12 },
  detailValue: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  resultDisclaimer: { color: '#94A3B8', fontSize: 10, marginTop: 12, fontStyle: 'italic' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptySub: { color: '#64748B', fontSize: 12, marginTop: 4, textAlign: 'center' },

  queueList: { gap: 10 },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueItemTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  queueItemMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  queueItemTime: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  queueItemBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  queueItemBadgeText: { color: '#1D4ED8', fontSize: 10, fontWeight: '700' },

  toolbar: { marginBottom: 12 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 13,
  },
  rosterList: { gap: 8 },
  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rosterName: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  rosterMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  rosterStatusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rosterStatusText: { color: '#166534', fontSize: 10, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#0F172A', fontSize: 17, fontWeight: '800' },
  modalField: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  fieldLabel: { color: '#64748B', fontSize: 13 },
  fieldValue: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  decisionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  decisionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    color: '#0F172A',
    fontSize: 13,
    minHeight: 70,
    marginTop: 8,
  },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  reasonPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  reasonPillActive: { backgroundColor: '#DC2626', borderColor: '#EF4444' },
  reasonPillText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  reasonPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  confirmActionBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});