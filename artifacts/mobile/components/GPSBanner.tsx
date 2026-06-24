import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/Icon";

export function GPSBanner() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.banner}>
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Icon name="map-pin" size={13} color="#059669" strokeWidth={2.5} />
      <Text style={styles.text}>GPS Provider Integrated & Active</Text>
      <Text style={styles.tag}>LIVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderBottomWidth: 1,
    borderBottomColor: "#A7F3D0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#065F46",
  },
  tag: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
});
