import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { MANIFESTS, Manifest } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const MARKING_COLORS: Record<string, { bg: string; text: string; iconName: "shield" | "alert-octagon" | "thermometer" | "arrow-up" | "heart" | "wind" | "tag" }> = {
  FRAGILE: { bg: "#EFF6FF", text: "#1D4ED8", iconName: "shield" },
  "THIS SIDE UP": { bg: "#F0FDF4", text: "#15803D", iconName: "arrow-up" },
  HAZARDOUS: { bg: "#FEF2F2", text: "#B91C1C", iconName: "alert-octagon" },
  "HANDLE WITH CARE": { bg: "#FFFBEB", text: "#B45309", iconName: "heart" },
  PERISHABLE: { bg: "#F0FDF4", text: "#065F46", iconName: "thermometer" },
  "KEEP COOL": { bg: "#EFF6FF", text: "#1E40AF", iconName: "wind" },
  "ROUTING SEAL": { bg: "#F5F3FF", text: "#6D28D9", iconName: "tag" },
};

export default function ManifestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"mawb" | "hawb">("mawb");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const renderManifest = ({ item }: { item: Manifest }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* Header: Shipper + Cut-off */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mawbNum, { color: colors.primary }]}>{item.mawb}</Text>
          <Text style={[styles.shipper, { color: colors.foreground }]}>{item.shipper}</Text>
          <Text style={[styles.origin, { color: colors.mutedForeground }]}>{item.origin}</Text>
        </View>
        <View style={styles.cutoffContainer}>
          <Text style={[styles.cutoffLabel, { color: colors.mutedForeground }]}>CUT-OFF</Text>
          <View style={[styles.cutoffBadge, { backgroundColor: "#FEF2F2" }]}>
            <Text style={styles.cutoffTime}>{item.cutoff}</Text>
          </View>
        </View>
      </View>

      {/* Nested Reference + System Logs */}
      <View style={[styles.referenceRow, { borderBottomColor: colors.border }]}>
        <View style={styles.refItem}>
          <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>HAWB NUMBER</Text>
          <Text style={[styles.refValue, { color: colors.foreground }]}>{item.hawb}</Text>
          <Text style={[styles.refSub, { color: colors.mutedForeground }]}>Nested Reference</Text>
        </View>
        <View style={[styles.refDivider, { backgroundColor: colors.border }]} />
        <View style={styles.refItem}>
          <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>SYSTEM LOGS</Text>
          <Text style={[styles.refValue, { color: colors.foreground }]}>{item.date}</Text>
          <View style={styles.autoStampRow}>
            <View style={styles.autoStampDot} />
            <Text style={[styles.refSub, { color: colors.primary }]}>Auto-stamped</Text>
          </View>
        </View>
      </View>

      {/* Inline Metrics Block */}
      <View style={[styles.metricsRow, { borderBottomColor: colors.border }]}>
        <MetricBlock label="QTY" value={`${item.qty} pcs`} color="#3B82F6" />
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <MetricBlock label="WEIGHT (KG)" value={`${item.weight} kg`} color="#8B5CF6" />
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <MetricBlock label="DIMENSIONS" value={item.dimensions} color="#F59E0B" />
      </View>

      {/* Special Instructions Block */}
      <View style={[styles.markingsSection, { borderBottomColor: colors.border }]}>
        <View style={styles.markingsHeader}>
          <Icon name="alert-triangle" size={13} color="#B45309" />
          <Text style={[styles.markingsTitle, { color: colors.mutedForeground }]}>
            MARKINGS / LABELS — Special Instructions
          </Text>
        </View>
        <View style={styles.markingsList}>
          {item.markings.map((marking) => {
            const cfg = MARKING_COLORS[marking] ?? { bg: "#F1F5F9", text: "#475569", iconName: "tag" as const };
            return (
              <View key={marking} style={[styles.markingChip, { backgroundColor: cfg.bg }]}>
                <Icon name={cfg.iconName} size={12} color={cfg.text} />
                <Text style={[styles.markingText, { color: cfg.text }]}>{marking}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.cardActionBtn, { borderColor: colors.border }]}>
          <Icon name="printer" size={14} color={colors.mutedForeground} />
          <Text style={[styles.cardActionText, { color: colors.mutedForeground }]}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardActionBtn, { borderColor: colors.border }]}>
          <Icon name="share-2" size={14} color={colors.mutedForeground} />
          <Text style={[styles.cardActionText, { color: colors.mutedForeground }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardActionBtn, { borderColor: colors.primary, backgroundColor: "#ECFDF5" }]}>
          <Icon name="check-circle" size={14} color={colors.primary} />
          <Text style={[styles.cardActionText, { color: colors.primary }]}>Validate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>AIR CARGO</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Manifest</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Icon name="plus" size={18} color={colors.foreground} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["mawb", "hawb"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab === "mawb" ? "MAWB Grid" : "HAWB List"}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.tabSpacer} />
        <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{MANIFESTS.length} records</Text>
        </View>
      </View>

      <FlatList
        data={MANIFESTS}
        keyExtractor={(item) => item.mawb}
        renderItem={renderManifest}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function MetricBlock({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.metricBlock}>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerSub: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 1.2 },
  headerTitle: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1 },
  tab: { paddingVertical: 12, paddingHorizontal: 4, marginRight: 16 },
  tabText: { fontSize: 13, fontWeight: "600" as const },
  tabSpacer: { flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  countText: { fontSize: 12, fontWeight: "600" as const },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", padding: 14, borderBottomWidth: 1, gap: 12, alignItems: "flex-start" },
  mawbNum: { fontSize: 13, fontWeight: "700" as const, marginBottom: 2 },
  shipper: { fontSize: 15, fontWeight: "600" as const },
  origin: { fontSize: 12, marginTop: 2 },
  cutoffContainer: { alignItems: "flex-end", gap: 4 },
  cutoffLabel: { fontSize: 10, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  cutoffBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  cutoffTime: { fontSize: 18, fontWeight: "700" as const, color: "#B91C1C" },
  referenceRow: { flexDirection: "row", borderBottomWidth: 1 },
  refItem: { flex: 1, padding: 12 },
  refDivider: { width: 1 },
  refLabel: { fontSize: 10, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  refValue: { fontSize: 13, fontWeight: "700" as const, marginTop: 3 },
  refSub: { fontSize: 10, marginTop: 2 },
  autoStampRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  autoStampDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#10B981" },
  metricsRow: { flexDirection: "row", borderBottomWidth: 1, alignItems: "stretch" },
  metricBlock: { flex: 1, padding: 14, alignItems: "center" },
  metricLabel: { fontSize: 9, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  metricValue: { fontSize: 14, fontWeight: "700" as const, marginTop: 4 },
  metricDivider: { width: 1 },
  markingsSection: { padding: 14, borderBottomWidth: 1 },
  markingsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  markingsTitle: { fontSize: 10, fontWeight: "700" as const, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 },
  markingsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  markingChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  markingText: { fontSize: 12, fontWeight: "600" as const },
  cardActions: { flexDirection: "row", gap: 8, padding: 14 },
  cardActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  cardActionText: { fontSize: 12, fontWeight: "600" as const },
});
