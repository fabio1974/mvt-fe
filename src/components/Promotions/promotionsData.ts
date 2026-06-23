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

import {
  promoDiscountLabel,
  promoAmountLabel,
  promoMinLabel,
  type PublicPromoCoupon,
} from "../Food/foodApi";

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
  /** valor do desconto sem "OFF", pra cópia corrida (ex.: "R$15") */
  amountLabel: string;
  /** código do cupom (opcional) */
  code?: string;
  /** letras miúdas / regras */
  terms: string;
  /** está rodando agora? (campanhas inativas aparecem com selo "encerrada") */
  active: boolean;
  slides: CampaignSlide[];
}

/**
 * Monta as campanhas da página /promocoes a partir do cupom-promoção do BE.
 * Nada de valor fixo: desconto, mínimo e código vêm da campanha no banco.
 * Sem promo ativa → lista vazia (a página mostra "Nenhuma campanha ativa").
 */
export function buildCampaigns(promo: PublicPromoCoupon | null): Campaign[] {
  if (!promo) return [];
  const off = promoDiscountLabel(promo); // "R$15 OFF"
  const amount = promoAmountLabel(promo); // "R$15"
  const min = promoMinLabel(promo); // "R$25" | null
  const code = promo.code;
  const terms = [
    min ? `Pedido mínimo ${min}` : null,
    promo.firstPurchaseOnly ? "1 por CPF" : null,
    "enquanto durar a campanha",
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    {
      id: "primeira-compra",
      badge: "🎟️ Cupom de boas-vindas",
      name: "Cupom de primeira compra",
      tagline: `Ganhe ${amount} de desconto no seu primeiro pedido de comida.`,
      highlight: off,
      amountLabel: amount,
      code,
      terms,
      active: true,
      slides: [
        { kind: "intro" },
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
          title: `No carrinho, digite o cupom ${code}`,
          caption: `Toque em “Adicionar cupom” e digite ${code}.`,
          image: "/promocoes/passo-3-cupom.png",
          screenLabel: "Carrinho — campo de cupom",
          callout: { text: `Digite ${code} aqui`, top: "46%", align: "center" },
        },
        {
          kind: "step",
          stepNumber: 4,
          title: `${amount} de desconto na hora`,
          caption: "O desconto aparece no resumo antes de você pagar.",
          image: "/promocoes/passo-4-desconto.png",
          screenLabel: "Desconto aplicado",
          callout: { text: `− ${amount} no total`, top: "62%", align: "right" },
        },
        {
          kind: "step",
          stepNumber: 5,
          title: "Pronto! Receba na sua porta",
          caption: "Acompanhe o entregador em tempo real até a entrega.",
          image: "/promocoes/passo-5-acompanhamento.png",
          screenLabel: "Acompanhamento do pedido",
        },
        { kind: "cta" },
      ],
    },
  ];
}
