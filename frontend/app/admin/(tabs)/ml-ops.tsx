import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  GitBranch,
  Database,
  Play,
  Shield,
  Layers,
  TrendingUp,
  Activity,
  Check,
  X,
} from 'lucide-react-native';
import { api } from '@/lib/api';

interface ModelRegistryEntry {
  model_id: string;
  model_version: string;
  model_name: string;
  architecture_version: string;
  feature_version: string;
  dataset_version: string;
  status: string;
  created_at: string;
  created_by: string;
  is_production: boolean;
  is_shadow: boolean;
  is_staging: boolean;
  metrics: {
    roc_auc?: number;
    pr_auc?: number;
    f1_score?: number;
    precision?: number;
    recall?: number;
    mean_inference_latency_ms?: number;
    p99_reconstruction_error?: number;
    has_ground_truth?: boolean;
  };
  threshold_config: {
    primary_threshold: number;
    warning_threshold: number;
    critical_threshold: number;
    calibration_method: string;
  };
}

interface DatasetEntry {
  dataset_version: string;
  description: string;
  feature_version: string;
  status: string;
  total_raw_records: number;
  total_windows: number;
  created_at: string;
  quality_report: {
    valid_samples_count: number;
    total_samples_inspected: number;
    mean_sampling_rate_hz: number;
    passed_validation: boolean;
  };
}

interface DriftReport {
  overall_drift_status: string;
  max_psi_score: number;
  feature_drifts: Array<{
    feature_name: string;
    psi_score: number;
    status: string;
    current_mean: number;
    training_mean: number;
  }>;
  concept_drift_status: string;
  retraining_recommended: boolean;
  retraining_reason?: string;
}

export default function MLOpsDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'models' | 'datasets' | 'training' | 'drift'>('models');
  const [loading, setLoading] = useState<boolean>(true);
  const [models, setModels] = useState<ModelRegistryEntry[]>([]);
  const [datasets, setDatasets] = useState<DatasetEntry[]>([]);
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [shadowMetrics, setShadowMetrics] = useState<any>(null);

  // Modals
  const [selectedModel, setSelectedModel] = useState<ModelRegistryEntry | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'approve' | 'deploy' | 'stage' | 'shadow' | 'rollback'>('approve');
  const [actionReason, setActionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchMLData = async () => {
    setLoading(true);
    try {
      const [modelsRes, datasetsRes, driftRes, shadowRes] = await Promise.allSettled([
        api.get<ModelRegistryEntry[]>('/api/v1/ml/models'),
        api.get<DatasetEntry[]>('/api/v1/ml/datasets'),
        api.get<DriftReport>('/api/v1/ml/drift'),
        api.get<any>('/api/v1/ml/shadow/metrics'),
      ]);

      if (modelsRes.status === 'fulfilled' && Array.isArray(modelsRes.value?.data) && modelsRes.value.data.length > 0) {
        setModels(modelsRes.value.data);
      } else {
        setModels([
          {
            model_id: 'mdl-001',
            model_name: 'toursafe-imu-kinematics-autoencoder',
            model_version: 'v2.4.1',
            architecture_version: 'PYTORCH_AUTOENCODER_V2',
            feature_version: 'feat-imu-50hz-v2',
            dataset_version: 'ds-kodai-kinematics-2024-q2',
            status: 'PRODUCTION',
            is_production: true,
            is_staging: false,
            is_shadow: false,
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            created_by: 'MLOps Lead Engineer',
            metrics: {
              f1_score: 0.962,
              precision: 0.984,
              recall: 0.962,
              roc_auc: 0.991,
              mean_inference_latency_ms: 12.4,
              p99_reconstruction_error: 0.042,
              has_ground_truth: true,
            },
            threshold_config: {
              primary_threshold: 0.65,
              warning_threshold: 0.45,
              critical_threshold: 0.85,
              calibration_method: 'PERCENTILE_99_CALIBRATED',
            },
          },
          {
            model_id: 'mdl-002',
            model_name: 'toursafe-geofence-breach-predictor',
            model_version: 'v1.8.0',
            architecture_version: 'XGBOOST_SPATIAL_V1',
            feature_version: 'feat-spatial-v1',
            dataset_version: 'ds-spatial-anomalies-2024-q1',
            status: 'STAGING',
            is_production: false,
            is_staging: true,
            is_shadow: false,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            created_by: 'Spatial ML Research',
            metrics: {
              f1_score: 0.948,
              precision: 0.971,
              recall: 0.948,
              roc_auc: 0.985,
              mean_inference_latency_ms: 8.2,
              has_ground_truth: true,
            },
            threshold_config: {
              primary_threshold: 0.70,
              warning_threshold: 0.50,
              critical_threshold: 0.90,
              calibration_method: 'ISOTONIC_REGRESSION',
            },
          },
          {
            model_id: 'mdl-003',
            model_name: 'toursafe-crowd-density-lstm',
            model_version: 'v1.2.0',
            architecture_version: 'LSTM_TIME_SERIES_V1',
            feature_version: 'feat-density-hourly',
            dataset_version: 'ds-spatial-anomalies-2024-q1',
            status: 'SHADOW',
            is_production: false,
            is_staging: false,
            is_shadow: true,
            created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
            created_by: 'Telemetry AI Squad',
            metrics: {
              f1_score: 0.952,
              precision: 0.960,
              recall: 0.952,
              mean_inference_latency_ms: 18.6,
              has_ground_truth: true,
            },
            threshold_config: {
              primary_threshold: 0.60,
              warning_threshold: 0.40,
              critical_threshold: 0.80,
              calibration_method: 'SIGMOID_NORM',
            },
          },
        ]);
      }

      if (datasetsRes.status === 'fulfilled' && Array.isArray(datasetsRes.value?.data) && datasetsRes.value.data.length > 0) {
        setDatasets(datasetsRes.value.data);
      } else {
        setDatasets([
          {
            dataset_version: 'ds-kodai-kinematics-2024-q2',
            description: '50Hz tri-axial accelerometer & gyroscope annotated falls, trips, and safe walks across Kodaikanal trails.',
            feature_version: 'feat-imu-50hz-v2',
            status: 'VALIDATED_GOLD',
            total_raw_records: 1485000,
            total_windows: 29700,
            created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
            quality_report: {
              valid_samples_count: 1484200,
              total_samples_inspected: 1485000,
              mean_sampling_rate_hz: 49.98,
              passed_validation: true,
            },
          },
          {
            dataset_version: 'ds-spatial-anomalies-2024-q1',
            description: 'GPS breadcrumb trails and perimeter breaches around Guna Caves, Dolphin\'s Nose and Pillar Rocks.',
            feature_version: 'feat-spatial-v1',
            status: 'VALIDATED_GOLD',
            total_raw_records: 820000,
            total_windows: 16400,
            created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
            quality_report: {
              valid_samples_count: 819800,
              total_samples_inspected: 820000,
              mean_sampling_rate_hz: 1.0,
              passed_validation: true,
            },
          },
        ]);
      }

      if (driftRes.status === 'fulfilled' && driftRes.value?.data) {
        setDriftReport(driftRes.value.data);
      } else {
        setDriftReport({
          overall_drift_status: 'HEALTHY_LOW_DRIFT',
          max_psi_score: 0.048,
          concept_drift_status: 'STABLE',
          retraining_recommended: false,
          feature_drifts: [
            { feature_name: 'accel_magnitude_std', psi_score: 0.024, status: 'NO_DRIFT', current_mean: 1.02, training_mean: 1.00 },
            { feature_name: 'gyro_spectral_energy', psi_score: 0.048, status: 'SLIGHT_VARIATION', current_mean: 0.88, training_mean: 0.85 },
            { feature_name: 'elevation_gradient_delta', psi_score: 0.012, status: 'NO_DRIFT', current_mean: 14.2, training_mean: 14.0 },
            { feature_name: 'geofence_distance_m', psi_score: 0.031, status: 'NO_DRIFT', current_mean: 420.0, training_mean: 435.0 },
          ],
        });
      }

      if (shadowRes.status === 'fulfilled' && shadowRes.value?.data) {
        setShadowMetrics(shadowRes.value.data);
      } else {
        setShadowMetrics({
          shadow_model_version: 'v2.5.0-rc1',
          production_model_version: 'v2.4.1',
          agreement_rate_pct: 98.9,
          shadow_p99_latency_ms: 10.8,
          production_p99_latency_ms: 12.4,
          evaluated_samples_count: 14200,
        });
      }
    } catch (e) {
      console.warn('Using fallback ML Ops demo datasets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLData();
  }, []);

  const handleActionSubmit = async () => {
    if (!selectedModel || !actionReason.trim()) {
      Alert.alert('Required Field', 'Please provide a clear justification / reason.');
      return;
    }

    setSubmitting(true);
    try {
      const version = selectedModel.model_version;
      if (actionType === 'approve') {
        await api.post(`/api/v1/ml/models/${version}/approve`, { reason: actionReason });
        Alert.alert('Model Approved', `Model ${version} has been approved for operational deployment.`);
      } else if (actionType === 'deploy') {
        await api.post(`/api/v1/ml/models/${version}/deploy`, { reason: actionReason, target_status: 'PRODUCTION' });
        Alert.alert('Deployed to Production', `Model ${version} is now the active authoritative production model.`);
      } else if (actionType === 'stage') {
        await api.post(`/api/v1/ml/models/${version}/stage`, { reason: actionReason, target_status: 'STAGING' });
        Alert.alert('Staged', `Model ${version} has been moved to staging.`);
      } else if (actionType === 'shadow') {
        await api.post(`/api/v1/ml/models/${version}/shadow`, { reason: actionReason, target_status: 'SHADOW' });
        Alert.alert('Shadow Mode Active', `Candidate model ${version} is now shadowing live production telemetry.`);
      } else if (actionType === 'rollback') {
        await api.post(`/api/v1/ml/models/${version}/rollback`, { reason: actionReason });
        Alert.alert('Rollback Executed', `Production has been rolled back to ${version}.`);
      }
      setActionModalVisible(false);
      setActionReason('');
      fetchMLData();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || 'Operation failed';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const productionModel = models.find((m) => m.is_production) || models[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleRow}>
            <Cpu size={24} color="#38bdf8" />
            <Text style={styles.headerTitle}>ML Lifecycle & Governance</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Authoritative Model Registry, Telemetry Datasets, Canary/Shadow & Drift Operations
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchMLData} disabled={loading}>
          <RefreshCw size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Production Banner */}
      {productionModel && (
        <View style={styles.prodBanner}>
          <View style={styles.prodHeader}>
            <View style={styles.badgeProd}>
              <Text style={styles.badgeProdText}>ACTIVE PRODUCTION MODEL</Text>
            </View>
            <Text style={styles.prodVersion}>{productionModel.model_version}</Text>
          </View>
          <View style={styles.prodMetricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Threshold (Primary)</Text>
              <Text style={styles.metricVal}>{productionModel.threshold_config.primary_threshold.toFixed(4)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ROC-AUC</Text>
              <Text style={styles.metricVal}>
                {productionModel.metrics.roc_auc !== undefined ? productionModel.metrics.roc_auc.toFixed(4) : 'N/A'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Latency (Mean)</Text>
              <Text style={styles.metricVal}>
                {productionModel.metrics.mean_inference_latency_ms
                  ? `${productionModel.metrics.mean_inference_latency_ms.toFixed(2)} ms`
                  : '< 1.0 ms'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Dataset Lineage</Text>
              <Text style={styles.metricVal}>{productionModel.dataset_version}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'models' && styles.tabButtonActive]}
          onPress={() => setActiveTab('models')}
        >
          <GitBranch size={16} color={activeTab === 'models' ? '#38bdf8' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'models' && styles.tabTextActive]}>Model Registry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drift' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drift')}
        >
          <Activity size={16} color={activeTab === 'drift' ? '#38bdf8' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'drift' && styles.tabTextActive]}>Drift & Shadow</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'datasets' && styles.tabButtonActive]}
          onPress={() => setActiveTab('datasets')}
        >
          <Database size={16} color={activeTab === 'datasets' ? '#38bdf8' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'datasets' && styles.tabTextActive]}>Datasets</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Fetching ML Governance metadata...</Text>
        </View>
      ) : (
        <>
          {/* TAB 1: MODEL REGISTRY */}
          {activeTab === 'models' && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>Registered Model Versions ({models.length})</Text>
              {models.map((mod) => {
                const isProd = mod.is_production;
                return (
                  <View key={mod.model_version} style={[styles.modelCard, isProd && styles.modelCardProd]}>
                    <View style={styles.modelCardHeader}>
                      <View>
                        <Text style={styles.modelVersionText}>{mod.model_version}</Text>
                        <Text style={styles.modelMetaText}>
                          Dataset: {mod.dataset_version} | Created: {new Date(mod.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, getStatusStyle(mod.status)]}>
                        <Text style={styles.statusBadgeText}>{mod.status}</Text>
                      </View>
                    </View>

                    {/* Metrics Row */}
                    <View style={styles.modelMetricsRow}>
                      <Text style={styles.miniMetric}>
                        F1: <Text style={styles.miniMetricVal}>{mod.metrics.f1_score?.toFixed(3) ?? 'N/A'}</Text>
                      </Text>
                      <Text style={styles.miniMetric}>
                        Threshold: <Text style={styles.miniMetricVal}>{mod.threshold_config.primary_threshold.toFixed(2)}</Text>
                      </Text>
                      <Text style={styles.miniMetric}>
                        Feature: <Text style={styles.miniMetricVal}>{mod.feature_version}</Text>
                      </Text>
                    </View>

                    {/* Action Controls */}
                    <View style={styles.modelActionsRow}>
                      {mod.status === 'VALIDATED' && (
                        <TouchableOpacity
                          style={[styles.btnAction, styles.btnApprove]}
                          onPress={() => {
                            setSelectedModel(mod);
                            setActionType('approve');
                            setActionModalVisible(true);
                          }}
                        >
                          <CheckCircle2 size={14} color="#fff" />
                          <Text style={styles.btnActionText}>Approve</Text>
                        </TouchableOpacity>
                      )}

                      {mod.status === 'APPROVED' && (
                        <>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnShadow]}
                            onPress={() => {
                              setSelectedModel(mod);
                              setActionType('shadow');
                              setActionModalVisible(true);
                            }}
                          >
                            <Layers size={14} color="#fff" />
                            <Text style={styles.btnActionText}>Shadow Mode</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnDeploy]}
                            onPress={() => {
                              setSelectedModel(mod);
                              setActionType('deploy');
                              setActionModalVisible(true);
                            }}
                          >
                            <Play size={14} color="#fff" />
                            <Text style={styles.btnActionText}>Deploy to Production</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {mod.status === 'ROLLED_BACK' && (
                        <TouchableOpacity
                          style={[styles.btnAction, styles.btnRollback]}
                          onPress={() => {
                            setSelectedModel(mod);
                            setActionType('rollback');
                            setActionModalVisible(true);
                          }}
                        >
                          <RotateCcw size={14} color="#fff" />
                          <Text style={styles.btnActionText}>Re-activate</Text>
                        </TouchableOpacity>
                      )}

                      {!isProd && mod.status !== 'ROLLED_BACK' && mod.status !== 'TRAINED' && (
                        <TouchableOpacity
                          style={[styles.btnAction, styles.btnRollback]}
                          onPress={() => {
                            setSelectedModel(mod);
                            setActionType('rollback');
                            setActionModalVisible(true);
                          }}
                        >
                          <RotateCcw size={14} color="#fff" />
                          <Text style={styles.btnActionText}>Rollback to this</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: DRIFT & SHADOW */}
          {activeTab === 'drift' && (
            <View style={styles.tabSection}>
              {/* Drift Summary */}
              {driftReport && (
                <View style={styles.driftCard}>
                  <View style={styles.driftHeader}>
                    <Text style={styles.cardTitle}>Population Stability & Feature Drift</Text>
                    <View style={[styles.statusBadge, getDriftBadgeStyle(driftReport.overall_drift_status)]}>
                      <Text style={styles.statusBadgeText}>{driftReport.overall_drift_status}</Text>
                    </View>
                  </View>
                  <Text style={styles.driftSubText}>
                    Max PSI Score: {driftReport.max_psi_score.toFixed(4)} | Thresholds: 0.10 (Drifting), 0.25 (Critical)
                  </Text>
                  <Text style={styles.conceptText}>{driftReport.concept_drift_status}</Text>

                  {/* Channel Breakdown */}
                  <View style={styles.channelGrid}>
                    {driftReport.feature_drifts.map((f) => (
                      <View key={f.feature_name} style={styles.channelItem}>
                        <Text style={styles.channelName}>{f.feature_name}</Text>
                        <Text style={styles.channelPsi}>PSI: {f.psi_score.toFixed(4)}</Text>
                        <View style={[styles.channelDot, f.status === 'NORMAL' ? styles.dotGreen : styles.dotAmber]} />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Shadow Evaluation Summary */}
              {shadowMetrics && (
                <View style={styles.driftCard}>
                  <Text style={styles.cardTitle}>Shadow Mode Real-Time Parity</Text>
                  <Text style={styles.driftSubText}>
                    Candidate: {shadowMetrics.active_shadow_version || 'None Active'}
                  </Text>
                  <View style={styles.shadowMetricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Total Windows</Text>
                      <Text style={styles.metricVal}>{shadowMetrics.total_shadow_evaluations}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Agreement Rate</Text>
                      <Text style={styles.metricVal}>
                        {(shadowMetrics.prediction_agreement_rate * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Mean Score Diff</Text>
                      <Text style={styles.metricVal}>{shadowMetrics.mean_score_difference.toFixed(4)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: DATASETS */}
          {activeTab === 'datasets' && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionTitle}>Immutable Versioned Datasets ({datasets.length})</Text>
              {datasets.map((ds) => (
                <View key={ds.dataset_version} style={styles.modelCard}>
                  <View style={styles.modelCardHeader}>
                    <View>
                      <Text style={styles.modelVersionText}>{ds.dataset_version}</Text>
                      <Text style={styles.modelMetaText}>{ds.description}</Text>
                    </View>
                    <View style={[styles.statusBadge, styles.badgeValidated]}>
                      <Text style={styles.statusBadgeText}>{ds.status}</Text>
                    </View>
                  </View>
                  <View style={styles.prodMetricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Total Windows</Text>
                      <Text style={styles.metricVal}>{ds.total_windows.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Raw Records</Text>
                      <Text style={styles.metricVal}>{ds.total_raw_records.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Sampling Rate</Text>
                      <Text style={styles.metricVal}>{ds.quality_report.mean_sampling_rate_hz} Hz</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Action Modal */}
      <Modal visible={actionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' && 'Authorize Model Approval'}
              {actionType === 'deploy' && 'Production Model Promotion'}
              {actionType === 'stage' && 'Promote to Staging'}
              {actionType === 'shadow' && 'Enable Shadow Mode'}
              {actionType === 'rollback' && 'Confirm Model Rollback'}
            </Text>
            <Text style={styles.modalSubtitle}>Target Model: {selectedModel?.model_version}</Text>

            <Text style={styles.inputLabel}>Auditable Justification / Reason *</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              placeholder="e.g. Validated on test benchmark dataset with 0.94 F1 score..."
              placeholderTextColor="#64748b"
              value={actionReason}
              onChangeText={setActionReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setActionModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={handleActionSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Confirm Action</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'PRODUCTION':
      return styles.badgeProd;
    case 'APPROVED':
      return styles.badgeApproved;
    case 'VALIDATED':
      return styles.badgeValidated;
    case 'SHADOW':
      return styles.badgeShadow;
    case 'ROLLED_BACK':
      return styles.badgeRolledBack;
    default:
      return styles.badgeDefault;
  }
}

function getDriftBadgeStyle(status: string) {
  switch (status) {
    case 'NORMAL':
      return styles.badgeApproved;
    case 'DRIFTING':
      return styles.badgeShadow;
    case 'CRITICAL':
      return styles.badgeRolledBack;
    default:
      return styles.badgeDefault;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  prodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prodVersion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
  },
  prodMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  tabSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modelCardProd: {
    borderColor: '#38BDF8',
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modelVersionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modelMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  badgeProd: { backgroundColor: '#0284c7' },
  badgeProdText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  badgeApproved: { backgroundColor: '#16a34a' },
  badgeValidated: { backgroundColor: '#6366f1' },
  badgeShadow: { backgroundColor: '#d97706' },
  badgeRolledBack: { backgroundColor: '#dc2626' },
  badgeDefault: { backgroundColor: '#64748b' },
  modelMetricsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  miniMetric: {
    fontSize: 11,
    color: '#64748B',
  },
  miniMetricVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modelActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnApprove: { backgroundColor: '#16a34a' },
  btnDeploy: { backgroundColor: '#0284c7' },
  btnShadow: { backgroundColor: '#d97706' },
  btnRollback: { backgroundColor: '#b91c1c' },
  btnActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  driftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  driftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  driftSubText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  conceptText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  channelName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  channelPsi: {
    fontSize: 10,
    color: '#64748B',
  },
  channelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: { backgroundColor: '#22c55e' },
  dotAmber: { backgroundColor: '#f59e0b' },
  shadowMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    color: '#0F172A',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalBtnCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  modalBtnConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#0284c7',
  },
  modalBtnConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
