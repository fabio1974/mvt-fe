import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD para gerenciamento de Usuários ADM (Administradores Locais Zapi10).
 *
 * Os ADMs são usuários (User) com role específico e perfil complementar (ADMProfile).
 * Esta página gerencia a entidade User filtrada por role=ADM.
 *
 * Estrutura no Backend:
 * - User (tabela users) com role=ADM
 * - ADMProfile (tabela adm_profiles) relacionamento 1:1 com User
 * - ADM atua como TENANT do sistema (escopo de dados)
 *
 * Esta página utiliza o componente genérico EntityCRUD que:
 * - Carrega metadados automaticamente do backend
 * - Renderiza formulários dinamicamente baseado nos metadados
 * - Aplica validações automáticas
 * - Suporta filtros, ordenação e paginação
 * - Possui renderers customizados para tipos específicos
 *
 * Endpoints da API:
 * - GET    /api/users?role=ADM               - Listar usuários ADM
 * - POST   /api/users                        - Criar novo usuário ADM
 * - PUT    /api/users/{id}                   - Atualizar usuário ADM
 * - DELETE /api/users/{id}                   - Remover usuário ADM
 * - GET    /api/users/{id}                   - Buscar usuário por ID
 * - GET    /api/users/metadata               - Metadados da entidade
 */
const Zapi10ADMCRUDPage: React.FC = () => {
  const customRenderers: {
    [fieldName: string]: (value: unknown, row: unknown) => React.ReactNode;
  } = {
    role: (value: unknown) => {
      if (value === "ADM") {
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
            ADM
          </span>
        );
      }
      return String(value);
    },
    status: (value: unknown) => {
      const colors = {
        ACTIVE: "bg-green-100 text-green-800",
        INACTIVE: "bg-red-100 text-red-800",
        SUSPENDED: "bg-yellow-100 text-yellow-800",
      };

      const labels = {
        ACTIVE: "Ativo",
        INACTIVE: "Inativo",
        SUSPENDED: "Suspenso",
      };

      const stringValue = String(value);
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            colors[stringValue as keyof typeof colors] ||
            "bg-gray-100 text-gray-800"
          }`}
        >
          {labels[stringValue as keyof typeof labels] || stringValue}
        </span>
      );
    },
    commissionPercentage: (value: unknown) => {
      const numValue = Number(value);
      return numValue ? `${numValue}%` : "0%";
    },
    totalCommission: (value: unknown) => {
      const numValue = Number(value);
      return numValue
        ? `R$ ${numValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "R$ 0,00";
    },
    totalClientsManaged: (value: unknown) => (
      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
        {Number(value) || 0} clientes
      </span>
    ),
    totalCouriersManaged: (value: unknown) => (
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
        {Number(value) || 0} motoboys
      </span>
    ),
    totalDeliveriesManaged: (value: unknown) => (
      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
        {Number(value) || 0} entregas
      </span>
    ),
  };

  return (
    <EntityCRUD
      entityName="user"
      endpoint="/api/users"
      customRenderers={customRenderers}
      defaultFilters={{ role: "ADM" }}
      additionalCreateData={{ role: "ADM" }}
    />
  );
};

export default Zapi10ADMCRUDPage;
