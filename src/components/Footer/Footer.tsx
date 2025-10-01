import "./Footer.css";

export default function Footer() {
  return (
    <footer className="serra-footer modern">
      <div className="footer-grid">
        <div className="brand-col">
          <div className="brand-heading">
            <img
              src="/vite.svg"
              alt="Corridas da Serra"
              className="brand-logo"
            />
            <div>
              <h3>Corridas da Serra</h3>
              <p className="tagline">Eventos Esportivos</p>
            </div>
          </div>
          <p className="brand-text">
            Conectando atletas às aventuras mais emocionantes nas montanhas.
            Descubra, participe e supere seus limites.
          </p>
          <ul className="contact">
            <li>
              <span>📍</span> Serra da Estrela, Portugal
            </li>
            <li>
              <span>✉️</span> info@corridasdaserra.pt
            </li>
            <li>
              <span>📞</span> +351 123 456 789
            </li>
          </ul>
          <div className="social-row">
            <a href="#" aria-label="Facebook" className="social-icon">
              f
            </a>
            <a href="#" aria-label="Instagram" className="social-icon">
              ig
            </a>
            <a href="#" aria-label="Twitter" className="social-icon">
              x
            </a>
          </div>
        </div>
        <div className="links-col">
          <h4>Eventos</h4>
          <ul>
            <li>
              <a href="/eventos">Trail Running</a>
            </li>
            <li>
              <a href="/eventos">Ciclismo de Montanha</a>
            </li>
            <li>
              <a href="/eventos">Caminhadas Temáticas</a>
            </li>
            <li>
              <a href="/eventos">Calendário de Eventos</a>
            </li>
            <li>
              <a href="/eventos">Próximos Eventos</a>
            </li>
          </ul>
        </div>
        <div className="links-col">
          <h4>Suporte</h4>
          <ul>
            <li>
              <a href="#">Centro de Ajuda</a>
            </li>
            <li>
              <a href="#">Contato</a>
            </li>
            <li>
              <a href="#">Política de Cancelamento</a>
            </li>
            <li>
              <a href="#">Termos de Uso</a>
            </li>
            <li>
              <a href="#">Política de Privacidade</a>
            </li>
          </ul>
        </div>
        <div className="links-col">
          <h4>Comunidade</h4>
          <ul>
            <li>
              <a href="#">Blog</a>
            </li>
            <li>
              <a href="#">Histórias de Atletas</a>
            </li>
            <li>
              <a href="#">Parceiros</a>
            </li>
            <li>
              <a href="#">Programa de Afiliados</a>
            </li>
            <li>
              <a href="#">Tornar-se Organizador</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="legal-row">
        <p>© 2025 Corridas da Serra. Todos os direitos reservados.</p>
        <div className="legal-links">
          <a href="#">Termos</a>
          <a href="#">Privacidade</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
