import React, { useEffect, useRef, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

interface Props {
  onFinish: () => void;
  isReady: boolean;
}

export default function AnimatedSplashScreen({ onFinish, isReady }: Props) {
  const [opacity, setOpacity] = useState(1);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;

    let interval: ReturnType<typeof setInterval> | null = null;
    const delay = setTimeout(() => {
      interval = setInterval(() => {
        setOpacity((prev) => {
          const next = Math.max(0, prev - 0.03);
          if (next <= 0) {
            if (interval) clearInterval(interval);
            setTimeout(() => onFinishRef.current(), 80);
          }
          return next;
        });
      }, 16);
    }, 500);

    return () => {
      clearTimeout(delay);
      if (interval) clearInterval(interval);
    };
  }, [isReady]);

  return (
    <View
      style={[
        styles.root,
        Platform.OS === "web" && {
          position: "fixed" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100vh" as any,
          width: "100vw" as any,
        } as any,
        { opacity },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tagline}>Fleet & Logistics</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A1F4C",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    gap: 16,
  },
  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: "#0A1F4C",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  tagline: {
    color: "#E87722",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
