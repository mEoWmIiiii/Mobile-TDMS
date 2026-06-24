import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { KPI } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

interface KPICardProps {
  kpi: KPI;
}

export function KPICard({ kpi }: KPICardProps) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: kpi.color }]} />
      <Text style={[styles.value, { color: colors.foreground }]}>{kpi.value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{kpi.label}</Text>
      <View style={styles.deltaRow}>
        <Text style={[styles.delta, { color: kpi.positive ? "#10B981" : "#EF4444" }]}>
          {kpi.positive ? "↑" : "↓"} {kpi.delta}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginRight: 10,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  value: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
  deltaRow: {
    marginTop: 4,
  },
  delta: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
});
