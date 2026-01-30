import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface PublicRouteGuardProps {
  children: ReactNode;
}

/**
 * Guard que redireciona usuários logados para o Dashboard
 * Usar em rotas públicas como login, registro, recuperar senha, etc.
 */
export default function PublicRouteGuard({ children }: PublicRouteGuardProps) {
  const isLoggedIn = Boolean(localStorage.getItem("authToken"));

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
