# 🚚 Zapi10 - Slides de Apresentação

## Slide 1: Capa
```
╔════════════════════════════════════════════╗
║                                            ║
║         🚚 ZAPI10                          ║
║                                            ║
║    Sistema de Gestão de Entregas          ║
║                                            ║
║         Novembro 2025                      ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Slide 2: O Problema
```
📦 Desafios das Empresas de Entregas

❌ Cálculo manual de preços
❌ Gestão desorganizada de motoboys
❌ Falta de controle financeiro
❌ Dificuldade em áreas especiais
❌ Sem histórico confiável
```

---

## Slide 3: A Solução
```
✅ Zapi10 - Plataforma Completa

🎯 Cálculo automático de preços
👥 Gestão de múltiplos grupos
💰 Controle financeiro integrado
🗺️  Zonas especiais configuráveis
📊 Relatórios e histórico completo
```

---

## Slide 4: Perfis de Usuário
```
┌────────────────────────────────────────┐
│ 👤 Administrador                       │
│ • Controle total do sistema            │
│ • Gerencia todos os módulos            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 👨‍💼 Gerente de Grupo                   │
│ • Gerencia seu grupo de motoboys       │
│ • Visualiza entregas e finanças        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🏪 Cliente                             │
│ • Solicita entregas                    │
│ • Acompanha status                     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🏍️  Motoboy                            │
│ • Recebe e executa entregas            │
│ • Atualiza status                      │
└────────────────────────────────────────┘
```

---

## Slide 5: Estrutura de Grupos
```
      ┌──────────────────┐
      │   ORGANIZAÇÃO    │
      │   (Grupo)        │
      └────────┬─────────┘
               │
      ┌────────┴─────────┐
      │                  │
┌─────▼─────┐     ┌─────▼─────┐
│ Contratos │     │ Contratos │
│   com     │     │   com     │
│  Clientes │     │ Motoboys  │
└───────────┘     └───────────┘
```

---

## Slide 6: Cálculo de Preço - Fórmula
```
💵 PREÇO FINAL = MAX(Valor Mínimo, Calculado)

Onde Calculado =
  Valor Base + Zona Especial

Componentes:
├─ Valor Mínimo: R$ 10,00
├─ Valor por Km: R$ 3,50/km
├─ Distância: Google Maps
└─ Zona Especial: Adicional ou Multiplicador
```

---

## Slide 7: Exemplo Real - Simples
```
🍕 Entrega de Pizza

Origem: Rua A, Centro
Destino: Rua B, Bairro Sul
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Distância: 3,5 km
Valor por Km: R$ 3,50

Cálculo:
3,5 km × R$ 3,50 = R$ 12,25

✅ PREÇO FINAL: R$ 12,25
```

---

## Slide 8: Exemplo com Zona Especial
```
🏖️  Entrega para a Ilha

Origem: Centro
Destino: Ilha (Zona Especial)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Distância: 8 km
Valor por Km: R$ 3,50
Zona "Ilha": +R$ 10,00 (balsa)

Cálculo:
8 km × R$ 3,50 = R$ 28,00
+ Zona Especial = R$ 10,00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PREÇO FINAL: R$ 38,00
```

---

## Slide 9: Tipos de Zona Especial
```
🗺️  ZONAS ESPECIAIS

Tipo 1: FIXED (Fixo)
├─ Adiciona valor fixo
├─ Exemplo: +R$ 8,00
└─ Uso: Pedágio, Balsa

Tipo 2: MULTIPLIER (Multiplicador)
├─ Multiplica valor base
├─ Exemplo: 1.5× (50% a mais)
└─ Uso: Áreas de risco, Morros
```

---

## Slide 10: Contratos com Clientes
```
📄 CONTRATO DE SERVIÇO

Cliente ↔ Organização

Define:
├─ Valor Mínimo: R$ 10,00
├─ Valor por Km: R$ 3,50
├─ Desconto: 0-100%
├─ Período: 01/11 a 31/12
└─ Status: Ativo/Inativo

✅ Valores personalizados por cliente
```

---

## Slide 11: Contratos com Motoboys
```
📋 CONTRATO DE MOTOBOY

Motoboy ↔ Organização

Define:
├─ Salário Base: R$ 2.000
├─ Comissão: 95% por entrega
├─ Período: 01/11 a 31/12
└─ Status: Ativo/Inativo

Exemplo:
Entrega R$ 25,00
├─ Motoboy: R$ 23,75 (95%)
└─ Grupo: R$ 1,25 (5%)
```

---

## Slide 12: Seleção de Motoboy
```
🏍️  COMO O MOTOBOY É ESCOLHIDO?

Critérios:
✅ Contrato ativo com a organização
✅ Status disponível
✅ Não está em outra entrega

Informações mostradas:
├─ Nome
├─ Avaliação ⭐⭐⭐⭐⭐
├─ Distância até coleta
└─ Histórico de entregas

Opções:
1️⃣ Seleção Manual (atual)
2️⃣ Seleção Automática (futuro)
```

---

## Slide 13: Fluxo de Entrega
```
🔄 CICLO DE VIDA DA ENTREGA

1. PENDING (Criada)
   ↓
2. CONFIRMED (Aceita pelo motoboy)
   ↓
3. PICKED_UP (Coletada)
   ↓
4. IN_TRANSIT (Em trânsito)
   ↓
5. DELIVERED (Entregue) ✅

   ou CANCELLED (Cancelada) ❌
```

---

## Slide 14: Exemplo Completo
```
📦 CASO REAL: Restaurante Pizza Express

10:30 - Cliente cria entrega
        Origem: Centro
        Destino: Bairro Sul
        Cálculo: R$ 18,90

10:31 - Seleciona João Silva ⭐5.0

10:32 - João aceita

10:45 - João coleta no restaurante

11:05 - João entrega ao cliente

18:00 - Cliente paga R$ 18,90

Divisão:
├─ João (95%): R$ 17,96
└─ Grupo (5%): R$ 0,94
```

---

## Slide 15: Dashboard ADMIN
```
📊 VISÃO DO ADMINISTRADOR

┌─────────────────────────────────┐
│ • Grupos                        │
│ • Motoboys                      │
│ • Clientes                      │
│ • Entregas                      │
│ • Zonas Especiais               │
│ • Configurações                 │
└─────────────────────────────────┘

Controle Total ✅
```

---

## Slide 16: Dashboard ORGANIZER
```
📊 VISÃO DO GERENTE

┌─────────────────────────────────┐
│ • Meu Grupo (somente leitura)   │
│ • Entregas do Grupo             │
│ • Balanço Financeiro            │
│ • Dados Pessoais                │
└─────────────────────────────────┘

Gestão Autônoma ✅
```

---

## Slide 17: Mapa de Zonas Especiais
```
🗺️  INTERFACE DE CONFIGURAÇÃO

┌───────────────────────────────┐
│                               │
│    [Mapa Interativo]          │
│                               │
│  🟥 Centro (1.2×)             │
│  🟦 Ilha (+R$ 10,00)          │
│  🟨 Morro (1.5×)              │
│                               │
│  Ferramentas:                 │
│  ✏️  Desenhar                  │
│  🗑️  Excluir                   │
│  💾 Salvar                    │
│                               │
└───────────────────────────────┘
```

---

## Slide 18: Tecnologias
```
⚛️  Frontend
├─ React + TypeScript
├─ Tailwind CSS
├─ Google Maps API
└─ Vite

☕ Backend
├─ Spring Boot
├─ PostgreSQL
├─ Spring Security
└─ REST API

☁️  Infraestrutura
├─ Render.com
├─ Docker
└─ CI/CD Automático
```

---

## Slide 19: Diferenciais
```
🌟 POR QUE ESCOLHER MVT EVENTS?

✅ Cálculo Inteligente
   • Múltiplos fatores
   • Zonas especiais
   • Transparência total

✅ Gestão Flexível
   • Múltiplos grupos
   • Contratos personalizados
   • Autonomia por perfil

✅ Geolocalização Real
   • Google Maps nativo
   • Distância precisa
   • Zonas visuais

✅ Interface Moderna
   • Design responsivo
   • Fácil de usar
   • Tempo real
```

---

## Slide 20: Benefícios por Perfil
```
👤 ADMIN
✓ Controle total
✓ Visão completa
✓ Configuração flexível

👨‍💼 ORGANIZER
✓ Gestão autônoma
✓ Balanço em tempo real
✓ Sem depender de ADMIN

🏪 CLIENT
✓ Preços transparentes
✓ Rastreamento real
✓ Histórico completo

🏍️  COURIER
✓ Sistema justo
✓ Interface simples
✓ Comissão garantida
```

---

## Slide 21: Estatísticas
```
📊 NÚMEROS DO SISTEMA

🎯 100% Automático
   Cálculo de preços

🗺️  Ilimitadas
   Zonas especiais

👥 Multi-tenant
   Vários grupos simultâneos

⚡ Tempo Real
   Atualização instantânea

🔒 Seguro
   Autenticação robusta
```

---

## Slide 22: Projeções Financeiras
```
💰 POTENCIAL DE RECEITA - 50 MOTOBOYS

Cenário PESSIMISTA (12 entregas/dia):
├─ Valor médio: R$ 6,50
└─ Receita mensal: R$ 5.070 💵

Cenário NORMAL (20 entregas/dia):
├─ Valor médio: R$ 7,50
└─ Receita mensal: R$ 9.750 💵

Cenário OTIMISTA (28 entregas/dia):
├─ Valor médio: R$ 8,50
└─ Receita mensal: R$ 15.470 💵

📊 Variação: R$ 5k a R$ 15k/mês
✅ Modelo escalável e lucrativo
✅ Motoboy ganha 95%, Grupo 5%
```

---

## Slide 23: Melhorias em Desenvolvimento
```
🚀 PRÓXIMAS FUNCIONALIDADES

📱 Aplicativo Mobile
   • Aplicativo nativo para motoboys
   • GPS em tempo real
   • Notificações instantâneas
   • Interface otimizada

🤖 Inteligência Artificial
   • Seleção automática de motoboys
   • Melhor match por histórico
   • Aprendizado contínuo

💳 Pagamentos Online
   • Integração com plataformas
   • PIX e cartão
   • Pagamento automático

📈 Análises Avançadas
   • Dashboard detalhado
   • Previsão de demanda
   • KPIs personalizados
```

---

## Slide 24: Casos de Uso
```
🎯 QUEM USA O ZAPI10?

🍕 Restaurantes
   • Entregas próprias
   • Contratos fixos
   • Volume alto

🏪 Estabelecimentos
   • Entregas pontuais
   • Preços variáveis
   • Áreas diversas

🚚 Empresas de Logística
   • Múltiplas equipes
   • Gestão centralizada
   • Relatórios completos

📦 Comércio Eletrônico
   • Integrações API
   • Escala grande
   • Automação total
```

---

## Slide 25: Comparativo
```
⚔️  ZAPI10 vs CONCORRENTES

          │ Zapi10 │ Outros
━━━━━━━━━━┼━━━━━━━━┼━━━━━━━
Grupos    │   ✅   │   ❌
Zonas     │   ✅   │   ⚠️
Contratos │   ✅   │   ❌
Comissão  │   ✅   │   ⚠️
Tempo Real│   ✅   │   ✅
Mobile    │   🔜   │   ✅
Preço     │   💰   │  💰💰
```

---

## Slide 26: Demonstração
```
🎬 DEMO AO VIVO

Vamos ver o sistema funcionando:

1️⃣ Login como ADMIN
2️⃣ Criar um Grupo
3️⃣ Cadastrar Contrato com Cliente
4️⃣ Configurar Zona Especial
5️⃣ Criar uma Entrega
6️⃣ Ver Cálculo de Preço
7️⃣ Selecionar Motoboy
```

---

## Slide 26: Segurança
```
🔒 SEGURANÇA E PRIVACIDADE

✅ Autenticação JWT
✅ Roles e Permissões
✅ HTTPS Obrigatório
✅ Dados Criptografados
✅ Backup Automático
✅ LGPD Compliance
```

---

## Slide 28: Performance
```
⚡ DESEMPENHO

📊 Métricas:
├─ < 200ms: Resposta API
├─ < 2s: Carregamento página
├─ 99.9%: Uptime
└─ Ilimitado: Escalabilidade

🚀 Otimizações:
├─ Cache inteligente
├─ Lazy loading
├─ CDN global
└─ Database indexing
```

---

## Slide 29: Suporte
```
📞 SUPORTE E TREINAMENTO

📚 Documentação Completa
   • Guias passo-a-passo
   • Vídeos tutoriais
   • FAQ detalhado

👨‍🏫 Treinamento
   • Onboarding personalizado
   • Sessões ao vivo
   • Material didático

🆘 Suporte Técnico
   • Chat em tempo real
   • E-mail: suporte@mvt.com
   • Telefone: (11) 9999-9999
```

---

## Slide 30: Estado do Projeto
```
� ZAPI10 - EM DESENVOLVIMENTO

🔧 Status Atual:
├─ Sistema Web: ✅ Funcional
├─ Cálculo de Preços: ✅ Completo
├─ Gestão de Grupos: ✅ Completo
├─ Zonas Especiais: ✅ Completo
└─ Contratos: ✅ Completo

🚀 Em Desenvolvimento:
├─ Aplicativo Mobile
├─ Inteligência Artificial
├─ Pagamentos Online
└─ Análises Avançadas
```

---

## Slide 31: Call to Action
```
🎯 VAMOS CONVERSAR?

💬 Entre em contato para:

1️⃣ Demonstração personalizada
2️⃣ Conhecer todas as funcionalidades
3️⃣ Tirar suas dúvidas

┌───────────────────────────────┐
│                               │
│    🚀 FALE CONOSCO!           │
│                               │
│    Zapi10                     │
│    Sistema de Gestão          │
│    de Entregas                │
│                               │
└───────────────────────────────┘
```

---

## Slide 32: Agradecimentos
```
╔════════════════════════════════════════╗
║                                        ║
║          OBRIGADO! 🙏                  ║
║                                        ║
║      Dúvidas? Perguntas?               ║
║                                        ║
║     Estamos à disposição!              ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 📝 Notas para o Apresentador

### Tempo Estimado: 25-30 minutos

**Introdução (2 min)**
- Slides 1-3: Apresentar o problema e a solução

**Perfis e Estrutura (3 min)**
- Slides 4-5: Explicar perfis e estrutura de grupos

**Cálculo de Preços (5 min)**
- Slides 6-9: Detalhar fórmula e exemplos
- **IMPORTANTE**: Usar exemplos reais com números

**Contratos (3 min)**
- Slides 10-11: Explicar contratos com clientes e motoboys

**Fluxo Operacional (4 min)**
- Slides 12-14: Seleção de motoboy e fluxo de entrega
- **IMPORTANTE**: Mostrar exemplo completo

**Dashboards (2 min)**
- Slides 15-17: Visões por perfil e mapa

**Tecnologia (2 min)**
- Slide 18: Stack tecnológico

**Diferenciais (3 min)**
- Slides 19-21: Por que escolher o MVT

**Futuro (2 min)**
- Slide 22: Roadmap

**Cases e Comparativo (2 min)**
- Slides 23-24: Casos de uso e comparação

**Demo (5 min)** ⭐ CRUCIAL
- Slide 25: Demonstração ao vivo

**Fechamento (2 min)**
- Slides 29-31: Planos e call to action

### Dicas:
- Use pausas estratégicas após números importantes
- Pergunte se há dúvidas a cada seção
- Mantenha contato visual com a audiência
- Tenha exemplos extras preparados
- Se possível, mostre o sistema funcionando

### Backup:
- Tenha screenshots do sistema
- Prepare vídeo demo (caso internet falhe)
- Imprima documentação principal
