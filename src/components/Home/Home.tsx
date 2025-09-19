import "./Home.css";
import SectionContainer from "./SectionContainer";

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
      <SectionContainer>
        <Section1 />
      </SectionContainer>
      <SectionContainer>
        <Section2 />
      </SectionContainer>
      <SectionContainer>
        <Section3 />
      </SectionContainer>
      <SectionContainer>
        <Section4 />
      </SectionContainer>
      <SectionContainer>
        <Section5 />
      </SectionContainer>
      <SectionContainer>
        <Section6 />
      </SectionContainer>
      <SectionContainer>
        <Section7 />
      </SectionContainer>
      <SectionContainer>
        <Section8 />
      </SectionContainer>
      <SectionContainer>
        <Section9 />
      </SectionContainer>
    </main>
  );
}

function Section1() {
  return (
    <>
      <h2>Aqui, os eventos esportivos acontecem</h2>
      <p>
        Encontre seu próximo desafio e participe dos melhores eventos
        esportivos.
      </p>
      <DummyImage alt="Banner principal" />
    </>
  );
}
function Section2() {
  return (
    <>
      <h2>Automatize a gestão das inscrições</h2>
      <p>Maximize o lucro do seu evento com gestão automatizada.</p>
      <DummyImage alt="Gestão de inscrições" />
    </>
  );
}
function Section3() {
  return (
    <>
      <h2>Página exclusiva para divulgação</h2>
      <p>Centralize todas as informações da sua competição esportiva.</p>
      <DummyImage alt="Página de divulgação" />
    </>
  );
}
function Section4() {
  return (
    <>
      <h2>Gerencie inscrições, pagamentos e check-ins</h2>
      <p>Controle total das vendas e inscrições, com multilotes e cupons.</p>
      <DummyImage alt="Gestão de vendas" />
    </>
  );
}
function Section5() {
  return (
    <>
      <h2>Venda por cartão, Pix ou boleto</h2>
      <p>Receba diretamente na Corridas da Serra, sem complicação.</p>
      <DummyImage alt="Opções de pagamento" />
    </>
  );
}
function Section6() {
  return (
    <>
      <h2>Automatize e gerencie todas as vendas</h2>
      <p>Automação inteligente, suporte ao atleta e personalização total.</p>
      <DummyImage alt="Automação inteligente" />
    </>
  );
}
function Section7() {
  return (
    <>
      <h2>Sua marca. Nossa infraestrutura.</h2>
      <p>
        Mantenha sua identidade visual e acesse toda a tecnologia Corridas da
        Serra.
      </p>
      <DummyImage alt="Infraestrutura personalizada" />
    </>
  );
}
function Section8() {
  return (
    <>
      <h2>Depoimentos de quem usa a plataforma</h2>
      <p>
        Veja a experiência de organizadores e atletas com a Corridas da Serra.
      </p>
      <DummyImage alt="Depoimentos" />
    </>
  );
}
function Section9() {
  return (
    <>
      <h2>Serviços e conteúdo</h2>
      <p>Cadastre eventos, acesse materiais gratuitos e entre em contato.</p>
      <DummyImage alt="Serviços e conteúdo" />
    </>
  );
}
