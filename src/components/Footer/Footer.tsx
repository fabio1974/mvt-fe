import "./Footer.css";
import { VERSION, COMMIT_HASH } from "../../version";

interface FooterProps {
  isLoggedIn?: boolean;
  sidebarWidth?: number;
}

export default function Footer({
  isLoggedIn = false,
  sidebarWidth = 0,
}: FooterProps) {
  // Footer compacto (usado tanto para logados quanto não logados)
  // Classe `logged-out` aplica o visual escuro da landing (sem data-theme no <html>)
  const themeClass = isLoggedIn ? "logged-in" : "logged-out";

  return (
    <footer
      className={`serra-footer compact ${themeClass}`}
      style={{
        left: isLoggedIn ? `${sidebarWidth}px` : 0,
        width: isLoggedIn ? `calc(100% - ${sidebarWidth}px)` : "100%",
      }}
    >
      <div className="compact-content">
        <p className="compact-copyright">
          <span title={`Build: ${COMMIT_HASH}`} style={{ cursor: 'help' }}>
            v{VERSION}
          </span>
          {' • '}
          © 2025 Moveltrack Sistemas. Todos os direitos reservados.
        </p>
        <div className="compact-links">
          <a href="#">TERMOS</a>
          <a href="#">PRIVACIDADE</a>
          <a href="#">COOKIES</a>
        </div>
      </div>
    </footer>
  );
}
