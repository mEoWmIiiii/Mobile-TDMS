import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export function useColors() {
  const { mode } = useTheme();
  return { ...(mode === "dark" ? colors.dark : colors.light), radius: colors.radius };
}
