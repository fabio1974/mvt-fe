import "./Home.css";

// Hero principal inspirado na landing, com imagem de fundo e overlay
export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>
          <span>Corridas da</span>
          <span className="highlight">Serra</span>
        </h1>
        <p className="subtitle">
          Descubra eventos únicos de corrida e ciclismo nas montanhas mais
          desafiadoras. Sua aventura atlética começa aqui.
        </p>
        <div className="hero-actions">
          <a href="/eventos" className="btn hero primary">
            Explorar Eventos →
          </a>
          <button className="btn hero ghost">Ver como funciona</button>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <strong>500+</strong>
            <span>Eventos</span>
          </div>
          <div className="stat">
            <strong>15k+</strong>
            <span>Atletas</span>
          </div>
          <div className="stat">
            <strong>25</strong>
            <span>Regiões</span>
          </div>
        </div>
        <div className="hero-scroll-indicator" aria-hidden>
          <div className="mouse">
            <div className="wheel" />
          </div>
        </div>
      </div>
    </section>
  );
}
