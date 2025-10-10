/**
 * Hook para acessar informações da organização do usuário logado
 * Extrai o organizationId do token JWT
 */

interface DecodedToken {
  sub: string;
  organizationId?: number;
  role?: string;
  exp: number;
}

export const useOrganization = () => {
  const getOrganizationId = (): number | null => {
    const token = localStorage.getItem("authToken");
    
    if (!token) return null;

    try {
      // Decodifica o JWT manualmente (parte do payload)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const decoded = JSON.parse(jsonPayload) as DecodedToken;
      return decoded.organizationId || null;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  };

  return {
    organizationId: getOrganizationId(),
  };
};
