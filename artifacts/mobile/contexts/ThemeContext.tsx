import React, { createContext, useContext, useState } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
