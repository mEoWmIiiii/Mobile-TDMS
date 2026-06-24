import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { TruckStatusIcon } from "@/components/TruckStatusIcon";
import { TRUCKS, Truck } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG = {
  moving: { label: "Moving", color: "#10B981", bg: "#ECFDF5" },
  docked: { label: "Docked", color: "#3B82F6", bg: "#EFF6FF" },
  alert: { label: "Alert", color: "#F59E0B", bg: "#FFFBEB" },
  idle: { label: "Idle", color: "#94A3B8", bg: "#F1F5F9" },
};

export default function FleetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [trucks, setTrucks] = useState(TRUCKS);
  const [activeFilter, setActiveFilter] = useState<Truck["status"] | "all">("all");

  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks((prev) =>
        prev.map((t) => {
          if (t.status === "moving") {
            return { ...t, speed: 55 + Math.random() * 30, progress: Math.min(100, t.progress + Math.random() * 1.5) };
          }
          return t;
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeFilter === "all" ? trucks : trucks.filter((t) => t.status === activeFilter);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const counts = {
    all: trucks.length,
    moving: trucks.filter((t) => t.status === "moving").length,
    docked: trucks.filter((t) => t.status === "docked").length,
    alert: trucks.filter((t) => t.status === "alert").length,
    idle: trucks.filter((t) => t.status === "idle").length,
  };

  const renderTruck = ({ item }: { item: Truck }) => {
    const cfg = STATUS_CONFIG[item.status];
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardMain}>
          <TruckStatusIcon status={item.status} size={48} />
          <View style={{ flex: 1 }}>
            <View style={styles.truckHeaderRow}>
              <Text style={[styles.truckId, { color: colors.foreground }]}>{item.id}</Text>
              <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={[styles.truckType, { color: colors.mutedForeground }]}>{item.type}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{item.location}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.metricsRow}>
          <MetricCell
            label="Speed"
            value={item.status === "moving" ? `${Math.round(item.speed)} km/h` : "0 km/h"}
            icon="wind"
            color={colors.primary}
          />
          <MetricCell
            label="Progress"
            value={`${Math.round(item.progress)}%`}
            icon="activity"
            color="#8B5CF6"
          />
          {item.planeNo ? (
            <MetricCell label="Flight" value={item.planeNo} icon="send" color="#3B82F6" />
          ) : (
            <MetricCell label="Type" value="Land" icon="truck" color="#F59E0B" />
          )}
        </View>

        {item.status === "moving" && (
          <View style={styles.progressSection}>
            <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
              <View style={[styles.progressFill, { width: `${Math.round(item.progress)}%` }]} />
              <View style={[styles.progressDot, { left: `${Math.max(0, Math.round(item.progress) - 2)}%` as any }]} />
            </View>
            <View style={styles.progressEndpoints}>
              <Text style={[styles.endpointText, { color: colors.mutedForeground }]}>Origin</Text>
              <Text style={[styles.endpointText, { color: colors.mutedForeground }]}>Destination</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Asset Directory</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Fleet</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        {(["all", "moving", "docked", "alert", "idle"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, { color: activeFilter === f ? colors.primary : colors.mutedForeground }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            <View style={[styles.filterCount, { backgroundColor: activeFilter === f ? colors.primary : colors.secondary }]}>
              <Text style={[styles.filterCountText, { color: activeFilter === f ? "#fff" : colors.mutedForeground }]}>
                {counts[f]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTruck}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="truck" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No trucks in this category</Text>
          </View>
        }
      />
    </View>
  );
}

function MetricCell({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.metricCell}>
      <Feather name={icon} size={14} color={color} />
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerSub: { fontSize: 12, fontWeight: "500" as const, textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  filterBar: { flexDirection: "row", borderBottomWidth: 1 },
  filterTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, gap: 4 },
  filterText: { fontSize: 12, fontWeight: "600" as const },
  filterCount: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, minWidth: 18, alignItems: "center" },
  filterCountText: { fontSize: 10, fontWeight: "700" as const },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 16 },
  cardMain: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  truckHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  truckId: { fontSize: 16, fontWeight: "700" as const },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: "700" as const },
  truckType: { fontSize: 13, marginTop: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  locationText: { fontSize: 12 },
  divider: { height: 1, marginVertical: 14 },
  metricsRow: { flexDirection: "row", justifyContent: "space-around" },
  metricCell: { alignItems: "center", gap: 4 },
  metricValue: { fontSize: 14, fontWeight: "700" as const, marginTop: 2 },
  metricLabel: { fontSize: 10, fontWeight: "500" as const },
  progressSection: { marginTop: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "visible", position: "relative" },
  progressFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 3 },
  progressDot: { position: "absolute", top: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#fff" },
  progressEndpoints: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  endpointText: { fontSize: 10 },
  empty: { paddingTop: 80, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
});
