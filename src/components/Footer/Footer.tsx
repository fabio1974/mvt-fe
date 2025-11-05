import "./Footer.css";

interface FooterProps {
  isLoggedIn?: boolean;
  sidebarWidth?: number;
}

export default function Footer({
  isLoggedIn = false,
  sidebarWidth = 0,
}: FooterProps) {
  // Footer compacto (usado tanto para logados quanto não logados)
  const isDark = !isLoggedIn;

  const handleLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = isDark ? "#60a5fa" : "#3b82f6";
  };

  const handleLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = isDark
      ? "hsl(0, 0%, 70%)"
      : "hsl(220, 20%, 40%)";
  };

  return (
    <footer
      className="serra-footer compact"
      style={{
        left: isLoggedIn ? `${sidebarWidth}px` : 0,
        width: isLoggedIn ? `calc(100% - ${sidebarWidth}px)` : "100%",
        background: isDark ? "hsl(220, 20%, 15%)" : "hsl(220, 20%, 96%)",
        borderTop: isDark
          ? "1px solid hsl(220, 15%, 25%)"
          : "1px solid rgba(59, 130, 246, 0.15)",
      }}
    >
      <div className="compact-content">
        <p
          className="compact-copyright"
          style={{ color: isDark ? "hsl(0, 0%, 70%)" : "hsl(220, 20%, 40%)" }}
        >
          © 2025 Zapi10. Todos os direitos reservados.
        </p>
        <div className="compact-links">
          <a
            href="#"
            style={{ color: isDark ? "hsl(0, 0%, 70%)" : "hsl(220, 20%, 40%)" }}
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            TERMOS
          </a>
          <a
            href="#"
            style={{ color: isDark ? "hsl(0, 0%, 70%)" : "hsl(220, 20%, 40%)" }}
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            PRIVACIDADE
          </a>
          <a
            href="#"
            style={{ color: "hsl(220, 20%, 40%)" }}
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            COOKIES
          </a>
        </div>
      </div>
    </footer>
  );
}
