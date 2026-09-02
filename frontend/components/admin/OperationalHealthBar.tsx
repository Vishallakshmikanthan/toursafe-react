import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useReliabilityStore } from '../../store/reliabilityStore';
import { Activity, ShieldCheck, AlertTriangle, Cpu } from 'lucide-react-native';

interface Props {
  onOpenDetailedMetrics?: () => void;
}

export const OperationalHealthBar: React.FC<Props> = ({ onOpenDetailedMetrics }) => {
  const { systemMode, modeReason, fetchDegradation, goldenSignals, fetchMetrics } = useReliabilityStore();

  useEffect(() => {
    fetchDegradation();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchDegradation();
      fetchMetrics();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (systemMode) {
      case 'FULL':
        return '#10B981'; // Emerald
      case 'DEGRADED':
        return '#F59E0B'; // Amber
      case 'CRITICAL_ONLY':
        return '#EF4444'; // Red
      case 'OFFLINE':
        return '#6B7280'; // Gray
      default:
        return '#10B981';
    }
  };

  const getStatusLabel = () => {
    switch (systemMode) {
      case 'FULL':
        return 'All Safety Systems Operational';
      case 'DEGRADED':
        return 'System Degraded — Auxiliary Services Fallback Active';
      case 'CRITICAL_ONLY':
        return 'CRITICAL-ONLY MODE — AI & Analytics Load-Shed Active';
      case 'OFFLINE':
        return 'Emergency Offline Mode';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getStatusColor() }]}>
      <View style={styles.leftRow}>
        <View style={[styles.indicatorDot, { backgroundColor: getStatusColor() }]} />
        <View>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
          <Text style={styles.reasonText}>{modeReason}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {goldenSignals && (
          <View style={styles.metricBadge}>
            <Activity size={12} color="#0284C7" />
            <Text style={styles.metricLabel}>API p95:</Text>
            <Text style={styles.metricValue}>{goldenSignals.latency_ms.p95}ms</Text>
          </View>
        )}
        {onOpenDetailedMetrics && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onOpenDetailedMetrics}
            accessibilityRole="button"
            accessibilityLabel="Open SRE Health Metrics"
          >
            <Cpu size={12} color="#334155" />
            <Text style={styles.detailsButtonText}>SRE Health</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    flexWrap: 'wrap',
    gap: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  reasonText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  metricLabel: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
});
