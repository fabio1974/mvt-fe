import "./Footer.css";

export default function Footer() {
  return (
    <footer className="serra-footer">
      <div className="footer-container">
        <div className="footer-logo">
          <img src="/vite.svg" alt="Corridas da Serra" />
        </div>
        <div className="footer-links">
          <a href="#" target="_blank" rel="noopener noreferrer">
            Perguntas Frequentes
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            Política de Privacidade
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            Termos de Uso
          </a>
        </div>
        <div className="footer-social">
          <a href="#" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        © 2025 - Corridas da Serra - Todos os direitos reservados
      </div>
    </footer>
  );
}
