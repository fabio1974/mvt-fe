# 🚚 Zapi10 - Sistema de Gestão de Entregas

## 📋 Documentação para Apresentação

**Data**: 24 de Novembro de 2025  
**Versão**: 1.0  

---

## 📑 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Funcionalidades Principais](#2-funcionalidades-principais)
3. [Gestão de Grupos (Organizações)](#3-gestão-de-grupos-organizações)
4. [Contratos com Clientes](#4-contratos-com-clientes)
5. [Cálculo de Preço de Frete](#5-cálculo-de-preço-de-frete)
6. [Seleção de Motoboy](#6-seleção-de-motoboy)
7. [Zonas Especiais](#7-zonas-especiais)
8. [Fluxo de Trabalho](#8-fluxo-de-trabalho)

---

## 1. Visão Geral do Sistema

### 🎯 Objetivo
O **Zapi10** é uma plataforma completa para gestão de entregas que conecta **Grupos de Motoboys**, **Clientes** e **Entregas**, oferecendo cálculo inteligente de preços baseado em distância e zonas especiais.

### 👥 Perfis de Usuário

#### **1.1 Administrador**
- Acesso total ao sistema
- Gerenciamento de todos os módulos
- Configurações globais
- Gestão de zonas especiais
- Supervisão de todos os grupos

**Funcionalidades disponíveis:**
- ✅ Gerenciar Grupos (criar, editar, excluir)
- ✅ Gerenciar Motoboys
- ✅ Gerenciar Clientes
- ✅ Gerenciar Entregas
- ✅ Configurar Zonas Especiais
- ✅ Configurações do Sistema
- ✅ Visualizar todos os dados

#### **1.2 Gerente de Grupo**
- Gerencia seu próprio grupo de motoboys
- Visualiza entregas do seu grupo
- Acessa balanço financeiro
- Gerencia contratos com motoboys

**Funcionalidades disponíveis:**
- ✅ Visualizar/Editar seu Grupo (apenas o próprio)
- ✅ Visualizar Entregas do seu grupo
- ✅ Balanço Financeiro
- ✅ Gerenciar Dados Pessoais
- ❌ Não pode criar novos grupos
- ❌ Não pode deletar grupos

#### **1.3 Cliente**
- Solicita entregas
- Gerencia seus próprios dados
- Visualiza histórico de entregas
- Realiza pagamentos diários

**Funcionalidades disponíveis:**
- ✅ Solicitar Entregas
- ✅ Visualizar suas Entregas
- ✅ Pagamento Diário
- ✅ Gerenciar Dados Pessoais

#### **1.4 Motoboy**
- Visualiza entregas atribuídas
- Atualiza status de entregas
- Gerencia dados pessoais

**Funcionalidades disponíveis:**
- ✅ Visualizar Entregas Atribuídas
- ✅ Atualizar Status de Entregas
- ✅ Gerenciar Dados Pessoais

---

## 2. Funcionalidades Principais

### 📦 **2.1 Gestão de Entregas**
- Criação de entregas com origem e destino
- Cálculo automático de distância via Google Maps
- Cálculo inteligente de preço baseado em múltiplos fatores
- Seleção automática ou manual de motoboy
- Rastreamento de status em tempo real
- Histórico completo de entregas

### 👨‍💼 **2.2 Gestão de Usuários**
- **Motoboys**: Cadastro com dados pessoais, documentos e localização
- **Clientes**: Cadastro com dados empresariais e contratos
- **Grupos**: Organização de motoboys em equipes gerenciadas por ORGANIZER

### 💰 **2.3 Sistema Financeiro**
- Cálculo automático de preços
- Pagamento diário para clientes
- Balanço financeiro para organizadores
- Histórico de transações

### 🗺️ **2.4 Geolocalização Avançada**
- Integração com Google Maps API
- Cálculo de distância em tempo real
- Seleção de endereços via autocomplete
- Visualização de rotas em mapa
- Zonas especiais com preços diferenciados

### 📊 **2.5 Relatórios e Dashboard**
- Dashboard personalizado por perfil
- Filtros avançados de pesquisa
- Exportação de dados
- Métricas em tempo real

---

## 3. Gestão de Grupos (Organizações)

### 🏢 **3.1 Conceito de Grupo**

Um **Grupo** (ou Organização) é uma entidade que agrupa motoboys sob um gerente. Cada grupo funciona como uma empresa de entregas independente dentro da plataforma.

### **3.2 Estrutura de um Grupo**

```
Grupo (Organização)
├── Nome
├── Descrição
├── Gerente Responsável
├── Contratos de Motoboys
│   ├── Motoboy 1
│   ├── Motoboy 2
│   └── Motoboy N
└── Configurações Específicas
```

### **3.3 Criação de um Grupo (Administrador)**

#### **Passo 1: Acessar Gestão de Grupos**
1. Login como ADMIN
2. Menu lateral → "Grupos"
3. Botão "Criar Novo"

#### **Passo 2: Preencher Informações Básicas**
- **Nome**: Nome do grupo/empresa
- **Descrição**: Descrição detalhada do grupo
- **Owner**: Selecionar o gerente (usuário com role ORGANIZER)

#### **Passo 3: Adicionar Contratos de Motoboys**
Na seção **"Contratos de Motoboy"**:
1. Clique em "Adicionar Contrato de Motoboy"
2. Selecione o motoboy (usuário com role COURIER)
3. Defina:
   - **Data de Início**: Quando o contrato começa
   - **Data de Fim**: (Opcional) Quando o contrato termina
   - **Salário Base**: Valor base do motoboy
   - **Taxa de Comissão**: Percentual que o motoboy recebe por entrega
   - **Status**: Ativo/Inativo

#### **Passo 4: Salvar**
- Sistema valida os dados
- Cria o grupo
- Associa os motoboys ao grupo via contratos

### **3.4 Visualização/Edição de Grupo (ORGANIZER)**

#### **Como ORGANIZER acessa seu grupo:**
1. Login como ORGANIZER
2. Menu lateral → "Grupo" (automaticamente filtrado)
3. Visualiza apenas SEU grupo (filtro automático por owner)

#### **Restrições:**
- ❌ Não pode criar novos grupos
- ❌ Não pode deletar o grupo
- ✅ Pode editar informações do grupo
- ✅ Pode adicionar/remover motoboys via contratos
- ✅ Pode visualizar entregas do grupo

### **3.5 Contratos de Motoboy (Employment Contracts)**

#### **Estrutura do Contrato:**
```json
{
  "courier": "ID do Motoboy",
  "organization": "ID do Grupo",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "baseSalary": 2000.00,
  "commissionRate": 15.0,
  "status": "ACTIVE"
}
```

#### **Tipos de Status:**
- **ACTIVE**: Contrato ativo, motoboy pode receber entregas
- **INACTIVE**: Contrato inativo, motoboy não recebe entregas
- **PENDING**: Aguardando aprovação
- **TERMINATED**: Contrato encerrado

#### **Comissão:**
A `commissionRate` define quanto do valor da entrega o motoboy recebe.

**Exemplo:**
- Entrega custa R$ 25,00
- Comissão do motoboy: 95%
- Motoboy recebe: R$ 23,75
- Grupo recebe: R$ 1,25

---

## 4. Contratos com Clientes

### 🤝 **4.1 Conceito de Contrato com Cliente**

Um **Contrato de Cliente** (Client Contract) define os termos comerciais entre um cliente e um grupo de motoboys para realização de entregas.

### **4.2 Estrutura de um Contrato de Cliente**

```
Contrato de Cliente (Client Contract)
├── Cliente (CLIENT)
├── Grupo/Organização (ORGANIZATION)
├── Dados do Contrato
│   ├── Data de Início
│   ├── Data de Fim
│   ├── Valor Mínimo por Entrega
│   ├── Valor por Km
│   ├── Desconto Especial
│   └── Status
└── Entregas Realizadas
```

### **4.3 Criação de Contrato com Cliente**

#### **Passo 1: Cadastrar Cliente**
1. Login como ADMIN
2. Menu → "Clientes"
3. Criar novo cliente (role: CLIENT)
4. Preencher dados:
   - Nome
   - E-mail
   - CPF/CNPJ
   - Telefone
   - Endereço completo

#### **Passo 2: Criar Contrato**
Na página do cliente, seção **"Contratos de Serviço"**:

1. Clique em "Adicionar Contrato de Serviço"
2. Preencher:
   - **Organização**: Selecionar o grupo que prestará o serviço
   - **Data de Início**: Quando o contrato começa
   - **Data de Fim**: (Opcional) Data de término
   - **Valor Mínimo**: Valor mínimo cobrado por entrega (ex: R$ 10,00)
   - **Valor por Km**: Valor cobrado por quilômetro (ex: R$ 3,50/km)
   - **Taxa de Desconto**: Desconto especial (opcional, em %)
   - **Status**: Ativo/Inativo

#### **Exemplo de Configuração:**
```
Cliente: Restaurante do João
Organização: Grupo Express Delivery
Data Início: 01/11/2025
Valor Mínimo: R$ 10,00
Valor por Km: R$ 3,50
Desconto: 0%
Status: ACTIVE
```

### **4.4 Como o Contrato Afeta o Preço**

O contrato define os **parâmetros base** para cálculo do frete:
- Se não houver contrato: Usa valores padrão do sistema
- Se houver contrato: Usa valores personalizados do contrato

**Ordem de Prioridade:**
1. Valores do contrato específico
2. Valores padrão da organização
3. Valores padrão do sistema

---

## 5. Cálculo de Preço de Frete

### 💵 **5.1 Visão Geral do Cálculo**

O sistema calcula o preço do frete baseado em uma **lógica inteligente** que considera múltiplos fatores:

```
Preço Final = MAX(Valor Mínimo, Valor Base + Valor Distância + Valor Zona Especial)
```

### **5.2 Componentes do Cálculo**

#### **A) Valor Mínimo**
- Define o menor valor que pode ser cobrado por uma entrega
- Protege contra entregas muito curtas serem não lucrativas
- Pode ser definido por:
  - Contrato específico do cliente
  - Configuração padrão da organização
  - Valor padrão do sistema (R$ 10,00)

**Exemplo:**
- Valor Mínimo: R$ 10,00
- Se o cálculo resultar em R$ 8,00, cobra-se R$ 10,00

#### **B) Valor por Distância**
- Cálculo proporcional à distância percorrida
- Fórmula: `Distância (km) × Valor por Km`
- Usa distância real calculada pelo Google Maps

**Exemplo:**
- Distância: 5,2 km
- Valor por Km: R$ 3,50
- Valor Distância = 5,2 × 3,50 = **R$ 18,20**

#### **C) Zonas Especiais**
- Áreas do mapa com preços diferenciados
- Podem ter valor adicional fixo ou multiplicador
- Aplicado se origem OU destino estiver na zona especial

### **5.3 Lógica Detalhada do Cálculo**

```javascript
// Pseudocódigo do cálculo de preço

function calcularPrecoFrete(entrega) {
  // 1. Buscar parâmetros do contrato ou usar padrões
  const valorMinimo = buscarValorMinimo(entrega.client, entrega.organization);
  const valorPorKm = buscarValorPorKm(entrega.client, entrega.organization);
  
  // 2. Calcular distância via Google Maps
  const distanciaKm = calcularDistancia(entrega.origem, entrega.destino);
  
  // 3. Calcular valor base pela distância
  let valorBase = distanciaKm * valorPorKm;
  
  // 4. Verificar zonas especiais
  const zonaOrigem = buscarZonaEspecial(entrega.origem);
  const zonaDestino = buscarZonaEspecial(entrega.destino);
  
  let valorZonaEspecial = 0;
  
  // 4.1 Se origem está em zona especial
  if (zonaOrigem && zonaOrigem.active) {
    if (zonaOrigem.priceType === 'FIXED') {
      // Adiciona valor fixo
      valorZonaEspecial += zonaOrigem.additionalPrice;
    } else if (zonaOrigem.priceType === 'MULTIPLIER') {
      // Multiplica o valor base
      valorBase *= zonaOrigem.priceMultiplier;
    }
  }
  
  // 4.2 Se destino está em zona especial (e é diferente da origem)
  if (zonaDestino && zonaDestino.active && zonaDestino.id !== zonaOrigem?.id) {
    if (zonaDestino.priceType === 'FIXED') {
      valorZonaEspecial += zonaDestino.additionalPrice;
    } else if (zonaDestino.priceType === 'MULTIPLIER') {
      valorBase *= zonaDestino.priceMultiplier;
    }
  }
  
  // 5. Somar valores
  const valorCalculado = valorBase + valorZonaEspecial;
  
  // 6. Aplicar valor mínimo
  const precoFinal = Math.max(valorMinimo, valorCalculado);
  
  return {
    distanciaKm,
    valorMinimo,
    valorPorKm,
    valorBase,
    valorZonaEspecial,
    precoFinal
  };
}
```

### **5.4 Exemplos Práticos**

#### **Exemplo 1: Entrega Simples**
```
Cliente: Restaurante do João
Origem: Rua A, 100 → Destino: Rua B, 200
Distância: 3,5 km
Valor Mínimo: R$ 10,00
Valor por Km: R$ 3,50

Cálculo:
- Valor Base = 3,5 km × R$ 3,50 = R$ 12,25
- Sem zona especial
- Preço Final = MAX(R$ 10,00, R$ 12,25) = R$ 12,25
```

#### **Exemplo 2: Entrega com Zona Especial (Fixa)**
```
Cliente: Loja Center
Origem: Centro (Zona Especial) → Destino: Bairro Norte
Distância: 2,8 km
Valor Mínimo: R$ 10,00
Valor por Km: R$ 3,50
Zona "Centro": Tipo FIXED, Valor Adicional R$ 5,00

Cálculo:
- Valor Base = 2,8 km × R$ 3,50 = R$ 9,80
- Valor Zona Especial = R$ 5,00 (fixo)
- Valor Calculado = R$ 9,80 + R$ 5,00 = R$ 14,80
- Preço Final = MAX(R$ 10,00, R$ 14,80) = R$ 14,80
```

#### **Exemplo 3: Entrega com Zona Especial (Multiplicador)**
```
Cliente: Farmácia 24h
Origem: Bairro Sul → Destino: Ilha (Zona Especial)
Distância: 8,0 km
Valor Mínimo: R$ 10,00
Valor por Km: R$ 3,50
Zona "Ilha": Tipo MULTIPLIER, Multiplicador 1.5×

Cálculo:
- Valor Base = 8,0 km × R$ 3,50 = R$ 28,00
- Aplicar Multiplicador = R$ 28,00 × 1.5 = R$ 42,00
- Preço Final = MAX(R$ 10,00, R$ 42,00) = R$ 42,00
```

#### **Exemplo 4: Entrega Muito Curta (Valor Mínimo)**
```
Cliente: Padaria da Esquina
Origem: Rua C, 50 → Destino: Rua C, 150
Distância: 0,3 km
Valor Mínimo: R$ 10,00
Valor por Km: R$ 3,50

Cálculo:
- Valor Base = 0,3 km × R$ 3,50 = R$ 1,05
- Sem zona especial
- Preço Final = MAX(R$ 10,00, R$ 1,05) = R$ 10,00 ✅ (Valor Mínimo aplicado)
```

### **5.5 Parâmetros Configuráveis**

#### **Nível 1: Sistema (Padrão Global)**
```
Valor Mínimo: R$ 10,00
Valor por Km: R$ 3,50
```

#### **Nível 2: Organização**
Cada grupo pode ter seus próprios valores padrão

#### **Nível 3: Contrato de Cliente**
Valores específicos por cliente (prioridade máxima)

**Exemplo de Hierarquia:**
```
Sistema Default:      R$ 10,00 mínimo, R$ 3,50/km
Organização "Express": R$ 12,00 mínimo, R$ 4,00/km
Cliente "VIP Store":   R$ 15,00 mínimo, R$ 3,00/km ✅ (Usado)
```

---

## 6. Seleção de Motoboy

### 🏍️ **6.1 Momento da Seleção**

A seleção do motoboy ocorre durante a **criação de uma entrega**. O sistema oferece duas opções:

1. **Seleção Manual**: O usuário escolhe um motoboy específico
2. **Seleção Automática**: O sistema sugere o melhor motoboy (futuro)

### **6.2 Critérios de Seleção**

#### **Filtros Obrigatórios:**
1. ✅ **Contrato Ativo**: Motoboy deve ter contrato ativo com a organização
2. ✅ **Disponibilidade**: Motoboy não está em outra entrega no momento
3. ✅ **Status**: Motoboy está com status "Disponível"

#### **Critérios de Priorização (Seleção Automática):**
1. **Proximidade**: Distância do motoboy até o ponto de coleta
2. **Histórico**: Taxa de sucesso nas entregas
3. **Avaliação**: Nota média do motoboy
4. **Balanceamento**: Distribuição equitativa de entregas

### **6.3 Processo de Seleção Manual**

#### **Passo 1: Criar Entrega**
1. Login como ADMIN ou CLIENT
2. Menu → "Entregas"
3. Botão "Criar Novo"

#### **Passo 2: Preencher Dados da Entrega**
```
1. Dados do Cliente
   - Cliente: [Selecionar da lista]
   - Organização: [Automaticamente preenchido pelo contrato]

2. Endereços
   - Origem: [Buscar endereço com Google Maps]
   - Destino: [Buscar endereço com Google Maps]
   
3. Detalhes
   - Descrição: Ex: "2 pizzas grandes"
   - Observações: Ex: "Entregar no portão lateral"
   - Data/Hora de Coleta: [Selecionar]
```

#### **Passo 3: Sistema Calcula Automaticamente**
- ✅ Distância entre origem e destino
- ✅ Preço do frete (baseado nos critérios explicados)
- ✅ Mostra no formulário antes de salvar

#### **Passo 4: Selecionar Motoboy**
```
Campo: "Courier" (Motoboy)

Opções mostradas:
├── João Silva ⭐⭐⭐⭐⭐ (5.0) - 2,3 km de distância
├── Maria Santos ⭐⭐⭐⭐☆ (4.5) - 3,8 km de distância
└── Pedro Costa ⭐⭐⭐⭐⭐ (5.0) - 5,1 km de distância

* Mostra apenas motoboys com contrato ativo na organização selecionada
* Ordena por proximidade (se disponível)
```

#### **Passo 5: Confirmar e Criar**
- Sistema valida todos os dados
- Cria a entrega
- Notifica o motoboy selecionado
- Cliente pode acompanhar status

### **6.4 Estados de uma Entrega**

```
1. PENDING (Pendente)
   ↓
2. CONFIRMED (Confirmada pelo motoboy)
   ↓
3. PICKED_UP (Coletada)
   ↓
4. IN_TRANSIT (Em trânsito)
   ↓
5. DELIVERED (Entregue)
   
   OU
   
   CANCELLED (Cancelada)
```

### **6.5 Lógica de Disponibilidade**

#### **Quando um motoboy está disponível:**
```javascript
function motoboDisponivel(courier) {
  // Verificações:
  
  // 1. Tem contrato ativo?
  const contratoAtivo = temContratoAtivo(courier);
  
  // 2. Não está em entrega no momento?
  const semEntregaAtiva = !temEntregaEmAndamento(courier);
  
  // 3. Status do usuário está ativo?
  const statusAtivo = courier.status === 'ACTIVE';
  
  return contratoAtivo && semEntregaAtiva && statusAtivo;
}
```

#### **Informações Exibidas na Seleção:**
- Nome completo do motoboy
- Avaliação média (estrelas)
- Distância até o ponto de coleta (se disponível GPS)
- Número de entregas realizadas
- Taxa de sucesso

### **6.6 Futuras Melhorias (Seleção Automática)**

**Algoritmo de Seleção Inteligente:**
```
Pontuação = (
  (Proximidade × 0.4) +
  (Avaliação × 0.3) +
  (Taxa de Sucesso × 0.2) +
  (Balanceamento × 0.1)
)

Motoboy com maior pontuação é selecionado automaticamente
```

---

## 7. Zonas Especiais

### 🗺️ **7.1 Conceito**

**Zonas Especiais** são áreas geográficas delimitadas no mapa onde o preço de frete segue regras diferenciadas. Exemplos:
- Áreas de difícil acesso
- Bairros nobres
- Zonas rurais
- Ilhas
- Centros históricos

### **7.2 Tipos de Zonas Especiais**

#### **Tipo 1: FIXED (Valor Fixo Adicional)**
Adiciona um valor fixo ao preço da entrega

```
Exemplo: Zona "Ilha"
- Tipo: FIXED
- Valor Adicional: R$ 8,00
- Motivo: Necessita travessia de balsa

Entrega de R$ 15,00 + R$ 8,00 = R$ 23,00
```

#### **Tipo 2: MULTIPLIER (Multiplicador)**
Multiplica o valor base da entrega

```
Exemplo: Zona "Morro Alto"
- Tipo: MULTIPLIER
- Multiplicador: 1.5× (50% a mais)
- Motivo: Estrada íngreme e perigosa

Entrega de R$ 20,00 × 1.5 = R$ 30,00
```

### **7.3 Configuração de Zona Especial**

#### **Passo 1: Acessar Zonas Especiais**
1. Login como ADMIN
2. Menu → "Zonas Especiais"
3. Mapa interativo é exibido

#### **Passo 2: Desenhar Zona no Mapa**
1. Ferramentas disponíveis:
   - **Polígono**: Desenhar área personalizada
   - **Círculo**: Definir raio a partir de um ponto
   - **Retângulo**: Área retangular

2. Clicar e arrastar para criar a forma
3. Ajustar pontos conforme necessário

#### **Passo 3: Configurar Parâmetros**
```
Nome: "Centro Histórico"
Descrição: "Área de difícil acesso com ruas estreitas"
Cor: #FF5733 (para visualização no mapa)

Tipo de Preço:
( ) FIXED - Valor Adicional
(•) MULTIPLIER - Multiplicador

[Se FIXED]
Valor Adicional: R$ 5,00

[Se MULTIPLIER]
Multiplicador: 1.3× (30% a mais)

Status: [✓] Ativa
```

#### **Passo 4: Salvar**
- Sistema salva as coordenadas geográficas
- Zona fica visível no mapa
- Passa a afetar cálculos de entregas

### **7.4 Como o Sistema Detecta Zona Especial**

```javascript
// Pseudocódigo de detecção

function verificarZonaEspecial(latitude, longitude) {
  // Busca todas as zonas ativas
  const zonasAtivas = buscarZonasAtivas();
  
  for (const zona of zonasAtivas) {
    // Verifica se o ponto está dentro do polígono da zona
    if (pontoEstaDentroDoPoligono(latitude, longitude, zona.coordenadas)) {
      return zona; // Retorna a primeira zona encontrada
    }
  }
  
  return null; // Não está em zona especial
}
```

### **7.5 Visualização no Mapa**

#### **Interface de Zonas Especiais:**
```
┌─────────────────────────────────────────────┐
│ 🗺️ Zonas Especiais                          │
├─────────────────────────────────────────────┤
│                                             │
│  [Mapa Interativo do Google Maps]          │
│                                             │
│  Legendas:                                  │
│  🟥 Zona FIXED - Valor Adicional            │
│  🟦 Zona MULTIPLIER - Multiplicador         │
│                                             │
│  Ferramentas:                               │
│  [✏️ Desenhar]  [🗑️ Excluir]  [💾 Salvar]  │
│                                             │
│  Lista de Zonas:                            │
│  • Centro Histórico (1.3×) [✓ Ativa]       │
│  • Ilha Grande (+R$ 8,00) [✓ Ativa]        │
│  • Zona Rural (+R$ 5,00) [✗ Inativa]       │
│                                             │
└─────────────────────────────────────────────┘
```

### **7.6 Exemplo de Aplicação Real**

**Cenário: Cidade Litorânea com Ilha**

```
Configuração:

Zona 1: "Centro"
- Tipo: MULTIPLIER
- Multiplicador: 1.2×
- Motivo: Trânsito intenso

Zona 2: "Ilha do Mel"
- Tipo: FIXED
- Adicional: R$ 10,00
- Motivo: Travessia de balsa

Zona 3: "Morro do Careca"
- Tipo: MULTIPLIER
- Multiplicador: 1.5×
- Motivo: Estrada íngreme
```

**Entrega 1: Centro → Bairro Normal**
- Distância: 4 km × R$ 3,50 = R$ 14,00
- Origem em zona "Centro": R$ 14,00 × 1.2 = R$ 16,80
- **Total: R$ 16,80**

**Entrega 2: Bairro Normal → Ilha do Mel**
- Distância: 8 km × R$ 3,50 = R$ 28,00
- Destino em zona "Ilha": R$ 28,00 + R$ 10,00 = R$ 38,00
- **Total: R$ 38,00**

**Entrega 3: Centro → Morro do Careca**
- Distância: 6 km × R$ 3,50 = R$ 21,00
- Origem em zona "Centro": R$ 21,00 × 1.2 = R$ 25,20
- Destino em zona "Morro": R$ 25,20 × 1.5 = R$ 37,80
- **Total: R$ 37,80**

---

## 8. Fluxo de Trabalho

### 🔄 **8.1 Fluxo Completo do Sistema**

```
┌─────────────────────────────────────────────────────────┐
│                    SETUP INICIAL                         │
└─────────────────────────────────────────────────────────┘
    │
    ├─► [ADMIN] Cadastra Grupos (Organizações)
    │       │
    │       └─► Define Owner (ORGANIZER)
    │
    ├─► [ADMIN] Cadastra Motoboys (COURIER)
    │       │
    │       └─► Cria Contratos com Grupos
    │           (Employment Contracts)
    │
    ├─► [ADMIN] Cadastra Clientes (CLIENT)
    │       │
    │       └─► Cria Contratos de Serviço
    │           (Client Contracts)
    │
    └─► [ADMIN] Configura Zonas Especiais
            │
            └─► Desenha áreas no mapa
                Define preços especiais

┌─────────────────────────────────────────────────────────┐
│                 OPERAÇÃO DIÁRIA                         │
└─────────────────────────────────────────────────────────┘
    │
    ├─► [CLIENT] Solicita Entrega
    │       │
    │       ├─► Informa origem e destino
    │       ├─► Sistema calcula distância
    │       ├─► Sistema calcula preço
    │       │   ├─► Valor mínimo
    │       │   ├─► Valor por km
    │       │   └─► Zona especial (se aplicável)
    │       │
    │       ├─► Seleciona motoboy
    │       │   ├─► Lista motoboys disponíveis
    │       │   └─► Mostra distância e avaliação
    │       │
    │       └─► Confirma criação
    │
    ├─► [COURIER] Recebe Notificação
    │       │
    │       ├─► Aceita entrega
    │       ├─► Coleta no origem
    │       ├─► Entrega no destino
    │       └─► Confirma conclusão
    │
    ├─► [ORGANIZER] Acompanha Entregas
    │       │
    │       ├─► Visualiza entregas do grupo
    │       ├─► Monitora status
    │       └─► Verifica balanço financeiro
    │
    └─► [ADMIN] Supervisiona Tudo
            │
            ├─► Visualiza todas entregas
            ├─► Ajusta configurações
            └─► Resolve problemas

┌─────────────────────────────────────────────────────────┐
│                  FINANCEIRO                             │
└─────────────────────────────────────────────────────────┘
    │
    ├─► [CLIENT] Pagamento Diário
    │       │
    │       └─► Paga pelas entregas do dia
    │
    ├─► [ORGANIZER] Balanço Financeiro
    │       │
    │       ├─► Receita total de entregas
    │       ├─► Comissões dos motoboys
    │       └─► Lucro do grupo
    │
    └─► [COURIER] Recebe Comissão
            │
            └─► Percentual definido no contrato
```

### **8.2 Exemplo de Fluxo Real**

**Cenário: Restaurante Pizza Express solicita entrega**

```
🕐 10:30 - Cliente cria entrega
├─ Cliente: "Restaurante Pizza Express"
├─ Origem: Rua das Flores, 100 - Centro
├─ Destino: Av. Principal, 5000 - Bairro Sul
├─ Descrição: "2 pizzas grandes"
└─ Sistema calcula:
   ├─ Distância: 4,5 km
   ├─ Valor base: 4,5 × R$ 3,50 = R$ 15,75
   ├─ Origem em "Centro" (zona 1.2×): R$ 15,75 × 1.2 = R$ 18,90
   └─ Preço final: R$ 18,90

🕐 10:31 - Cliente seleciona motoboy
├─ Opções disponíveis:
│  ├─ João Silva ⭐5.0 - 1,2 km
│  ├─ Maria Santos ⭐4.8 - 2,5 km
│  └─ Pedro Costa ⭐4.9 - 3,1 km
└─ Seleciona: João Silva (mais próximo)

🕐 10:32 - João recebe notificação
└─ Aceita entrega

🕐 10:45 - João chega ao restaurante
└─ Atualiza status: "PICKED_UP"

🕐 11:05 - João entrega ao cliente final
└─ Atualiza status: "DELIVERED"

🕐 18:00 - Cliente realiza pagamento diário
└─ Paga R$ 18,90 pela entrega

💰 Financeiro:
├─ Valor total: R$ 18,90
├─ Comissão João (95%): R$ 17,96
└─ Receita Grupo (5%): R$ 0,94
```

---

## 9. Tecnologias Utilizadas

### **Frontend**
- ⚛️ **React** + **TypeScript**: Interface moderna e tipada
- 🎨 **Tailwind CSS**: Estilização responsiva
- 🗺️ **Google Maps API**: Geolocalização e mapas
- 📊 **React Hook Form**: Gerenciamento de formulários
- 🚀 **Vite**: Build tool rápido

### **Backend**
- ☕ **Spring Boot**: Framework Java robusto
- 🗄️ **PostgreSQL**: Banco de dados relacional
- 🔐 **Spring Security**: Autenticação e autorização
- 📡 **REST API**: Comunicação cliente-servidor

### **Infraestrutura**
- ☁️ **Render.com**: Hospedagem cloud
- 🐳 **Docker**: Containerização
- 🔄 **CI/CD**: Deploy automático via Git

---

## 10. Benefícios da Solução

### ✅ **Para Administradores**
- Controle total do sistema
- Visão completa de operações
- Configuração flexível de preços
- Gestão de múltiplos grupos

### ✅ **Para Organizadores (Gerentes)**
- Gestão autônoma do grupo
- Controle de motoboys e contratos
- Balanço financeiro em tempo real
- Sem necessidade de intervenção de ADMIN

### ✅ **Para Clientes**
- Cálculo transparente de preços
- Seleção de motoboy confiável
- Acompanhamento em tempo real
- Pagamento simplificado

### ✅ **Para Motoboys**
- Recebe entregas compatíveis
- Sistema de comissão justo
- Interface simples para atualização
- Histórico de entregas

---

## 11. Diferenciais Competitivos

### 🌟 **1. Cálculo Inteligente de Preços**
- Múltiplos fatores considerados
- Zonas especiais personalizáveis
- Transparência total no cálculo

### 🌟 **2. Gestão de Múltiplos Grupos**
- Suporte para várias organizações independentes
- Cada grupo com autonomia financeira
- Sistema escalável

### 🌟 **3. Contratos Flexíveis**
- Personalização por cliente
- Valores diferenciados por contrato
- Histórico completo

### 🌟 **4. Geolocalização Precisa**
- Integração nativa com Google Maps
- Cálculo real de distância
- Zonas especiais visuais

### 🌟 **5. Interface Intuitiva**
- Design moderno e responsivo
- Navegação simplificada
- Feedback visual constante

---

## 12. Projeções Financeiras para Gerentes de Grupo

### 💰 **Análise de Rentabilidade - Grupo com 50 Motoboys**

Esta análise mostra o potencial de receita mensal para um gerente de grupo considerando diferentes cenários de operação.

#### **Premissas:**
- **Motoboys no grupo**: 50
- **Comissão do grupo**: 5% do valor de cada entrega
- **Comissão do motoboy**: 95% do valor de cada entrega
- **Dias úteis por mês**: 26 dias

---

### 📉 **Cenário PESSIMISTA**

```
Parâmetros:
├─ Entregas por motoboy/dia: 12 entregas
├─ Valor médio por entrega: R$ 6,50
├─ Motoboys ativos: 50
└─ Dias úteis/mês: 26

Cálculo Diário (por motoboy):
├─ Entregas: 12 × R$ 6,50 = R$ 78,00
├─ Comissão motoboy (95%): R$ 74,10
└─ Receita grupo (5%): R$ 3,90

Cálculo Mensal:
├─ Receita por motoboy/mês: R$ 3,90 × 26 dias = R$ 101,40
├─ Total 50 motoboys: R$ 101,40 × 50 = R$ 5.070,00
│
└─ 💵 RECEITA MENSAL DO GRUPO: R$ 5.070,00

Volume de Entregas:
└─ Total/mês: 12 × 50 × 26 = 15.600 entregas
```

**📊 Análise:**
- Cenário de baixa demanda ou início de operação
- Média de apenas 12 entregas por motoboy/dia
- Valor baixo por entrega (R$ 6,50)
- Gera receita consistente de ~R$ 5 mil/mês

---

### 📊 **Cenário NORMAL** (Esperado)

```
Parâmetros:
├─ Entregas por motoboy/dia: 20 entregas
├─ Valor médio por entrega: R$ 7,50
├─ Motoboys ativos: 50
└─ Dias úteis/mês: 26

Cálculo Diário (por motoboy):
├─ Entregas: 20 × R$ 7,50 = R$ 150,00
├─ Comissão motoboy (95%): R$ 142,50
└─ Receita grupo (5%): R$ 7,50

Cálculo Mensal:
├─ Receita por motoboy/mês: R$ 7,50 × 26 dias = R$ 195,00
├─ Total 50 motoboys: R$ 195,00 × 50 = R$ 9.750,00
│
└─ 💵 RECEITA MENSAL DO GRUPO: R$ 9.750,00

Volume de Entregas:
└─ Total/mês: 20 × 50 × 26 = 26.000 entregas

Renda do Motoboy:
└─ Cada motoboy ganha: R$ 142,50 × 26 = R$ 3.705,00/mês
```

**📊 Análise:**
- Cenário de operação normal e estável
- 20 entregas/dia é uma média saudável
- Valor médio de entrega R$ 7,50
- Grupo fatura quase R$ 10 mil/mês
- Motoboy ganha mais de R$ 3.700/mês trabalhando

---

### 📈 **Cenário OTIMISTA**

```
Parâmetros:
├─ Entregas por motoboy/dia: 28 entregas
├─ Valor médio por entrega: R$ 8,50
├─ Motoboys ativos: 50
└─ Dias úteis/mês: 26

Cálculo Diário (por motoboy):
├─ Entregas: 28 × R$ 8,50 = R$ 238,00
├─ Comissão motoboy (95%): R$ 226,10
└─ Receita grupo (5%): R$ 11,90

Cálculo Mensal:
├─ Receita por motoboy/mês: R$ 11,90 × 26 dias = R$ 309,40
├─ Total 50 motoboys: R$ 309,40 × 50 = R$ 15.470,00
│
└─ 💵 RECEITA MENSAL DO GRUPO: R$ 15.470,00

Volume de Entregas:
└─ Total/mês: 28 × 50 × 26 = 36.400 entregas

Renda do Motoboy:
└─ Cada motoboy ganha: R$ 226,10 × 26 = R$ 5.878,60/mês
```

**📊 Análise:**
- Cenário de alta demanda
- 28 entregas/dia é volume alto mas viável
- Valor médio maior (R$ 8,50) por entregas em áreas premium
- Grupo fatura mais de R$ 15 mil/mês
- Motoboy ganha mais de R$ 5.800/mês

---

### 📊 **Comparativo dos Cenários**

| Cenário | Entregas/Dia | Valor Médio | Receita Grupo/Mês | Renda Motoboy/Mês | Total Entregas/Mês |
|---------|--------------|-------------|-------------------|-------------------|--------------------|
| 😟 **Pessimista** | 12 | R$ 6,50 | **R$ 5.070** | R$ 2.313 | 15.600 |
| 😊 **Normal** | 20 | R$ 7,50 | **R$ 9.750** | R$ 3.705 | 26.000 |
| 🚀 **Otimista** | 28 | R$ 8,50 | **R$ 15.470** | R$ 5.879 | 36.400 |

**Variação:** De R$ 5 mil a R$ 15 mil/mês (diferença de 205%)

---

### 💡 **Fatores que Influenciam os Resultados**

#### **📈 Para Aumentar Receita:**
1. **Volume de Entregas**
   - Captar mais clientes (restaurantes, e-commerce)
   - Fidelizar clientes com contratos vantajosos
   - Marketing local e divulgação

2. **Valor Médio por Entrega**
   - Focar em áreas com maior ticket médio
   - Configurar zonas especiais em áreas premium
   - Negociar contratos com valores mais altos

3. **Eficiência Operacional**
   - Otimizar rotas dos motoboys
   - Reduzir tempo ocioso
   - Balancear distribuição de entregas

4. **Qualidade do Serviço**
   - Manter alto índice de satisfação
   - Entregas rápidas e seguras
   - Comunicação eficiente

#### **💰 Investimentos Necessários:**
- **Inicial**: Cadastro de motoboys, treinamento, divulgação
- **Recorrente**: Suporte, manutenção, marketing
- **Custos Fixos**: Sistema Zapi10, estrutura administrativa

---

### 🎯 **Conclusão Financeira**

O modelo de negócio com o Zapi10 demonstra:

✅ **Escalabilidade**: Quanto mais motoboys e entregas, maior o ganho  
✅ **Previsibilidade**: Receita consistente mês a mês  
✅ **Baixo Risco**: Modelo de comissão (ganha quando entrega acontece)  
✅ **Win-Win**: Motoboy ganha muito bem (95%), grupo também lucra (5%)  
✅ **Potencial Alto**: De R$ 5k a R$ 15k/mês com 50 motoboys  

**Mesmo no cenário pessimista, a operação é viável e lucrativa.**

---

## 13. Próximas Melhorias

### 🚀 **Melhorias em Desenvolvimento**

#### **Aplicativo Mobile para Motoboys**
- Aplicativo nativo Android/iOS
- GPS em tempo real
- Notificações instantâneas
- Interface otimizada para uso em movimento

#### **Seleção Automática de Motoboy com Inteligência Artificial**
- Algoritmo de IA para melhor match
- Consideração de múltiplos fatores (distância, histórico, avaliação)
- Aprendizado com histórico de entregas

#### **Sistema de Avaliação**
- Clientes avaliam motoboys
- Motoboys avaliam clientes
- Ranking e incentivos baseados em desempenho

#### **Integração com Pagamentos Online**
- Integração com plataformas de pagamento
- Pagamento automático via cartão/PIX
- Carteira digital para motoboys

#### **Análises Avançadas**
- Dashboard com métricas em tempo real
- Relatórios personalizados
- Previsão de demanda
- Indicadores de desempenho (KPIs)

---

## 📞 Contatos e Suporte

**Sistema**: Zapi10  
**Versão**: 1.0  
**Data**: Novembro 2025

---

## 🎯 Conclusão

O **Zapi10** é uma solução completa e moderna para gestão de entregas, oferecendo:

✅ **Flexibilidade**: Suporta múltiplos modelos de negócio  
✅ **Inteligência**: Cálculos automáticos e precisos  
✅ **Escalabilidade**: Cresce com seu negócio  
✅ **Transparência**: Todos os valores são claros  
✅ **Eficiência**: Processos otimizados  

A plataforma está em desenvolvimento contínuo para transformar a gestão de entregas, trazendo tecnologia de ponta e experiência de usuário excepcional para todos os envolvidos no processo logístico.

---

**Pronto para sua apresentação! 🚀**
