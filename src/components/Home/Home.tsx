import "./Home.css";

function DummyImage({ alt }: { alt: string }) {
  return (
    <div className="dummy-image">
      <span>{alt}</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="serra-home">
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Section6 />
      <Section7 />
      <Section8 />
      <Section9 />
    </main>
  );
}

function Section1() {
  return (
    <section className="home-section">
      <h2>Aqui, os eventos esportivos acontecem</h2>
      <p>
        Encontre seu próximo desafio e participe dos melhores eventos
        esportivos.
      </p>
      <DummyImage alt="Banner principal" />
    </section>
  );
}
function Section2() {
  return (
    <section className="home-section">
      <h2>Automatize a gestão das inscrições</h2>
      <p>Maximize o lucro do seu evento com gestão automatizada.</p>
      <DummyImage alt="Gestão de inscrições" />
    </section>
  );
}
function Section3() {
  return (
    <section className="home-section">
      <h2>Página exclusiva para divulgação</h2>
      <p>Centralize todas as informações da sua competição esportiva.</p>
      <DummyImage alt="Página de divulgação" />
    </section>
  );
}
function Section4() {
  return (
    <section className="home-section">
      <h2>Gerencie inscrições, pagamentos e check-ins</h2>
      <p>Controle total das vendas e inscrições, com multilotes e cupons.</p>
      <DummyImage alt="Gestão de vendas" />
    </section>
  );
}
function Section5() {
  return (
    <section className="home-section">
      <h2>Venda por cartão, Pix ou boleto</h2>
      <p>Receba diretamente na Corridas da Serra, sem complicação.</p>
      <DummyImage alt="Opções de pagamento" />
    </section>
  );
}
function Section6() {
  return (
    <section className="home-section">
      <h2>Automatize e gerencie todas as vendas</h2>
      <p>Automação inteligente, suporte ao atleta e personalização total.</p>
      <DummyImage alt="Automação inteligente" />
    </section>
  );
}
function Section7() {
  return (
    <section className="home-section">
      <h2>Sua marca. Nossa infraestrutura.</h2>
      <p>
        Mantenha sua identidade visual e acesse toda a tecnologia Corridas da
        Serra.
      </p>
      <DummyImage alt="Infraestrutura personalizada" />
    </section>
  );
}
function Section8() {
  return (
    <section className="home-section">
      <h2>Depoimentos de quem usa a plataforma</h2>
      <p>
        Veja a experiência de organizadores e atletas com a Corridas da Serra.
      </p>
      <DummyImage alt="Depoimentos" />
    </section>
  );
}
function Section9() {
  return (
    <section className="home-section">
      <h2>Serviços e conteúdo</h2>
      <p>Cadastre eventos, acesse materiais gratuitos e entre em contato.</p>
      <DummyImage alt="Serviços e conteúdo" />
    </section>
  );
}
