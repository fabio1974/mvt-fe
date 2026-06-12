/**
 * Página pública de promoções (/promocoes) — dados das campanhas.
 *
 * Cada campanha vira um "deck" de slides navegável (swipe/setas/bolinhas) que
 * explica a promoção passo a passo, com screenshots reais do app.
 *
 * Os screenshots ficam em `public/promocoes/<arquivo>` e são servidos na raiz
 * (ex.: "/promocoes/passo-3-cupom.png"). Enquanto o arquivo real não existir, o
 * PhoneMockup mostra um placeholder rotulado — a página funciona normalmente e
 * basta soltar o PNG depois que ele aparece.
 *
 * Pra adicionar uma campanha nova: acrescente um objeto em CAMPAIGNS.
 */

export type SlideKind = "intro" | "step" | "cta";

export interface SlideCallout {
  /** texto do balão que aponta pro detalhe no screenshot */
  text: string;
  /** posição vertical sobre a tela do celular (CSS top). Default "44%". */
  top?: string;
  /** de que lado o balão sai. Default "center". */
  align?: "left" | "right" | "center";
}

export interface CampaignSlide {
  kind: SlideKind;
  /** passo (só em kind="step") */
  stepNumber?: number;
  title?: string;
  caption?: string;
  /** caminho do screenshot em public/, ex.: "/promocoes/passo-3-cupom.png" */
  image?: string;
  /** rótulo exibido no placeholder enquanto o screenshot real não existir */
  screenLabel?: string;
  /** balão explicativo sobre o screenshot */
  callout?: SlideCallout;
}

export interface Campaign {
  id: string;
  /** chip acima do título */
  badge: string;
  /** título curto da campanha */
  name: string;
  /** subtítulo de 1 linha (scan rápido) */
  tagline: string;
  /** destaque grande do slide de abertura, ex.: "R$15 OFF" */
  highlight: string;
  /** código do cupom (opcional) */
  code?: string;
  /** letras miúdas / regras */
  terms: string;
  /** está rodando agora? (campanhas inativas aparecem com selo "encerrada") */
  active: boolean;
  slides: CampaignSlide[];
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "primeira-compra",
    badge: "🎟️ Cupom de boas-vindas",
    name: "Cupom de primeira compra",
    tagline: "Ganhe R$15 de desconto no seu primeiro pedido de comida.",
    highlight: "R$15 OFF",
    code: "ZAPI10",
    terms: "Pedido mínimo R$30 · 1 por CPF · válido até 30/06",
    active: true,
    slides: [
      {
        kind: "intro",
      },
      {
        kind: "step",
        stepNumber: 1,
        title: "Baixe o Zapi10 e crie sua conta",
        caption:
          "Leva menos de 1 minuto. Entrando com o Google, sua conta já nasce confirmada.",
        image: "/promocoes/passo-1-cadastro.png",
        screenLabel: "Tela de cadastro",
      },
      {
        kind: "step",
        stepNumber: 2,
        title: "Escolha sua comida",
        caption: "Os melhores lugares da sua cidade, reunidos num app só.",
        image: "/promocoes/passo-2-cardapio.png",
        screenLabel: "Cardápio da loja",
      },
      {
        kind: "step",
        stepNumber: 3,
        title: "No carrinho, digite o cupom ZAPI10",
        caption: "Toque em “Adicionar cupom” e digite ZAPI10.",
        image: "/promocoes/passo-3-cupom.png",
        screenLabel: "Carrinho — campo de cupom",
        callout: { text: "Digite ZAPI10 aqui", top: "46%", align: "center" },
      },
      {
        kind: "step",
        stepNumber: 4,
        title: "R$15 de desconto na hora",
        caption: "O desconto aparece no resumo antes de você pagar.",
        image: "/promocoes/passo-4-desconto.png",
        screenLabel: "Desconto aplicado",
        callout: { text: "− R$15 no total", top: "62%", align: "right" },
      },
      {
        kind: "step",
        stepNumber: 5,
        title: "Pronto! Receba na sua porta",
        caption: "Acompanhe o entregador em tempo real até a entrega.",
        image: "/promocoes/passo-5-acompanhamento.png",
        screenLabel: "Acompanhamento do pedido",
      },
      {
        kind: "cta",
      },
    ],
  },
];
