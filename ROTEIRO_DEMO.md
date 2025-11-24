# 🎬 Zapi10 - Roteiro de Demonstração Detalhado

## ⏱️ Tempo Total: 5 minutos

---

## 🎯 OBJETIVO DA DEMONSTRAÇÃO

Mostrar de forma clara e rápida:
1. Como criar um grupo
2. Como configurar contrato com cliente
3. Como configurar zona especial
4. **⭐ Como criar uma entrega com cálculo automático**

---

## 📋 PREPARAÇÃO (Fazer ANTES da apresentação)

### 1. Dados de Teste Prontos

#### Grupo de Teste:
```
Nome: Entregas Rápidas Premium
Descrição: Grupo de entregas expressas
Gerente: [Selecionar gerente existente]
```

#### Cliente de Teste:
```
Nome: Restaurante Pizza Express
E-mail: pizza@express.com
CPF: 123.456.789-00
Telefone: (11) 98765-4321
Endereço: Rua das Flores, 100, Centro
```

#### Motoboys de Teste (pelo menos 3):
```
1. João Silva - Contrato Ativo
2. Maria Santos - Contrato Ativo
3. Pedro Costa - Contrato Ativo
```

#### Zona Especial de Teste:
```
Nome: Centro Histórico
Tipo: Multiplicador
Multiplicador: 1.3×
```

### 2. Abas do Navegador:
```
Aba 1: Login (https://mvt-fe.onrender.com/login)
Aba 2: Dashboard (já logado como Administrador)
Aba 3: Google Maps (backup para mostrar distâncias)
```

### 3. Checklist Técnico:
- [ ] Sistema carregado e funcionando
- [ ] Login feito como Administrador
- [ ] Zoom do navegador em 100%
- [ ] Resolução da tela adequada
- [ ] Internet estável

---

## 🎬 ROTEIRO PASSO-A-PASSO

### 📍 DEMONSTRAÇÃO 1: Dashboard Geral (30 segundos)

**O QUE FAZER:**
```
1. Mostrar tela inicial do dashboard
2. Apontar menu lateral
3. Mencionar perfis diferentes
```

**O QUE DIZER:**
> "Aqui está o painel do Administrador. Veja o menu lateral: temos Grupos, Motoboys, Clientes, Entregas, e Zonas Especiais. Cada perfil de usuário vê apenas o que é relevante para ele."

**TEMPO: 30s**

---

### 📍 DEMONSTRAÇÃO 2: Visualizar Grupo (1 minuto)

**O QUE FAZER:**
```
1. Clicar em "Grupos" no menu
2. Abrir grupo "Express Delivery Premium"
3. Mostrar seção "Contratos de Motoboy"
4. Expandir um contrato para mostrar detalhes
```

**O QUE DIZER:**
> "Vamos ver um grupo. Aqui temos o 'Entregas Rápidas Premium'. 
> Veja: ele tem um gerente responsável e uma lista de motoboys contratados.
> [Expandir contrato]
> Cada contrato define: período, salário base, e a taxa de comissão. 
> Este motoboy recebe 85% de cada entrega que faz."

**PONTOS-CHAVE:**
- ✅ Nome do grupo
- ✅ Gerente responsável
- ✅ Lista de contratos
- ✅ Taxa de comissão (85%)

**TEMPO: 1 min**

---

### 📍 DEMONSTRAÇÃO 3: Contrato com Cliente (1 minuto)

**O QUE FAZER:**
```
1. Clicar em "Clientes" no menu
2. Abrir cliente "Restaurante Pizza Express"
3. Rolar até seção "Contratos de Serviço"
4. Expandir contrato existente
```

**O QUE DIZER:**
> "Agora vamos ver um cliente: Restaurante Pizza Express.
> Na seção de Contratos de Serviço, vemos os termos comerciais:
> [Apontar para valores]
> • Valor Mínimo: R$ 10,00 - nunca cobra menos que isso
> • Valor por Km: R$ 3,50 - multiplica pela distância
> • Desconto: 0% - mas poderia ter desconto especial
> Esses valores são usados para calcular o preço de cada entrega."

**PONTOS-CHAVE:**
- ✅ Valor Mínimo (R$ 10,00)
- ✅ Valor por Km (R$ 3,50)
- ✅ Personalização por cliente

**TEMPO: 1 min**

---

### 📍 DEMONSTRAÇÃO 4: Zona Especial (30 segundos)

**O QUE FAZER:**
```
1. Clicar em "Zonas Especiais" no menu
2. Mostrar mapa com zonas coloridas
3. Clicar em uma zona para mostrar detalhes
```

**O QUE DIZER:**
> "As zonas especiais aparecem coloridas no mapa.
> [Clicar em zona]
> Esta zona 'Centro Histórico' tem multiplicador de 1.3×.
> Significa que entregas que passam aqui custam 30% a mais.
> Isso compensa áreas de difícil acesso, trânsito pesado, ou riscos especiais."

**PONTOS-CHAVE:**
- ✅ Visual no mapa
- ✅ Multiplicador 1.3×
- ✅ Motivo: compensar dificuldade

**TEMPO: 30s**

---

### 📍 DEMONSTRAÇÃO 5: ⭐ CRIAR ENTREGA (2 minutos) - PRINCIPAL!

**O QUE FAZER:**
```
1. Clicar em "Entregas" no menu
2. Clicar em "Criar Novo"
3. Preencher formulário passo-a-passo
4. ENFATIZAR cálculo automático
5. MOSTRAR seleção de motoboy
```

**SCRIPT DETALHADO:**

#### Passo 1: Cliente (10s)
```
[Clicar em campo "Cliente"]
[Selecionar "Restaurante Pizza Express"]
```
> "Primeiro, seleciono o cliente. Veja que o sistema já carrega automaticamente a organização vinculada ao contrato."

#### Passo 2: Endereços (30s)
```
[Clicar em campo "Origem"]
[Digitar: "Rua das Flores, 100, Centro"]
[Aguardar autocomplete do Google Maps]
[Selecionar endereço]
```
> "Agora, o endereço de origem. Usamos Google Maps - veja como sugere endereços enquanto digito."

```
[Clicar em campo "Destino"]
[Digitar: "Avenida Paulista, 1000"]
[Selecionar endereço]
```
> "E o destino. Assim que seleciono ambos..."

#### Passo 3: ⭐ CÁLCULO AUTOMÁTICO (30s)
```
[Aguardar sistema calcular]
[APONTAR para campo "Distance"]
[APONTAR para campo "Price"]
```
> "**VEJA AQUI!** O sistema calculou AUTOMATICAMENTE:
> • Distância: 4,5 km [APONTAR]
> • Preço: R$ 15,75 [APONTAR]
> 
> Como chegou nesse valor?
> 4,5 km × R$ 3,50 (do contrato) = R$ 15,75
> 
> [Se tiver zona especial]
> E como a origem está na zona Centro (1.3×):
> R$ 15,75 × 1.3 = R$ 20,48 FINAL
> 
> **Tudo isso em menos de 1 segundo!**"

#### Passo 4: Detalhes (15s)
```
[Preencher campo "Descrição"]
Texto: "2 pizzas grandes"

[Preencher campo "Observações"]
Texto: "Entregar no portão lateral"
```
> "Adiciono descrição do pedido e observações especiais."

#### Passo 5: Selecionar Motoboy (30s)
```
[Clicar em campo "Courier"]
[Mostrar lista dropdown]
```
> "Agora, seleciono o motoboy. **VEJA**: o sistema mostra apenas motoboys:
> • Com contrato ATIVO no grupo
> • DISPONÍVEIS no momento
> • Ordenados por PROXIMIDADE
> 
> [APONTAR para cada nome]
> João Silva está a 1,2 km - mais próximo
> Maria Santos a 2,5 km
> Pedro Costa a 3,1 km
> 
> Vou escolher o João por estar mais perto."

```
[Selecionar "João Silva"]
```

#### Passo 6: Salvar (15s)
```
[Clicar em botão "Salvar" ou "Criar"]
[Aguardar confirmação]
```
> "Salvo e pronto! Entrega criada. João já recebe notificação e pode aceitar. Todo o processo levou menos de 1 minuto."

**PONTOS-CHAVE DA DEMO DE ENTREGA:**
- ✅ Autocomplete de endereços
- ✅ **⭐ Cálculo automático de distância**
- ✅ **⭐ Cálculo automático de preço**
- ✅ Explicação clara da fórmula
- ✅ Lista filtrada de motoboys
- ✅ Ordenação por proximidade
- ✅ Rapidez do processo

**TEMPO: 2 min**

---

## 💡 DICAS DURANTE A DEMONSTRAÇÃO

### Se o sistema estiver lento:
> "Enquanto carrega, deixa eu explicar o que está acontecendo... [continuar explicação]"

### Se houver erro:
> "Vou anotar isso para nossa equipe corrigir. Mas o processo seria assim... [explicar]"

### Se esquecer algo:
> "Ah, deixa eu mostrar também... [voltar para mostrar]"

### Para manter atenção:
> "Prestem atenção nesta parte..." [antes de cálculo automático]
> "Isso é muito legal..." [enfatizar pontos fortes]
> "Vocês viram como foi rápido?" [após completar]

---

## 🎯 O QUE A AUDIÊNCIA DEVE SAIR SABENDO

Após a demo, todos devem entender:

1. ✅ Sistema calcula preço automaticamente
2. ✅ Usa distância real do Google Maps
3. ✅ Considera zonas especiais no cálculo
4. ✅ Mostra apenas motoboys disponíveis
5. ✅ Todo processo é rápido (< 1 minuto)

---

## 📸 MOMENTOS PARA "PAUSAR" E ENFATIZAR

### Momento 1: Quando mostrar cálculo automático
```
[PAUSA 2 SEGUNDOS]
[APONTAR para números na tela]
> "Vejam: distância E preço calculados automaticamente"
[PAUSA 2 SEGUNDOS]
```

### Momento 2: Quando explicar fórmula
```
[ESCREVER no quadro ou slide]
4,5 km × R$ 3,50 = R$ 15,75
[PAUSA]
> "Simples assim. Transparente para todos"
```

### Momento 3: Quando mostrar lista de motoboys
```
[APONTAR para cada nome]
> "João - 1,2 km"
[PAUSA]
> "Maria - 2,5 km"
[PAUSA]
> "Pedro - 3,1 km"
[PAUSA]
> "Ordenado automaticamente por proximidade"
```

---

## 🔄 PLANO B: Se Demo Falhar

### Opção 1: Screenshots
Ter prints de tela de cada passo salvos em uma pasta

### Opção 2: Vídeo Gravado
Ter vídeo de 2 min da demo rodando

### Opção 3: Explicação com Slides
```
"O sistema está instável no momento, mas vou explicar 
exatamente como funciona usando os slides..."
[Mostrar slides com screenshots]
```

---

## ✅ CHECKLIST FINAL PRÉ-DEMO

**5 minutos antes:**
- [ ] Sistema aberto e funcionando
- [ ] Login feito
- [ ] Zoom 100%
- [ ] Sem notificações pop-up
- [ ] Internet estável
- [ ] Backup preparado (screenshots/vídeo)

**1 minuto antes:**
- [ ] Respirar fundo
- [ ] Beber água
- [ ] Revisar ordem: Dashboard → Grupo → Cliente → Zona → Entrega
- [ ] Mentalizar: "Vai dar certo!"

---

## 🎤 FRASE DE TRANSIÇÃO PARA DEMO

> "Agora, vou fazer uma demonstração ao vivo do sistema. Vou criar uma entrega do zero, e vocês vão ver exatamente como o cálculo automático funciona. Prestem atenção especialmente quando eu inserir os endereços - o sistema vai calcular distância e preço em tempo real."

---

## 🏁 FRASE DE FECHAMENTO DA DEMO

> "E pronto! Viram como foi rápido? Menos de 1 minuto para criar uma entrega completa, com preço calculado automaticamente e motoboy selecionado. Na prática, isso economiza HORAS de trabalho manual por dia."

---

## 📊 MÉTRICAS PARA MENCIONAR

Durante a demo, enfatizar:

- ⚡ **< 1 segundo**: Cálculo de preço
- 🗺️ **100% preciso**: Distância do Google Maps
- 👥 **Filtrado**: Apenas motoboys disponíveis
- 💰 **Transparente**: Fórmula visível para todos
- ⏱️ **< 1 minuto**: Criar entrega completa

---

**VOCÊ VAI ARRASAR! 🚀**

Lembre-se: pratique a demo pelo menos 3 vezes antes da apresentação real. Quanto mais natural você estiver com o sistema, mais confiança vai passar para a audiência.

**BOA SORTE!** 🍀
