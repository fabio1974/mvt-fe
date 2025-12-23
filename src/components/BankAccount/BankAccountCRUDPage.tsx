import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Contas Bancárias
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * O backend deve fornecer metadata em /api/metadata/bankAccount com:
 * 
 * Campos esperados:
 * - bank (text): Nome do banco
 * - agency (text): Agência
 * - accountNumber (text): Número da conta
 * - accountType (enum): Tipo de conta (CORRENTE, POUPANCA, PAGAMENTO)
 * - pixKey (text): Chave PIX (opcional)
 * - pixKeyType (enum): Tipo da chave PIX (CPF, CNPJ, EMAIL, TELEFONE, ALEATORIA)
 * - accountHolder (text): Titular da conta
 * - accountHolderDocument (text): CPF/CNPJ do titular
 * - isPrimary (boolean): Indica se é a conta principal
 * - isActive (boolean): Indica se a conta está ativa
 * - notes (textarea): Observações
 * - user (entity): Usuário proprietário da conta
 * - createdAt (date, readonly): Data de criação
 * - updatedAt (date, readonly): Data da última atualização
 * 
 * Endpoints esperados pelo backend:
 * - GET /api/bank-accounts - Lista todas as contas bancárias (ADMIN)
 * - GET /api/bank-accounts/{id} - Busca por ID (ADMIN)
 * - POST /api/bank-accounts - Cria nova conta bancária (ADMIN)
 * - PUT /api/bank-accounts/{id} - Atualiza conta bancária (ADMIN)
 * - DELETE /api/bank-accounts/{id} - Remove conta bancária (ADMIN)
 * 
 * Regras de negócio (validadas no backend):
 * - Apenas UMA conta pode ser marcada como principal por usuário
 * - Validação de formato de PIX conforme tipo da chave
 * - Validação de CPF/CNPJ do titular
 * 
 * ⚠️ APENAS ADMIN: Esta página só é acessível para usuários com perfil ADMIN
 */
const BankAccountCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="bankAccount"
      hideArrayFields={true}
      pageTitle="Contas Bancárias"
      pageDescription="Gerencie as contas bancárias cadastradas na plataforma"
    />
  );
};

export default BankAccountCRUDPage;
