import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * CRUD admin de anúncios in-app.
 *
 * Backend: GET/POST/PUT/DELETE em /api/announcements (somente ADMIN).
 * Mobile consome via /api/announcements/active e marca lido em /api/announcements/{id}/read.
 *
 * Campos:
 * - title (text, required, max 200)
 * - bodyMarkdown (textarea, required, max 5000) — suporta **negrito**, listas, links
 * - rolesCsv (text, required) — CSV de roles. Ex: "COURIER,ORGANIZER,CLIENT"
 *   Valores válidos: ADMIN, COURIER, ORGANIZER, CLIENT, CUSTOMER, WAITER
 * - publishedAt (date, required) — data/hora de publicação
 * - expiresAt (date, optional) — null = nunca expira
 * - isActive (boolean) — desligar pra parar de mostrar
 *
 * ⚠️ Apenas ADMIN.
 */
const AnnouncementCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="announcement"
      pageTitle="Anúncios In-App"
      pageDescription="Mensagens que aparecem como popup no app mobile, segmentadas por role."
      initialFilters={{ isActive: "true" }}
    />
  );
};

export default AnnouncementCRUDPage;
