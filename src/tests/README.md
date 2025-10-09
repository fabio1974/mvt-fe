# Testes de Integração - Frontend

Este diretório contém os testes de integração do frontend da aplicação MVT.

## Configuração

O projeto usa:
- **Vitest**: Framework de testes otimizado para Vite
- **Testing Library**: Para testes de componentes React
- **jsdom**: Ambiente DOM para testes

## Executar Testes

```bash
# Modo watch (reexecuta ao salvar arquivos)
npm test

# Executar uma vez
npm run test:run

# Interface visual
npm run test:ui

# Com cobertura de código
npm run test:coverage
```

## Testes Implementados

### `auth-flow.test.tsx`

Testa o fluxo completo de autenticação:

#### ✅ Cenários de Sucesso
1. **Registro + Login de Organizador**
   - Registra um novo usuário do tipo ORGANIZER
   - Faz login com as mesmas credenciais
   - Valida que o token é salvo no localStorage
   - Verifica navegação para home

#### ❌ Cenários de Erro
2. **Registro com Email Existente**
   - Tenta registrar com email já cadastrado
   - Valida exibição de mensagem de erro

3. **Login com Credenciais Inválidas**
   - Tenta login com senha incorreta
   - Valida que nada é salvo no localStorage
   - Verifica exibição de erro

#### 🔍 Validações de Formulário
4. **Validação de Email**
   - Testa formato de email inválido
   - Verifica mensagem de validação

5. **Validação de Senha**
   - Testa senha com menos de 6 caracteres
   - Verifica mensagem de validação

## Estrutura dos Testes

```typescript
describe('Auth Flow Integration Tests', () => {
  beforeEach(() => {
    // Limpa mocks e localStorage antes de cada teste
  });

  it('should register and login successfully', async () => {
    // 1. Renderiza formulário de registro
    // 2. Preenche campos
    // 3. Submete
    // 4. Verifica chamada API
    // 5. Renderiza formulário de login
    // 6. Preenche campos
    // 7. Submete
    // 8. Verifica localStorage e navegação
  });
});
```

## Mocks

Os testes usam mocks para:
- **API**: `vi.mock('../services/api')` - simula chamadas ao backend
- **Router**: `vi.mock('react-router-dom')` - simula navegação

## Boas Práticas

1. **Cleanup automático**: Cada teste limpa o localStorage e DOM
2. **User Events**: Usa `userEvent` para simular interações realistas
3. **Async/Await**: Usa `waitFor` para esperar atualizações assíncronas
4. **Isolamento**: Cada teste é independente

## Adicionar Novos Testes

Para adicionar testes de um novo fluxo:

1. Crie arquivo `*.test.tsx` neste diretório
2. Importe componentes e utilitários necessários
3. Configure mocks se necessário
4. Escreva cenários de teste

Exemplo:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('My Feature', () => {
  it('should do something', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

## Cobertura de Código

Execute `npm run test:coverage` para gerar relatório de cobertura.

O relatório mostra:
- % de linhas cobertas
- % de funções cobertas
- % de branches cobertas
- Arquivos não testados

## CI/CD

Os testes podem ser integrados ao pipeline CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test:run
```
