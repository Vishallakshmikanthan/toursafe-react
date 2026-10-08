import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  BarChart3,
  MapPin,
  Cpu,
  Layers,
  Settings,
  User,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

interface AdminMoreModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminMoreModal({ visible, onClose }: AdminMoreModalProps) {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleNav = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Authority Command Modules</Text>
              <Text style={styles.sheetSub}>TN Police • Kodaikanal Division</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Module 1: Tourists / Verification */}
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => handleNav('/admin/(tabs)/tourists')}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIcon, { backgroundColor: '#E0F2FE' }]}>
                <Users size={18} color="#0284C7" />
              </View>
              <View style={styles.moduleTextCol}>
                <Text style={styles.moduleTitle}>Identity & Verification</Text>
                <Text style={styles.moduleDesc}>KYC review queue, QR verifier & traveler roster</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Module 2: Operational Analytics */}
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => handleNav('/admin/(tabs)/analytics')}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIcon, { backgroundColor: '#F0FDF4' }]}>
                <BarChart3 size={18} color="#16A34A" />
              </View>
              <View style={styles.moduleTextCol}>
                <Text style={styles.moduleTitle}>Operational Analytics</Text>
                <Text style={styles.moduleDesc}>Telemetry datasets, incident trends & ack times</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Module 3: Safety Zones */}
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => handleNav('/admin/(tabs)/zones')}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIcon, { backgroundColor: '#FEF3C7' }]}>
                <MapPin size={18} color="#D97706" />
              </View>
              <View style={styles.moduleTextCol}>
                <Text style={styles.moduleTitle}>Safety Zones</Text>
                <Text style={styles.moduleDesc}>GeoJSON polygon management & risk auditing</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Module 4: ML Lifecycle */}
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => handleNav('/admin/(tabs)/ml-ops')}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIcon, { backgroundColor: '#F5F3FF' }]}>
                <Cpu size={18} color="#7C3AED" />
              </View>
              <View style={styles.moduleTextCol}>
                <Text style={styles.moduleTitle}>ML Lifecycle & Governance</Text>
                <Text style={styles.moduleDesc}>Model registry, drift analysis & telemetry models</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Module 5: Integrations */}
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => handleNav('/admin/(tabs)/integrations')}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIcon, { backgroundColor: '#F1F5F9' }]}>
                <Layers size={18} color="#475569" />
              </View>
              <View style={styles.moduleTextCol}>
                <Text style={styles.moduleTitle}>External Integrations</Text>
                <Text style={styles.moduleDesc}>Partner APIs, DLQ queues & state conflict sync</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Module 6: Governance & Administration */}
            <TouchableOpacity
              style={styles.moduleItem}
              onPress={() => handleNav('/admin/(tabs)/settings')}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIcon, { backgroundColor: '#F8FAFC' }]}>
                <Settings size={18} color="#0F172A" />
              </View>
              <View style={styles.moduleTextCol}>
                <Text style={styles.moduleTitle}>Governance & Administration</Text>
                <Text style={styles.moduleDesc}>Multi-tier policy enforcement & audit trails</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Switch Role */}
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => {
                onClose();
                router.replace('/tourist/(tabs)/dashboard');
              }}
              activeOpacity={0.8}
            >
              <User size={16} color="#0284C7" />
              <Text style={styles.roleBtnText}>Switch to Traveler View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                onClose();
                logout();
                router.replace('/auth/login');
              }}
              activeOpacity={0.8}
            >
              <LogOut size={16} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Sign Out Authority Session</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    maxHeight: 450,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  moduleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextCol: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  logoutBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#EF4444',
  },
});
