# 🧪 Testando Campos Computados - Guia Rápido

## Como Testar

### 1. Abra o Console do Navegador

- Pressione **F12** (Chrome/Edge) ou **Cmd+Option+I** (Mac)
- Vá para a aba **Console**

### 2. Acesse o Formulário de Categorias

- Navegue até a página de categorias
- Clique em **"Criar Nova Categoria"** ou **"Editar"** uma categoria existente

### 3. O Que Você Deve Ver no Console

#### 🔍 Logs do Metadata Converter

**Primeiro:** Informações sobre os campos recebidos do backend

```javascript
[convertEntityMetadataToFormMetadata] Using source fields: {
  hasFormFields: true,
  sourceFieldsCount: 8,
  sourceFields: [
    { name: "event", type: "entity", hasRelationship: true, computed: null, computedDependencies: null },
    { name: "name", type: "string", hasRelationship: false, computed: "categoryName", computedDependencies: ["distance", "gender", "minAge", "maxAge"] },
    { name: "distance", type: "number", ... },
    { name: "gender", type: "enum", ... },
    { name: "minAge", type: "number", ... },
    { name: "maxAge", type: "number", ... },
    ...
  ]
}
```

**Segundo:** Confirmação da detecção do campo computado

```javascript
✅ [metadataConverter] Campo computado detectado: name -> função: categoryName
✅ [metadataConverter] Dependências: name -> [distance, gender, minAge, maxAge]
```

**Terceiro:** Campos processados após conversão

```javascript
[convertEntityMetadataToFormMetadata] Processed fields: {
  basicFieldsCount: 6,
  relationshipFieldsCount: 0,
  basicFields: [
    { name: "name", type: "text", computed: "categoryName", computedDependencies: ["distance", "gender", "minAge", "maxAge"] },
    { name: "distance", type: "number", computed: undefined, computedDependencies: undefined },
    { name: "gender", type: "select", computed: undefined, computedDependencies: undefined },
    { name: "minAge", type: "number", computed: undefined, computedDependencies: undefined },
    { name: "maxAge", type: "number", computed: undefined, computedDependencies: undefined },
    ...
  ]
}
```

#### 🧮 Logs do EntityForm

**Quando o formulário carrega:**

```javascript
🧮 [EntityForm] Campos computados detectados: [
  {
    name: "name",
    computed: "categoryName",
    dependencies: ["distance", "gender", "minAge", "maxAge"]
  }
]
```

### 4. Teste o Comportamento Visual

#### ✅ Campo "Nome" deve estar READONLY

- Fundo cinza (`bg-gray-100`)
- Cursor "not-allowed" quando passar o mouse
- Não permite digitação

#### ✅ Preencha os campos dependentes:

1. **Distância:** `5`
2. **Gênero:** `Masculino`
3. **Idade Mínima:** `30`
4. **Idade Máxima:** `39`

#### ✅ Campo "Nome" deve auto-preencher:

```
5KM - Masculino - 30 a 39 anos
```

#### ✅ Teste o Recálculo Automático

- Mude **Gênero** para `Feminino`
- Campo "Nome" deve **recalcular automaticamente** para:

```
5KM - Feminino - 30 a 39 anos
```

- Mude **Idade Máxima** para vazio (delete)
- Campo "Nome" deve recalcular para:

```
5KM - Feminino - 30+
```

- Mude **Idade Mínima** para vazio e **Idade Máxima** para `25`
- Campo "Nome" deve recalcular para:

```
5KM - Feminino - até 25 anos
```

### 5. Checklist de Validação

- [ ] Console mostra logs do metadataConverter com `computed: "categoryName"`
- [ ] Console mostra logs do metadataConverter com `computedDependencies: [...]`
- [ ] Console mostra campos processados com propriedades computadas
- [ ] Console mostra log do EntityForm detectando campos computados
- [ ] Campo "Nome" aparece com fundo cinza (readonly)
- [ ] Cursor muda para "not-allowed" ao passar sobre campo "Nome"
- [ ] Campo "Nome" não aceita digitação manual
- [ ] Ao preencher distância/gênero/idades, campo "Nome" auto-preenche
- [ ] Ao mudar qualquer dependência, campo "Nome" recalcula automaticamente
- [ ] Formato do nome segue padrão: "XKM - Gênero - Faixa Etária"

## ❌ Se Algo Não Funcionar

### Problema: Não vejo logs no console

**Causa:** Filtros do console podem estar ativos

**Solução:**

1. No console, clique no ícone de filtro (funil)
2. Certifique-se que "Info" e "Log" estão habilitados
3. Limpe qualquer texto no campo de busca do console

### Problema: Campo "Nome" não está readonly

**Causa:** Metadata não está sendo detectado como computado

**Solução:**

1. Verifique os logs do `convertEntityMetadataToFormMetadata`
2. Procure por: `computed: "categoryName"` no log
3. Se aparecer `computed: null` ou `computed: undefined`, o backend não está enviando

### Problema: Campo "Nome" não recalcula

**Causa:** useEffect não está disparando ou função não está no registry

**Solução:**

1. Verifique se aparece log: `🧮 [EntityForm] Campos computados detectados`
2. Abra o arquivo `/src/utils/computedFields.ts`
3. Verifique se `categoryName` está no objeto `computedFieldFunctions`
4. Tente dar refresh forçado: **Ctrl+Shift+R** (Windows) ou **Cmd+Shift+R** (Mac)

### Problema: Campo "Nome" mostra valor errado

**Causa:** Lógica da função `categoryName` pode ter bug

**Solução:**

1. Abra `/src/utils/computedFields.ts`
2. Adicione `console.log` dentro da função `categoryName`:

```typescript
export function categoryName(formData: Record<string, unknown>): string {
  console.log("🧮 categoryName chamada com:", formData);
  const distance = formData.distance as number | undefined;
  const gender = formData.gender as string | undefined;
  // ... resto do código
}
```

## 📸 Screenshots Esperados

### Console

```
✅ [metadataConverter] Campo computado detectado: name -> função: categoryName
✅ [metadataConverter] Dependências: name -> [distance, gender, minAge, maxAge]
🧮 [EntityForm] Campos computados detectados: [{name: "name", computed: "categoryName", dependencies: [...]}]
```

### Formulário

```
┌────────────────────────────────────────────┐
│ Distância (KM) *                           │
│ [_5_____]                                  │
│                                            │
│ Gênero *                                   │
│ [Masculino ▼]                              │
│                                            │
│ Idade Mínima        Idade Máxima          │
│ [_30_____]          [_39_____]            │
│                                            │
│ Nome da Categoria *                        │
│ [5KM - Masculino - 30 a 39 anos]  🔒      │
│  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^          │
│  (fundo cinza, readonly)                   │
└────────────────────────────────────────────┘
```

## ✅ Sucesso!

Se você viu todos os logs e o comportamento está correto:

1. ✅ Backend enviando metadata corretamente
2. ✅ Frontend detectando campos computados
3. ✅ Converter preservando propriedades
4. ✅ EntityForm recalculando automaticamente
5. ✅ Renderização readonly funcionando

**Parabéns! Sistema de campos computados está 100% funcional!** 🎉

## 📝 Próximos Passos

Após validar que funciona:

1. **Remover logs de debug** (opcional):

   - Logs com `✅ [metadataConverter]` podem ser removidos
   - Log `🧮 [EntityForm]` pode ser mantido para debug futuro

2. **Testar em produção**:

   - Build: `npm run build`
   - Verificar se não há erros de compilação
   - Deploy e teste no ambiente real

3. **Documentar para a equipe**:
   - Compartilhe este guia com outros devs
   - Atualize wiki/confluence se houver
   - Treine backend sobre como adicionar novos campos computados
