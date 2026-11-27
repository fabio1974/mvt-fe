import React from "react";
import AccountInvitesPage from "./AccountInvitesPage";

/** Admin convida gerentes (ORGANIZER) por e-mail — gerente não se cadastra sozinho. */
const OrganizerInvitesPage: React.FC = () => <AccountInvitesPage kind="organizer" />;

export default OrganizerInvitesPage;
