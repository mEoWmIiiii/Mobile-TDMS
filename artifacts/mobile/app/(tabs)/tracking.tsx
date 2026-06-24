import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { GPSBanner } from "@/components/GPSBanner";
import { Icon } from "@/components/Icon";
import { TRUCKS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const TRUCK_POSITIONS = [
  { id: "TRK-001", x: 62, y: 55, status: "moving" as const, route: "Cebu \u2192 Manila" },
  { id: "TRK-002", x: 30, y: 70, status: "alert" as const, route: "Iloilo Port" },
  { id: "TRK-003", x: 65, y: 72, status: "docked" as const, route: "Cebu Terminal" },
  { id: "TRK-004", x: 60, y: 40, status: "moving" as const, route: "CAVITEX \u2192 Cavite" },
];

const STATUS_COLOR = {
  moving: "#E87722",
  docked: "#60A5FA",
  alert: "#F59E0B",
  idle: "#5A7AB0",
};

export default function TrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>("TRK-001");
  const [progresses, setProgresses] = useState<Record<string, number>>(
    Object.fromEntries(TRUCKS.map((t) => [t.id, t.progress]))
  );
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgresses((prev) => {
        const next = { ...prev };
        TRUCKS.forEach((t) => {
          if (t.status === "moving") {
            next[t.id] = Math.min(100, (next[t.id] ?? t.progress) + Math.random() * 1.5);
          }
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const selectedTruck = TRUCKS.find((t) => t.id === selected);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>TELEMATICS</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Live Tracking</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>4 ACTIVE</Text>
        </View>
      </View>

      <GPSBanner />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Static SVG Map Panel */}
        <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.mapHeader}>
            <Text style={[styles.mapTitle, { color: colors.foreground }]}>Fleet Map \u2014 Philippines</Text>
            <Text style={[styles.mapSub, { color: colors.mutedForeground }]}>Real-time asset positions</Text>
          </View>
          <View style={styles.mapContainer}>
            <Svg width="100%" height={220} viewBox="0 0 100 100">
              {/* Map background */}
              <Rect x="0" y="0" width="100" height="100" fill={colors.secondary} />

              {/* Grid lines */}
              {[20, 40, 60, 80].map((v) => (
                <React.Fragment key={v}>
                  <Line x1={v} y1="0" x2={v} y2="100" stroke={colors.border} strokeWidth="0.3" strokeDasharray="1,2" />
                  <Line x1="0" y1={v} x2="100" y2={v} stroke={colors.border} strokeWidth="0.3" strokeDasharray="1,2" />
                </React.Fragment>
              ))}

              {/* Philippines simplified landmass */}
              <Path
                d="M55,15 L60,20 L62,28 L58,35 L60,42 L65,48 L67,55 L63,62 L60,68 L58,75 L55,80 L52,75 L50,68 L52,62 L50,55 L48,48 L50,42 L52,35 L50,28 L52,20 Z"
                fill={colors.border + "44"}
                stroke={colors.border}
                strokeWidth="0.5"
              />
              <Path
                d="M35,45 L40,42 L45,48 L42,55 L38,58 L34,55 L32,48 Z"
                fill={colors.border + "44"}
                stroke={colors.border}
                strokeWidth="0.5"
              />
              <Path
                d="M68,40 L73,38 L76,44 L72,50 L68,48 Z"
                fill={colors.border + "44"}
                stroke={colors.border}
                strokeWidth="0.5"
              />

              {/* Route lines */}
              <Path
                d="M62,55 L60,40"
                stroke={colors.primary + "66"}
                strokeWidth="0.6"
                strokeDasharray="2,1"
              />
              <Path
                d="M30,70 L35,55"
                stroke="#F59E0B66"
                strokeWidth="0.6"
                strokeDasharray="1,1"
              />

              {/* Truck markers */}
              {TRUCK_POSITIONS.map((pos) => {
                const isSelected = pos.id === selected;
                const color = STATUS_COLOR[pos.status];
                return (
                  <React.Fragment key={pos.id}>
                    {isSelected && (
                      <Circle
                        cx={pos.x}
                        cy={pos.y}
                        r="5"
                        fill={color + "25"}
                        stroke={color + "50"}
                        strokeWidth="0.4"
                      />
                    )}
                    <Circle cx={pos.x} cy={pos.y} r={isSelected ? 2.5 : 2} fill={color} />
                    <Circle cx={pos.x} cy={pos.y} r={isSelected ? 2.5 : 2} fill="none" stroke="#fff" strokeWidth="0.4" />
                    <SvgText
                      x={pos.x + 4}
                      y={pos.y - 3}
                      fontSize="3.5"
                      fill={colors.foreground}
                      fontWeight="bold"
                    >
                      {pos.id}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>

            <View style={styles.mapLegend}>
              {[
                { color: "#E87722", label: "Moving" },
                { color: "#60A5FA", label: "Docked" },
                { color: "#F59E0B", label: "Alert" },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Selected truck detail */}
        {selectedTruck && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailDot, { backgroundColor: STATUS_COLOR[selectedTruck.status] }]} />
              <Text style={[styles.detailId, { color: colors.foreground }]}>{selectedTruck.id}</Text>
              <Text style={[styles.detailType, { color: colors.mutedForeground }]}>{selectedTruck.type}</Text>
            </View>
            <View style={styles.detailMeta}>
              <Icon name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[styles.detailLoc, { color: colors.mutedForeground }]}>{selectedTruck.location}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
              <View style={[styles.progressFill, {
                width: `${Math.round(progresses[selectedTruck.id] ?? selectedTruck.progress)}%` as any,
                backgroundColor: STATUS_COLOR[selectedTruck.status],
              }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Origin</Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>
                {Math.round(progresses[selectedTruck.id] ?? selectedTruck.progress)}% en route
              </Text>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Destination</Text>
            </View>
          </View>
        )}

        {/* Truck list */}
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: colors.foreground }]}>Active Assets</Text>
          {TRUCK_POSITIONS.map((pos) => {
            const truck = TRUCKS.find((t) => t.id === pos.id);
            if (!truck) return null;
            const isSelected = pos.id === selected;
            const color = STATUS_COLOR[pos.status];
            return (
              <TouchableOpacity
                key={pos.id}
                style={[
                  styles.truckRow,
                  { backgroundColor: isSelected ? colors.primary + "18" : colors.card, borderColor: isSelected ? colors.primary : colors.border },
                ]}
                onPress={() => setSelected(pos.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.truckStatusDot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.truckRowId, { color: colors.foreground }]}>{truck.id} \u00b7 {truck.type}</Text>
                  <Text style={[styles.truckRowLoc, { color: colors.mutedForeground }]}>{pos.route}</Text>
                </View>
                <View style={styles.truckRowRight}>
                  <Text style={[styles.truckRowPct, { color: color }]}>
                    {Math.round(progresses[truck.id] ?? truck.progress)}%
                  </Text>
                  {truck.planeNo && (
                    <Text style={[styles.truckPlane, { color: colors.mutedForeground }]}>{truck.planeNo}</Text>
                  )}
                </View>
                <Icon name="chevron-right" size={14} color={isSelected ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerSub: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 1.2 },
  headerTitle: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.5 },
  mapCard: { margin: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  mapHeader: { padding: 14, paddingBottom: 8 },
  mapTitle: { fontSize: 14, fontWeight: "700" as const },
  mapSub: { fontSize: 12, marginTop: 2 },
  mapContainer: { position: "relative" },
  mapLegend: { flexDirection: "row", gap: 14, padding: 10, paddingTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11 },
  detailCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  detailDot: { width: 9, height: 9, borderRadius: 5 },
  detailId: { fontSize: 15, fontWeight: "700" as const },
  detailType: { fontSize: 12 },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12 },
  detailLoc: { fontSize: 12 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 5 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 10 },
  progressPct: { fontSize: 10, fontWeight: "700" as const },
  listSection: { paddingHorizontal: 16, gap: 8 },
  listTitle: { fontSize: 15, fontWeight: "700" as const, marginBottom: 4 },
  truckRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  truckStatusDot: { width: 9, height: 9, borderRadius: 5 },
  truckRowId: { fontSize: 13, fontWeight: "600" as const },
  truckRowLoc: { fontSize: 11, marginTop: 2 },
  truckRowRight: { alignItems: "flex-end", gap: 2 },
  truckRowPct: { fontSize: 13, fontWeight: "700" as const },
  truckPlane: { fontSize: 10 },
});
