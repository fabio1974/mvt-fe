# Página "Minhas Inscrições" - Documentação

Esta página permite que os usuários visualizem e gerenciem todas as suas inscrições em eventos, incluindo status de pagamento e ações relacionadas.

## 🎯 Funcionalidades

### ✅ Visualização de Inscrições

- **Lista completa** de todas as inscrições do usuário
- **Filtros por status**: Todas, Pendentes, Confirmadas, Canceladas
- **Informações detalhadas** de cada evento
- **Status visual** com badges coloridos

### ✅ Gestão de Pagamentos

- **Pagamento direto** para inscrições pendentes
- **Retry de pagamentos** falhados
- **Modal de pagamento** integrado com sistema completo
- **Status de pagamento** em tempo real

### ✅ Ações Disponíveis

- **Ver evento** - Navega para página de detalhes do evento
- **Realizar pagamento** - Abre modal de pagamento
- **Tentar novamente** - Para pagamentos falhados

## 📋 Estrutura da Interface

### Header

```
Minhas Inscrições
Gerencie suas inscrições em eventos, pagamentos e certificados
```

### Filtros

- **Todas** (total de inscrições)
- **Pendentes** (aguardando pagamento)
- **Confirmadas** (pagas e confirmadas)
- **Canceladas** (canceladas pelo usuário ou sistema)

### Card de Inscrição

Cada inscrição é exibida em um card com:

#### Informações Principais

- **Nome do evento**
- **Preço** (se aplicável)
- **Status da inscrição** (badge)
- **Status do pagamento** (badge)

#### Detalhes do Evento

- **Data e hora** do evento
- **Local** (cidade, estado)
- **Tipo de evento** (corrida, caminhada, etc.)
- **Data da inscrição**

#### Ações

- **Ver Evento** - Botão azul
- **Realizar Pagamento** - Botão verde (se pendente)
- **Tentar Novamente** - Botão laranja (se falhou)

## 🎨 Estados Visuais

### Status de Inscrição

- **Pendente** - Amarelo (⏰) - Aguardando pagamento
- **Confirmada** - Verde (✅) - Inscrição confirmada
- **Cancelada** - Vermelho (❌) - Inscrição cancelada
- **Expirada** - Cinza (⚠️) - Prazo de pagamento expirou

### Status de Pagamento

- **Pagamento Pendente** - Amarelo (💵)
- **Processando** - Azul (💵)
- **Pago** - Verde (💵)
- **Falha no Pagamento** - Vermelho (💵)
- **Cancelado** - Cinza (💵)

## 🔧 Integração com Backend

### Endpoint Principal

```typescript
GET / api / registrations / my - registrations;
```

**Response:**

```typescript
interface Registration {
  id: number;
  event: {
    id: number;
    name: string;
    description: string;
    eventDate: string;
    location: string;
    city: string;
    state: string;
    eventType: string;
    price?: number;
    slug?: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  registrationDate: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  paymentStatus:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  paymentId?: string;
  paymentAmount?: number;
  notes?: string;
}
```

## 🚀 Fluxo de Pagamento

### 1. Usuário clica em "Realizar Pagamento"

- Modal de pagamento abre
- Sistema carrega PaymentProcessor com ID da inscrição

### 2. PaymentProcessor

- Mostra métodos de pagamento disponíveis
- Calcula taxas automaticamente
- Processa pagamento escolhido

### 3. Após Pagamento

- Modal fecha
- Lista de inscrições atualiza
- Status muda para "Processando" → "Pago"

## 📱 Responsividade

### Mobile (≤ 768px)

- Cards em coluna única
- Informações empilhadas
- Botões em layout vertical
- Modal de pagamento ocupa toda tela

### Tablet (769px - 1024px)

- Cards com 2 colunas de informações
- Botões em linha
- Modal centralizado

### Desktop (≥ 1025px)

- Cards com 4 colunas de informações
- Layout completo otimizado
- Modal com largura máxima

## 🎯 UX/UI Features

### Loading States

- **Carregamento inicial** - Spinner centralizado
- **Atualizações** - Estados de loading nos botões
- **Pagamento** - Loading no PaymentProcessor

### Empty States

- **Nenhuma inscrição** - Ilustração + CTA para explorar eventos
- **Filtro vazio** - Mensagem específica por filtro
- **Erro** - Mensagem de erro com opção de retry

### Feedback Visual

- **Hover states** em botões e cards
- **Transitions** suaves
- **Focus states** para acessibilidade
- **Loading indicators** durante ações

## 🔒 Segurança e Validação

### Autenticação

- Usuário deve estar logado
- Redirecionamento automático para login se necessário
- Token de autenticação enviado automaticamente

### Validação de Dados

- Verificação de propriedade da inscrição
- Validação de status antes de ações
- Proteção contra manipulação de dados

## 🧪 Cenários de Teste

### Casos de Uso Principais

1. **Usuário sem inscrições** - Empty state
2. **Usuário com inscrições pendentes** - Botão de pagamento
3. **Usuário com pagamento falhado** - Botão retry
4. **Usuário com inscrições confirmadas** - Apenas visualização
5. **Filtragem por status** - Contadores corretos

### Casos Edge

1. **Evento expirado** - Status de expirado
2. **Pagamento em processamento** - Status de processando
3. **Erro de rede** - Mensagem de erro
4. **Token expirado** - Redirecionamento para login

## 🔄 Integração com Outras Páginas

### Navegação Para

- **Página do evento** (via slug ou ID)
- **Login** (se não autenticado)
- **Home** (explorar eventos)

### Navegação De

- **Sidebar** - Link "Minhas Inscrições"
- **Header** - Menu do usuário
- **Página de sucesso de pagamento** - Após confirmação

## 📊 Métricas Possíveis

### Engagement

- Tempo na página
- Taxa de conversão de pagamento
- Uso dos filtros

### Performance

- Tempo de carregamento
- Taxa de erro de pagamentos
- Abandono no checkout

## 🚧 Próximas Funcionalidades

### Curto Prazo

- **Cancelamento de inscrições**
- **Comprovantes/recibos de pagamento**
- **Certificados digitais**

### Médio Prazo

- **Compartilhamento nas redes sociais**
- **Sistema de lembretes**
- **Avaliação de eventos**

### Longo Prazo

- **Histórico detalhado**
- **Analytics pessoais**
- **Integração com calendário**

---

## 📋 Checklist de Implementação

### ✅ Concluído

- [x] Componente MyRegistrationsPage criado
- [x] Integração com PaymentProcessor
- [x] Filtros por status
- [x] Cards responsivos
- [x] Estados de loading/error/empty
- [x] Modal de pagamento
- [x] Rota configurada (/minhas-inscricoes)
- [x] Link no sidebar
- [x] TypeScript completo
- [x] Build sem erros

### ⏳ Pendente (Backend)

- [ ] Endpoint /api/registrations/my-registrations
- [ ] Estrutura de dados Registration
- [ ] Vinculação com sistema de pagamentos
- [ ] Status de expiração automática

### 🔮 Futuro

- [ ] Cancelamento de inscrições
- [ ] Download de comprovantes
- [ ] Sistema de certificados
- [ ] Notificações push

---

A página está **100% implementada no frontend** e pronta para ser integrada com o backend! 🎉
