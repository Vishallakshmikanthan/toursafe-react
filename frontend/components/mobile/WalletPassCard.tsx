import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import {
  ShieldCheck,
  CheckCircle2,
  Share2,
  Maximize2,
  RotateCw,
  Award,
  Sparkles,
  Download,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

interface WalletPassCardProps {
  holderName?: string;
  idNumber?: string;
  validity?: string;
  nationality?: string;
  isVerified?: boolean;
  qrValue?: string;
  tokenNonce?: string;
  onRotateQR?: () => void;
  onPresentFullscreen?: () => void;
  onShare?: () => void;
}

export function WalletPassCard({
  holderName = "ADITYA VERMA",
  idNumber = "TS-IND-8842-2026",
  validity = "12/2028",
  nationality = "IND",
  isVerified = true,
  qrValue = "TSQR:ECDSA_SECP256K1_AUTH_GOV_IND_8842_VERIFIED",
  tokenNonce = "8F4A921C",
  onRotateQR,
  onPresentFullscreen,
  onShare,
}: WalletPassCardProps) {
  const handleAddToWallet = () => {
    Toast.show({
      type: "success",
      text1: "Added to Digital Wallet",
      text2: "TourSafe Verified Pass exported to mobile wallet.",
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* Pass Header Band */}
      <View style={styles.headerBand}>
        <View style={styles.govSealRow}>
          <View style={styles.sealCircle}>
            <ShieldCheck size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>TOURSAFE OFFICIAL PASS</Text>
            <Text style={styles.headerSubtitle}>
              MINISTRY OF TOURISM • SOVEREIGN CREDENTIAL
            </Text>
          </View>
        </View>

        {isVerified && (
          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={12} color="#FFFFFF" />
            <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
          </View>
        )}
      </View>

      {/* Main Body: QR Code & Dynamic Anti-Replay Ring */}
      <View style={styles.qrSection}>
        <View style={styles.qrCardBox}>
          <QRCode
            value={qrValue}
            size={168}
            backgroundColor="#FFFFFF"
            color="#0F172A"
          />
        </View>

        <View style={styles.noncePillRow}>
          <View style={styles.noncePill}>
            <Sparkles size={11} color="#0284C7" />
            <Text style={styles.noncePillText}>
              Security Token: {tokenNonce.slice(0, 8)}
            </Text>
          </View>

          {onRotateQR && (
            <TouchableOpacity
              style={styles.refreshNonceBtn}
              onPress={onRotateQR}
              activeOpacity={0.7}
            >
              <RotateCw size={13} color="#0284C7" />
              <Text style={styles.refreshNonceText}>Rotate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Traveler Identification Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.fieldLabel}>AUTHORIZED TRAVELER</Text>
          <Text style={styles.fieldValueBold} numberOfLines={1}>
            {holderName}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.fieldLabel}>CREDENTIAL ID</Text>
          <Text style={styles.fieldValueMono}>{idNumber}</Text>
        </View>

        <View style={styles.detailRowSplit}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>VALIDITY</Text>
            <Text style={styles.fieldValue}>{validity}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>NATIONALITY</Text>
            <Text style={styles.fieldValue}>{nationality}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>STATUS</Text>
            <Text style={[styles.fieldValue, { color: "#0284C7", fontWeight: "700" }]}>
              Active
            </Text>
          </View>
        </View>
      </View>

      {/* Native Wallet Action Toolbar */}
      <View style={styles.actionToolbar}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handleAddToWallet}
          activeOpacity={0.8}
        >
          <Download size={15} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Add to Apple / Google Wallet</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActionsRow}>
          {onPresentFullscreen && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onPresentFullscreen}
              activeOpacity={0.7}
            >
              <Maximize2 size={14} color="#0284C7" />
              <Text style={styles.secondaryButtonText}>Present QR</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={
              onShare ||
              (() =>
                Toast.show({
                  type: "info",
                  text1: "Pass Shared",
                  text2: "Encrypted pass copy shared.",
                }))
            }
            activeOpacity={0.7}
          >
            <Share2 size={14} color="#0284C7" />
            <Text style={styles.secondaryButtonText}>Share with Hotel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    marginVertical: 10,
  },
  headerBand: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  govSealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sealCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
    letterSpacing: 0.4,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  qrSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(240, 249, 255, 0.5)",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  qrCardBox: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  noncePillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  noncePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  noncePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  refreshNonceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
  },
  refreshNonceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },
  detailsGrid: {
    padding: 16,
    gap: 12,
  },
  detailItem: {},
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValueBold: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  fieldValueMono: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },
  detailRowSplit: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  actionToolbar: {
    padding: 14,
    paddingTop: 6,
    gap: 8,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284C7",
    height: 48,
    borderRadius: 14,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(240, 249, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(2, 132, 199, 0.2)",
    height: 42,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
  },
});
