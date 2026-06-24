import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JobStatus } from "@/data/mockData";

interface StatusBadgeProps {
  status: JobStatus;
  small?: boolean;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; bg: string; text: string }> = {
  IN_TRANSIT: { label: "IN TRANSIT", bg: "#EFF6FF", text: "#1D4ED8" },
  PENDING: { label: "PENDING", bg: "#FFFBEB", text: "#B45309" },
  DELIVERED: { label: "DELIVERED", bg: "#ECFDF5", text: "#065F46" },
  DELAYED: { label: "DELAYED", bg: "#FEF2F2", text: "#B91C1C" },
  FOR_DISPATCH: { label: "FOR DISPATCH", bg: "#FFF7ED", text: "#C2410C" },
  CONFIRMED: { label: "CONFIRMED", bg: "#F0FDF4", text: "#15803D" },
};

export function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <Text style={[styles.label, { color: config.text }, small && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 9,
  },
});
