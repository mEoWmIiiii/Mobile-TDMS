import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { GPSBanner } from "@/components/GPSBanner";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { JOBS, KPIS, TRUCKS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [truckProgresses, setTruckProgresses] = useState(
    TRUCKS.map((t) => t.progress)
  );
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const animRefs = useRef<Record<string, Animated.Value>>({});

  JOBS.forEach((job) => {
    if (!animRefs.current[job.id]) {
      animRefs.current[job.id] = new Animated.Value(0);
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTruckProgresses((prev) =>
        prev.map((p, i) => {
          const truck = TRUCKS[i];
          if (truck.status === "moving") {
            return Math.min(100, p + Math.random() * 2);
          }
          return p;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleJob = useCallback(
    (id: string) => {
      const isOpen = expandedJob === id;
      if (!isOpen && expandedJob) {
        Animated.timing(animRefs.current[expandedJob], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      setExpandedJob(isOpen ? null : id);
      Animated.timing(animRefs.current[id], {
        toValue: isOpen ? 0 : 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    },
    [expandedJob]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Operations
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Dashboard
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="bell" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>
      </View>

      <GPSBanner />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Fleet Overview
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {KPIS.map((kpi) => (
              <KPICard key={kpi.label} kpi={kpi} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Shipment Overview
              </Text>
              <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
                {JOBS.length} records · Today
              </Text>
            </View>
            <TouchableOpacity style={[styles.filterBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="sliders" size={13} color={colors.mutedForeground} />
              <Text style={[styles.filterText, { color: colors.mutedForeground }]}>
                Filter
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
              {["JOB NO.", "CUSTOMER", "ROUTE", "STATUS"].map((h) => (
                <Text key={h} style={[styles.colHeader, { color: colors.mutedForeground }]}>
                  {h}
                </Text>
              ))}
            </View>
            {JOBS.map((job, idx) => {
              const anim = animRefs.current[job.id];
              const maxH = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 120],
              });
              const isLast = idx === JOBS.length - 1;

              return (
                <View key={job.id}>
                  <Pressable
                    onPress={() => toggleJob(job.id)}
                    style={({ pressed }) => [
                      styles.tableRow,
                      { borderBottomColor: colors.border },
                      !isLast && styles.tableRowBorder,
                      pressed && { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Text style={[styles.jobId, { color: colors.primary }]}>
                      {job.id}
                    </Text>
                    <View style={styles.customerCol}>
                      <Text style={[styles.customerName, { color: colors.foreground }]} numberOfLines={1}>
                        {job.customer}
                      </Text>
                    </View>
                    <Text style={[styles.routeText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {job.origin} → {job.destination}
                    </Text>
                    <StatusBadge status={job.status} small />
                  </Pressable>

                  <Animated.View style={{ maxHeight: maxH, overflow: "hidden" }}>
                    <View
                      style={[
                        styles.expandedRow,
                        { backgroundColor: colors.secondary, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={styles.expandedGrid}>
                        <ExpandDetail label="Driver" value={job.driver} />
                        <ExpandDetail label="Truck" value={job.truck} />
                        <ExpandDetail label="Cargo" value={job.cargo} />
                        <ExpandDetail label="Weight" value={`${job.weight} kg`} />
                        <ExpandDetail label="Mode" value={job.mode} />
                        <ExpandDetail label="Date" value={job.date} />
                      </View>
                      {job.remarks && (
                        <Text style={[styles.remarks, { color: colors.mutedForeground }]}>
                          ⚠ {job.remarks}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                </View>
              );
            })}
          </View>
          <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
            Tap any row for quick actions
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Active Fleet Tracker
          </Text>
          {TRUCKS.filter((t) => t.status === "moving" || t.status === "alert").map((truck, i) => {
            const progress = truckProgresses[TRUCKS.indexOf(truck)];
            return (
              <View
                key={truck.id}
                style={[styles.trackerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.trackerRow}>
                  <View style={[styles.truckDot, {
                    backgroundColor: truck.status === "alert" ? "#F59E0B" : "#10B981"
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.truckId, { color: colors.foreground }]}>
                      {truck.id} · {truck.type}
                    </Text>
                    <Text style={[styles.truckLoc, { color: colors.mutedForeground }]}>
                      <Feather name="map-pin" size={11} color={colors.mutedForeground} /> {truck.location}
                    </Text>
                  </View>
                  <Text style={[styles.speedText, { color: truck.status === "alert" ? "#F59E0B" : colors.primary }]}>
                    {truck.status === "alert" ? "STOPPED" : `${Math.round(truck.speed)} km/h`}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progress)}%`,
                        backgroundColor: truck.status === "alert" ? "#F59E0B" : "#10B981",
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Origin</Text>
                  <Text style={[styles.progressPct, { color: colors.primary }]}>
                    {Math.round(progress)}%
                  </Text>
                  <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Dest.</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function ExpandDetail({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.expandDetail}>
      <Text style={[styles.expandLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.expandValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  subtitle: { fontSize: 12, fontWeight: "500" as const, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" as const },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, marginBottom: 12, letterSpacing: -0.3 },
  sectionMeta: { fontSize: 12, marginTop: 2 },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: "500" as const },
  tableCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  tableHeader: {
    flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, gap: 8,
  },
  colHeader: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.5, flex: 1 },
  tableRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 13, alignItems: "center", gap: 8 },
  tableRowBorder: { borderBottomWidth: 1 },
  jobId: { fontSize: 12, fontWeight: "700" as const, width: 80 },
  customerCol: { flex: 1 },
  customerName: { fontSize: 13, fontWeight: "600" as const },
  routeText: { fontSize: 11, width: 90 },
  expandedRow: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  expandedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expandDetail: { width: "30%" },
  expandLabel: { fontSize: 10, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  expandValue: { fontSize: 13, fontWeight: "500" as const, marginTop: 2 },
  remarks: { fontSize: 12, marginTop: 8, fontStyle: "italic" },
  tapHint: { fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 4 },
  trackerCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  trackerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  truckDot: { width: 10, height: 10, borderRadius: 5 },
  truckId: { fontSize: 13, fontWeight: "700" as const },
  truckLoc: { fontSize: 12, marginTop: 2 },
  speedText: { fontSize: 12, fontWeight: "700" as const },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  progressLabel: { fontSize: 10 },
  progressPct: { fontSize: 10, fontWeight: "700" as const },
});
