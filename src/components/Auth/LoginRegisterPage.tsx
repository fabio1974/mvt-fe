import InfoPanel from "./InfoPanel";
import AuthTabs from "./AuthTabs";

export default function LoginRegisterPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafafa" }}>
      <InfoPanel />
      <AuthTabs />
    </div>
  );
}
