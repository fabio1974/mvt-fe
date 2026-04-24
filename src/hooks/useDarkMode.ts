import { useCallback, useEffect, useState } from "react";
import { getUserRole } from "../utils/auth";

const STORAGE_KEY = "themeMode";
const THEME_CHANGED_EVENT = "themeModeChanged";

type ThemeMode = "dark" | "light" | "auto";

function readMode(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "dark" || v === "light" ? v : "auto";
}

function resolveIsDark(mode: ThemeMode, isLoggedIn: boolean): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (!isLoggedIn) return false;
  const role = getUserRole();
  return role === "ROLE_CLIENT" || role === "CLIENT";
}

export function useDarkMode(isLoggedIn: boolean) {
  const [mode, setMode] = useState<ThemeMode>(readMode);
  const isDark = resolveIsDark(mode, isLoggedIn);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [isDark]);

  useEffect(() => {
    const onChange = () => setMode(readMode());
    window.addEventListener(THEME_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const next: ThemeMode = isDark ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
  }, [isDark]);

  return { isDark, toggle };
}
