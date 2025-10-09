# Sistema de Organização - JWT Integrado

## Visão Geral

O sistema agora utiliza o token JWT expandido que inclui informações completas do usuário, incluindo dados da organização (quando aplicável).

## Estrutura do Token JWT

### Token Decodificado (Exemplo)

```json
{
  "sub": "fabio.organizer@prefeitura.sp.gov.br",
  "authorities": ["ROLE_ORGANIZER"],
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "fabio.organizer@prefeitura.sp.gov.br",
  "name": "Fábio Organizer",
  "role": "ORGANIZER",
  "organizationId": 1,
  "iat": 1695427200,
  "exp": 1695445200
}
```

### Campos do Token

| Campo            | Tipo        | Descrição                                        |
| ---------------- | ----------- | ------------------------------------------------ |
| `sub`            | string      | Subject - username (email)                       |
| `authorities`    | array       | Roles do Spring Security                         |
| `userId`         | string      | UUID único do usuário                            |
| `email`          | string      | Email do usuário                                 |
| `name`           | string      | Nome completo do usuário                         |
| `role`           | string      | Enum do role (USER, ORGANIZER, ADMIN)            |
| `organizationId` | number/null | ID da organização vinculada (null se não houver) |
| `iat`            | number      | Timestamp de criação                             |
| `exp`            | number      | Timestamp de expiração                           |

## Funções Utilitárias (auth.ts)

### Funções Principais

```typescript
// Básicas
decodeJWT(token: string): object | null
getUserRole(): string | null
getUserEmail(): string | null
getUserName(): string | null
getUserId(): string | null

// Organização
hasOrganization(): boolean
getOrganizationId(): number | null

// Permissões
canCreateEvents(): boolean
```

## Fluxo de Verificação de Organização

### 1. Usuário ORGANIZER sem Organização

- Token tem `organizationId: null`
- `hasOrganization()` retorna `false`
- Ao tentar criar evento → redirecionado para `/organizacao`

### 2. Usuário ORGANIZER com Organização

- Token tem `organizationId: 1` (exemplo)
- `hasOrganization()` retorna `true`
- Pode criar eventos normalmente

### 3. Usuário USER

- Nunca tem `organizationId`
- Não vê opção "Criar evento" no menu
- Não acessa página de organização

## Interface do Usuário

### Sidebar

- **Nome do usuário** extraído do token (`name`)
- **Menu "Organização"** visível apenas para `ROLE_ORGANIZER`
- **Menu "Criar evento"** visível para `ROLE_ORGANIZER` e `ROLE_ADMIN`

### Proteção de Rotas

- `/criar-evento` → verifica se usuário tem organização
- `/organizacao` → acessível para ORGANIZER

## Exemplo de Uso

```typescript
// Verificar se usuário pode criar eventos
if (canCreateEvents()) {
  // Mostrar botão "Criar evento"
}

// Verificar se tem organização
if (hasOrganization()) {
  // Permitir criar eventos
} else {
  // Redirecionar para formulário de organização
}

// Obter dados do usuário
const userName = getUserName(); // "Fábio Organizer"
const orgId = getOrganizationId(); // 1 ou null
```

## Benefícios da Implementação

1. **Performance**: Sem chamadas extras à API para verificar organização
2. **Simplicidade**: Dados do usuário centralizados no token
3. **Segurança**: Token assinado pelo backend garante integridade
4. **UX**: Verificações instantâneas sem loading
5. **Consistência**: Dados sempre sincronizados com o backend

## Como Testar

1. **Login como ORGANIZER sem organização**:

   - Tente criar evento → será redirecionado para `/organizacao`
   - Preencha formulário de organização
   - Após salvar, novo token será gerado com `organizationId`

2. **Login como ORGANIZER com organização**:

   - Menu mostra "Organização" e "Criar evento"
   - Pode criar eventos diretamente
   - Nome aparece no sidebar

3. **Login como USER**:
   - Não vê "Criar evento" no menu
   - Não vê "Organização" no menu
