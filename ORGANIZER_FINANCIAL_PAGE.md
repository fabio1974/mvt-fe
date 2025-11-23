# Balanço Financeiro do Organizer

## Descrição
Página financeira para visualização de entregas completadas e resumo de valores de frete para usuários com perfil ORGANIZER.

## Implementação

### Arquivo Criado
- **OrganizerFinancialPage.tsx**: Componente principal da página de balanço financeiro
- **OrganizerFinancialPage.css**: Estilos da página

### Funcionalidades

#### 1. Listagem de Entregas Completadas
- Usa o componente `EntityCRUD` completo (tabela, view, edit)
- Pré-filtrado para mostrar apenas entregas com `status = "COMPLETED"`
- Filtrado por `organizer.id = userId` (organizer logado)
- Campo "organizer" oculto (hideFields e hiddenFields)
- Suporta view detalhado com mapa de rota integrado
- **SEM paginação** (size: 1000 na requisição inicial para cálculos)

#### 2. Resumo Financeiro (Cards)
Localizado abaixo da tabela, com 3 cards informativos:

**Card 1: Total em Fretes** (Azul)
- Soma de todos os `shippingFee` das entregas completadas
- Exibe quantidade de entregas completadas
- Ícone: FiDollarSign

**Card 2: Valores Recebidos** (Verde)
- Soma dos `payment.amount` quando `payment` não é `null` e `amount > 0`
- Exibe percentual do total recebido
- Ícone: FiCheckCircle

**Card 3: Valores a Receber** (Amarelo/Laranja)
- Cálculo: Total em Fretes - Valores Recebidos
- Exibe percentual do total pendente
- Ícone: FiClock

#### 3. Integração com Sidebar
- Menu "Balanço Financeiro" adicionado ao sidebar
- Ícone: FiDollarSign (verde)
- Rota: `/balanco-financeiro`
- Visível apenas para: `ROLE_ORGANIZER` e `ORGANIZER`

### Estrutura Visual

```
┌─────────────────────────────────────────────┐
│ Header (Verde gradient)                     │
│  💵 Balanço Financeiro                      │
│  Acompanhe os valores de frete...          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ CRUD de Entregas (EntityCRUD completo)      │
│ ┌────┬──────┬────────┬────────┬─────────┐  │
│ │ ID │Client│Endereço│ Valor  │ Ações   │  │
│ ├────┼──────┼────────┼────────┼─────────┤  │
│ │ 48 │Padari│Rod...  │R$ 5,25 │👁️ ✏️ 🗺️ │  │
│ └────┴──────┴────────┴────────┴─────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Resumo Financeiro                           │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│ │💵 Total  │  │✅ Recebido│  │🕐 Pendente│  │
│ │R$ 500,00 │  │R$ 350,00 │  │R$ 150,00  │  │
│ │10 entreg.│  │70% total │  │30% total  │  │
│ └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Montagem do Componente**
   - useEffect dispara loadFinancialData()
   - Busca deliveries via GET `/api/deliveries?organizer.id={userId}&status=COMPLETED&size=1000`

2. **Cálculo do Resumo**
   ```typescript
   totalShippingFees = soma de delivery.shippingFee
   totalPaid = soma de delivery.payment.amount (quando payment existe e amount > 0)
   totalPending = totalShippingFees - totalPaid
   ```

3. **Renderização**
   - EntityCRUD renderiza a tabela com filtros aplicados
   - Cards de resumo mostram valores calculados
   - Formatação monetária: Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

### Rotas Configuradas

**App.tsx**:
```tsx
<Route path="/balanco-financeiro" element={<OrganizerFinancialPage />} />
```

**Sidebar.tsx**:
```tsx
{
  label: "Balanço Financeiro",
  icon: <FiDollarSign size={22} color="#10b981" />,
  path: "/balanco-financeiro",
  roles: ["ROLE_ORGANIZER", "ORGANIZER"],
}
```

### Modos de Visualização

#### Modo Tabela (Padrão)
- Lista todas as entregas completadas
- Botões de ação: View, Edit, Mapa
- Resumo financeiro abaixo

#### Modo View (ao clicar em View)
- EntityCRUD muda para modo view
- Formulário readonly com todos os dados da entrega
- Mapa de rota integrado (DeliveryRouteMap)
- Breadcrumb para voltar

#### Modo Edit (ao clicar em Edit)
- EntityCRUD muda para modo edit
- Permite editar a entrega
- Validações do EntityForm aplicadas

### Responsividade

**Desktop** (> 768px):
- 3 cards lado a lado (grid auto-fit)
- Padding: 2.5rem

**Mobile** (≤ 768px):
- Cards empilhados verticalmente
- Padding reduzido: 1.5rem
- Font-sizes ajustados

### Logs de Debug

O componente inclui logs console para troubleshooting:

```
💰 OrganizerFinancialPage - Carregando dados financeiros
💰 OrganizerFinancialPage - Entregas completadas: 5
💰 OrganizerFinancialPage - Resumo financeiro: {totalShippingFees, totalPaid, totalPending}
❌ OrganizerFinancialPage - Erro ao carregar dados financeiros: [error]
```

### Diferenças do Pagamento Diário (CLIENT)

| Funcionalidade | Pagamento Diário (CLIENT) | Balanço Financeiro (ORGANIZER) |
|----------------|---------------------------|--------------------------------|
| Perfis | ROLE_CLIENT, CLIENT | ROLE_ORGANIZER, ORGANIZER |
| Entidades | Deliveries do client | Deliveries do organizer |
| Status | Todas (com filtro) | Apenas COMPLETED |
| Edição | Não permite | Permite via EntityCRUD |
| Paginação | Paginada | Todas de uma vez (size: 1000) |
| Valores | shippingFee + totalAmount | Apenas shippingFee |
| Cálculos | Soma total + taxas | Total, Pago, Pendente |

### Integrações

- **EntityCRUD**: Gerenciamento completo (table, view, edit)
- **DeliveryRouteMap**: Mapa de rota nas views
- **api.get()**: Requisições para backend
- **getUserId()**: Identificação do usuário logado
- **Toast**: Notificações de sucesso/erro (via EntityCRUD)

### Performance

- Requisição inicial busca até 1000 entregas
- Cálculos em memória (não afeta backend)
- Re-render otimizado com useMemo potencial
- Sem polling (dados estáticos após carregamento)

### Melhorias Futuras (Opcional)

1. **Filtro de Datas**: Permitir filtrar entregas por período
2. **Exportação**: Botão para exportar dados para Excel/PDF
3. **Gráficos**: Visualização de tendências temporais
4. **Detalhamento de Pagamentos**: Mostrar quais entregas estão pagas/pendentes
5. **Paginação Inteligente**: Paginação virtual para grandes volumes

### Testes Sugeridos

1. Login como ORGANIZER
2. Acessar "Balanço Financeiro" no sidebar
3. Verificar se tabela mostra apenas entregas COMPLETED
4. Verificar se resumo financeiro calcula corretamente
5. Testar view de entrega individual
6. Testar edição de entrega
7. Verificar responsividade em mobile
8. Testar com 0 entregas completadas
9. Testar com entregas sem payment
10. Testar com entregas com payment

## Status: ✅ Implementado e Funcional
