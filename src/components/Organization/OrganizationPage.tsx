import { useSearchParams } from "react-router-dom";
import OrganizationForm from "./OrganizationForm";

export default function OrganizationPage() {
  const [searchParams] = useSearchParams();
  const fromCreateEvent = searchParams.get("from") === "create-event";

  return <OrganizationForm fromCreateEvent={fromCreateEvent} />;
}
