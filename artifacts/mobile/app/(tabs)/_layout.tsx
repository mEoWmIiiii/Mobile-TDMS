import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { Icon as SVGIcon } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>Job Bookings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tracking">
        <Icon sf={{ default: "location", selected: "location.fill" }} />
        <Label>Live Tracking</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { mode } = useTheme();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navInactive,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={mode === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <SVGIcon name="home" size={22} color={color} strokeWidth={2} />
            ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Job Bookings",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="briefcase" tintColor={color} size={22} />
            ) : (
              <SVGIcon name="briefcase" size={22} color={color} strokeWidth={2} />
            ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: "Live Tracking",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="location" tintColor={color} size={22} />
            ) : (
              <SVGIcon name="map-pin" size={22} color={color} strokeWidth={2} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
