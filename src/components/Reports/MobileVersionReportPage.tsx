import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Relatório admin: versão e plataforma do app mobile que cada usuário está usando,
 * com timestamp do último login mobile.
 *
 * Backend: GET /api/users/mobile-versions (apenas ADMIN). Suporta paginação e
 * sort via Pageable do Spring + filtros: mobilePlatform, mobileAppVersion, role,
 * mobileVersionUpdatedAtFrom/To (range de datas ISO).
 *
 * Metadata virtual registrada em MetadataService como `mobileVersionReport` —
 * não é uma entidade JPA, é um relatório read-only sobre dados de User.
 */
const MobileVersionReportPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="mobileVersionReport"
      pageTitle="Versões Mobile"
      pageDescription="Relatório de versão e plataforma do app mobile usado por cada usuário (atualizado a cada login)."
      disableCreate
      disableEdit
      disableDelete
      disableView
      hideArrayFields
    />
  );
};

export default MobileVersionReportPage;
