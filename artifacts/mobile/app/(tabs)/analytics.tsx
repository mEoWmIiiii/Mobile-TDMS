import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ANALYTICS_DATA, KPIS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_MAX_VALUE = 100;

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expandedChart, setExpandedChart] = useState<"delivery" | "distribution" | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeRange, setActiveRange] = useState<"week" | "month" | "quarter">("week");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const openChart = (chart: "delivery" | "distribution") => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start(() => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    });
    setExpandedChart(chart);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const deliveryData = ANALYTICS_DATA.daily;
  const chartMax = Math.max(...deliveryData.map((d) => d.delivered));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Performance</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
        </View>
        <View style={[styles.rangeSelector, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {(["week", "month", "quarter"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeTab, activeRange === r && { backgroundColor: colors.card }]}
              onPress={() => setActiveRange(r)}
            >
              <Text style={[styles.rangeText, { color: activeRange === r ? colors.primary : colors.mutedForeground }]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 100 }}>
        <View style={styles.kpiRow}>
          {KPIS.slice(0, 3).map((kpi) => (
            <View key={kpi.label} style={[styles.miniKPI, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.miniKPIValue, { color: kpi.color }]}>{kpi.value}</Text>
              <Text style={[styles.miniKPILabel, { color: colors.mutedForeground }]} numberOfLines={2}>
                {kpi.label}
              </Text>
            </View>
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.chartCardHeader}>
              <View>
                <Text style={[styles.chartTitle, { color: colors.foreground }]}>Daily Completion Rate</Text>
                <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>Delivered vs Pending this week</Text>
              </View>
              <TouchableOpacity
                style={[styles.viewAllBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                onPress={() => openChart("delivery")}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                <Feather name="maximize-2" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Delivered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#CBD5E1" }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Pending</Text>
              </View>
            </View>

            <View style={styles.barChart}>
              {deliveryData.map((d, i) => (
                <TouchableOpacity
                  key={d.day}
                  style={styles.barGroup}
                  onPress={() => setSelectedDay(selectedDay === i ? null : i)}
                  activeOpacity={0.7}
                >
                  <View style={styles.barsContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (d.delivered / chartMax) * 120,
                          backgroundColor: selectedDay === i ? colors.primary : "#10B981",
                          opacity: selectedDay !== null && selectedDay !== i ? 0.4 : 1,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (d.pending / chartMax) * 120,
                          backgroundColor: selectedDay === i ? "#94A3B8" : "#CBD5E1",
                          opacity: selectedDay !== null && selectedDay !== i ? 0.4 : 1,
                        },
                      ]}
                    />
                  </View>
                  {selectedDay === i && (
                    <View style={[styles.tooltip, { backgroundColor: colors.foreground }]}>
                      <Text style={styles.tooltipText}>{d.delivered}/{d.pending}</Text>
                    </View>
                  )}
                  <Text style={[styles.barLabel, { color: selectedDay === i ? colors.primary : colors.mutedForeground }]}>
                    {d.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartCardHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Vehicle Fleet Distribution</Text>
              <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>By asset type</Text>
            </View>
            <TouchableOpacity
              style={[styles.viewAllBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
              onPress={() => openChart("distribution")}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              <Feather name="maximize-2" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.distributionList}>
            {ANALYTICS_DATA.vehicleDistribution.map((d) => {
              const total = ANALYTICS_DATA.vehicleDistribution.reduce((s, x) => s + x.count, 0);
              const pct = Math.round((d.count / total) * 100);
              return (
                <View key={d.type} style={styles.distRow}>
                  <View style={styles.distLabel}>
                    <View style={[styles.distDot, { backgroundColor: d.color }]} />
                    <Text style={[styles.distType, { color: colors.foreground }]}>{d.type}</Text>
                  </View>
                  <View style={styles.distBarWrapper}>
                    <View style={[styles.distTrack, { backgroundColor: colors.secondary }]}>
                      <View style={[styles.distFill, { width: `${pct}%` as any, backgroundColor: d.color }]} />
                    </View>
                  </View>
                  <View style={styles.distStats}>
                    <Text style={[styles.distCount, { color: colors.foreground }]}>{d.count}</Text>
                    <Text style={[styles.distPct, { color: colors.mutedForeground }]}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Performance Summary</Text>
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Avg. Delivery Time" value="4.2h" trend="+0.3h" good={false} />
            <SummaryMetric label="On-Time Rate" value="94%" trend="+2%" good={true} />
            <SummaryMetric label="Fleet Utilization" value="78%" trend="+5%" good={true} />
            <SummaryMetric label="Exceptions" value="4" trend="-1" good={true} />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={expandedChart !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExpandedChart(null)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {expandedChart === "delivery" ? "Daily Completion Rate" : "Fleet Distribution"}
            </Text>
            <TouchableOpacity onPress={() => setExpandedChart(null)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            {expandedChart === "delivery" && (
              <>
                <Text style={[styles.expandedChartSub, { color: colors.mutedForeground }]}>
                  Weekly overview — deliveries vs pending
                </Text>
                <View style={styles.expandedBarChart}>
                  {deliveryData.map((d) => (
                    <View key={d.day} style={styles.expandedBarGroup}>
                      <Text style={[styles.barValue, { color: colors.primary }]}>{d.delivered}</Text>
                      <View style={[styles.expandedBar, { height: (d.delivered / chartMax) * 160, backgroundColor: "#10B981" }]} />
                      <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{d.day}</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.insightCard, { backgroundColor: colors.secondary }]}>
                  <Feather name="trending-up" size={16} color={colors.primary} />
                  <Text style={[styles.insightText, { color: colors.foreground }]}>
                    Friday had the highest delivery rate at 91 completed shipments — 35% above the weekly average.
                  </Text>
                </View>
              </>
            )}
            {expandedChart === "distribution" && (
              <>
                <Text style={[styles.expandedChartSub, { color: colors.mutedForeground }]}>
                  Fleet asset breakdown by vehicle type
                </Text>
                {ANALYTICS_DATA.vehicleDistribution.map((d) => {
                  const total = ANALYTICS_DATA.vehicleDistribution.reduce((s, x) => s + x.count, 0);
                  const pct = Math.round((d.count / total) * 100);
                  return (
                    <View key={d.type} style={[styles.expandedDistItem, { borderColor: colors.border }]}>
                      <View style={[styles.expandedDistDot, { backgroundColor: d.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.distType, { color: colors.foreground }]}>{d.type}</Text>
                        <View style={[styles.distTrack, { backgroundColor: colors.secondary, marginTop: 8 }]}>
                          <View style={[styles.distFill, { width: `${pct}%` as any, backgroundColor: d.color }]} />
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.expandedDistCount, { color: colors.foreground }]}>{d.count} units</Text>
                        <Text style={[styles.distPct, { color: d.color }]}>{pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function SummaryMetric({ label, value, trend, good }: { label: string; value: string; trend: string; good: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.summaryMetric, { borderColor: colors.border }]}>
      <Text style={[styles.summaryValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryTrend, { color: good ? "#10B981" : "#EF4444" }]}>{trend}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerSub: { fontSize: 12, fontWeight: "500" as const, textTransform: "uppercase", letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  rangeSelector: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 2, gap: 2 },
  rangeTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  rangeText: { fontSize: 12, fontWeight: "600" as const },
  kpiRow: { flexDirection: "row", gap: 10 },
  miniKPI: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "flex-start" },
  miniKPIValue: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -1 },
  miniKPILabel: { fontSize: 11, marginTop: 4, lineHeight: 15 },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  chartCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  chartTitle: { fontSize: 15, fontWeight: "700" as const },
  chartSub: { fontSize: 12, marginTop: 2 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  viewAllText: { fontSize: 12, fontWeight: "600" as const },
  legend: { flexDirection: "row", gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 145 },
  barGroup: { flex: 1, alignItems: "center", gap: 6 },
  barsContainer: { flexDirection: "row", gap: 2, alignItems: "flex-end" },
  bar: { width: 12, borderRadius: 3 },
  tooltip: { position: "absolute", top: -22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tooltipText: { color: "#fff", fontSize: 9, fontWeight: "700" as const },
  barLabel: { fontSize: 10, fontWeight: "600" as const },
  distributionList: { gap: 12 },
  distRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  distLabel: { flexDirection: "row", alignItems: "center", gap: 8, width: 110 },
  distDot: { width: 8, height: 8, borderRadius: 4 },
  distType: { fontSize: 13, fontWeight: "500" as const },
  distBarWrapper: { flex: 1 },
  distTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  distFill: { height: "100%", borderRadius: 4 },
  distStats: { alignItems: "flex-end", width: 44 },
  distCount: { fontSize: 13, fontWeight: "700" as const },
  distPct: { fontSize: 11 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryTitle: { fontSize: 15, fontWeight: "700" as const, marginBottom: 16 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryMetric: { width: "48%", padding: 14, borderRadius: 12, borderWidth: 1 },
  summaryValue: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, marginTop: 4 },
  summaryTrend: { fontSize: 12, fontWeight: "600" as const, marginTop: 6 },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700" as const },
  expandedChartSub: { fontSize: 13 },
  expandedBarChart: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 200 },
  expandedBarGroup: { flex: 1, alignItems: "center", gap: 6 },
  expandedBar: { width: "100%", borderRadius: 4 },
  barValue: { fontSize: 11, fontWeight: "700" as const },
  insightCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 12, alignItems: "flex-start" },
  insightText: { flex: 1, fontSize: 13, lineHeight: 20 },
  expandedDistItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  expandedDistDot: { width: 14, height: 14, borderRadius: 7 },
  expandedDistCount: { fontSize: 15, fontWeight: "700" as const },
});
