import { useEffect, useState, useCallback } from "react";
import { getUserRole } from "../utils/auth";

const STORAGE_KEY = "headerCollapsed";
const TOGGLE_EVENT = "headerCollapsedChange";

/**
 * Hook reativo pro estado do header colapsado (só CLIENT).
 *
 * Diferente de ler localStorage direto, esse hook re-renderiza o componente
 * quando o estado muda em qualquer lugar da app (via window event "headerCollapsedChange").
 * Resolve o bug de "cliquei no botão pra colapsar mas o breadcrumb da outra
 * página não atualiza pra mostrar o botão de expandir".
 */
export function useHeaderCollapsed(): [boolean, () => void] {
  const userRole = getUserRole();
  const isClient = userRole === "ROLE_CLIENT" || userRole === "CLIENT";

  const read = useCallback(
    () => isClient && localStorage.getItem(STORAGE_KEY) === "true",
    [isClient],
  );

  const [collapsed, setCollapsed] = useState<boolean>(read);

  useEffect(() => {
    const refresh = () => setCollapsed(read());
    window.addEventListener(TOGGLE_EVENT, refresh);
    window.addEventListener("storage", refresh); // cross-tab
    return () => {
      window.removeEventListener(TOGGLE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [read]);

  const toggle = useCallback(() => {
    const next = !read();
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(TOGGLE_EVENT));
    setCollapsed(next);
  }, [read]);

  return [collapsed, toggle];
}
