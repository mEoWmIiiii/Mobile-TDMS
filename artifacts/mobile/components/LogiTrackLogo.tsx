import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export function LogiTrackLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Feather name="chevrons-right" size={16} color="#FFFFFF" />
      </View>
      <Text style={styles.wordmark}>
        Logi<Text style={styles.accent}>Track</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    width: 30,
    height: 30,
    backgroundColor: "#10B981",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  accent: {
    color: "#10B981",
  },
});
