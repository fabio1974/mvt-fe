// Função para decodificar JWT sem verificação (apenas para extrair dados do payload)
export function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

// Função para obter o role do usuário logado
export function getUserRole(): string | null {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  return decoded?.authorities?.[0] || null;
}

// Função para obter o email do usuário logado
export function getUserEmail(): string | null {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  return decoded?.sub || null;
}

// Função para verificar se o usuário pode criar eventos
export function canCreateEvents(): boolean {
  const role = getUserRole();
  return role === 'ROLE_ADMIN' || role === 'ROLE_ORGANIZER';
}

// Função para verificar se o usuário tem uma organização
export function hasOrganization(): boolean {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  const decoded = decodeJWT(token);
  const tokenOrgId = decoded?.organizationId;
  
  // Verificar também o localStorage para organizações recém-criadas
  const localStorageOrgId = localStorage.getItem('organizationId');
  
  return (tokenOrgId !== null && tokenOrgId !== undefined) || 
         (localStorageOrgId !== null && localStorageOrgId !== '');
}

// Função para obter o ID da organização do usuário
export function getOrganizationId(): number | null {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  const tokenOrgId = decoded?.organizationId;
  
  // Se não tiver no token, verificar localStorage
  if (tokenOrgId === null || tokenOrgId === undefined) {
    const localStorageOrgId = localStorage.getItem('organizationId');
    return localStorageOrgId ? parseInt(localStorageOrgId) : null;
  }
  
  return tokenOrgId;
}

// Função para obter o nome do usuário
export function getUserName(): string | null {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  return decoded?.name || null;
}

// Função para obter o ID do usuário (UUID)
export function getUserId(): string | null {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  // Retorna o userId que é um UUID string
  return decoded?.userId || null;
}

// Função para verificar se o usuário é admin
export function isAdmin(): boolean {
  const role = getUserRole();
  return role === 'ROLE_ADMIN';
}

// Função para obter dados adicionais do usuário para inscrição
export function getUserAdditionalData() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  return {
    birthDate: decoded?.dateOfBirth || null,
    gender: decoded?.gender || null,
    city: decoded?.city || null,
    state: decoded?.state || null,
    cpf: decoded?.cpf || null,
    phone: decoded?.phone || null,
  };
}