import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Search, Bell, CloudSun, Shield, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useCommandCenterStore } from '@/store/commandCenterStore';

export function AdminTopBar() {
  const { user } = useAuthStore();
  const { searchQuery, setSearchQuery, kpis } = useCommandCenterStore();

  const officerName = user?.full_name || 'Inspector R. Selvam';
  const jurisdiction = 'TN Police • Kodaikanal Division';

  return (
    <View style={styles.topBar}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search incident, tourist, or zone..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Right Controls */}
      <View style={styles.rightSection}>
        {/* Weather Capsule */}
        <View style={styles.weatherCapsule}>
          <CloudSun size={15} color="#0284C7" />
          <Text style={styles.weatherText}>Kodaikanal • Partly Cloudy 18°C</Text>
        </View>

        {/* Notification Bell */}
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.75}>
          <Bell size={17} color="#475569" />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>3</Text>
          </View>
        </TouchableOpacity>

        {/* Officer Profile Capsule */}
        <View style={styles.profileCapsule}>
          <View style={styles.avatarCircle}>
            <ShieldCheck size={16} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.profileName}>{officerName}</Text>
            <Text style={styles.profileJurisdiction}>{jurisdiction}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    zIndex: 10,
    ...(Platform.OS === 'web' ? { userSelect: 'none' } as any : {}),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
    width: 380,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  weatherCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  weatherText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileJurisdiction: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
});
