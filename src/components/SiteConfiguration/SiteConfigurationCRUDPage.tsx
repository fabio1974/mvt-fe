import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Configurações do Site
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * O backend deve fornecer metadata em /api/metadata/siteConfiguration com:
 * 
 * Campos:
 * - pricePerKm (number): Preço por km (R$ 1,00/km)
 * - organizerPercentage (number): Comissão do gerente (0-100%)
 * - platformPercentage (number): Comissão da plataforma (0-100%)
 * - isActive (boolean): Indica se é a config ativa (readonly)
 * - notes (textarea): Observações
 * - updatedBy (text, readonly): Email do usuário que atualizou
 * - createdAt (date, readonly): Data de criação
 * - updatedAt (date, readonly): Data da última atualização
 * 
 * Endpoints esperados pelo backend:
 * - GET /api/site-configurations - Lista histórico completo (ADMIN)
 * - GET /api/site-configurations/{id} - Busca por ID (ADMIN)
 * - POST /api/site-configurations - Cria nova configuração (ADMIN)
 * 
 * Regras de negócio (validadas no backend):
 * - Apenas UMA configuração pode estar ativa por vez
 * - Soma dos percentuais não pode exceder 100%
 * - Criar nova config desativa automaticamente as anteriores
 * 
 * ⚠️ APENAS ADMIN: Esta página só é acessível para usuários com perfil ADMIN
 */
const SiteConfigurationCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="siteConfiguration"
      hideArrayFields={true}
      pageTitle="Configurações do Sistema"
      pageDescription="Gerencie preços por km e comissões da plataforma"
      initialFilters={{
        isActive: "true" // Filtro inicial: mostra apenas configurações ativas
      }}
    />
  );
};

export default SiteConfigurationCRUDPage;
