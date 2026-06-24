import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type TruckStatus = "moving" | "docked" | "alert" | "idle";

interface TruckStatusIconProps {
  status: TruckStatus;
  size?: number;
}

export function TruckStatusIcon({ status, size = 36 }: TruckStatusIconProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "alert") {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [status, pulse]);

  const config = {
    moving: { icon: "truck" as const, color: "#10B981", bg: "#ECFDF5" },
    docked: { icon: "anchor" as const, color: "#3B82F6", bg: "#EFF6FF" },
    alert: { icon: "alert-triangle" as const, color: "#F59E0B", bg: "#FFFBEB" },
    idle: { icon: "truck" as const, color: "#94A3B8", bg: "#F1F5F9" },
  }[status];

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bg },
        status === "alert" && { opacity: pulse },
      ]}
    >
      <Feather name={config.icon} size={size * 0.45} color={config.color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
