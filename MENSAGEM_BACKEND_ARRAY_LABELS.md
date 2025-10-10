# Mensagem para o Backend

---

## 📧 Assunto: Correção - Labels de ArrayField com Tradução Incorreta

Olá,

Identifiquei um problema nas traduções dos campos `array` no metadata de formulários.

### Problema:

O campo `categories` do evento está vindo com `addLabel: "Adicionar categorie"` (palavra que não existe em português).

### Exemplo atual (ERRADO):

```json
{
  "arrayConfig": {
    "addLabel": "Adicionar categorie" // ❌
  }
}
```

### Como deve ser (CORRETO):

```json
{
  "arrayConfig": {
    "addLabel": "Adicionar Categoria" // ✅
  }
}
```

### Regra geral:

Para todos os campos `array`, o `addLabel` deve seguir o padrão:

- **"Adicionar" + [Nome da entidade no singular]**

Exemplos:

- Categorias → `"Adicionar Categoria"`
- Distâncias → `"Adicionar Distância"`
- Lotes → `"Adicionar Lote"`
- Participantes → `"Adicionar Participante"`

### Onde corrigir:

Todos os `FormField` com `type: "array"` no metadata dos formulários.

Você pode buscar por:

```bash
grep -r "addLabel" src/main/java/
```

Documentação completa com exemplos de código: `docs/backend/ARRAY_FIELD_TRANSLATION_FIX.md`

Poderia corrigir isso? É rápido mas muito visível para o usuário.

Obrigado!

---
