# 🔄 Correção: Renderizações Infinitas no Formulário de Delivery

## 🐛 Problema

Ao clicar em "Criar Nova Delivery", o componente entrava em loop infinito de renderizações.

## 🔍 Causa Raiz

### 1. **DeliveryCRUDPage.tsx** - Objeto como dependência
```typescript
// ❌ ANTES: coordinates é um objeto novo a cada render
const coordinates = getUserCoordinates();
useEffect(() => {
  // ...
}, [coordinates]); // ← Loop infinito!
```

**Por quê?** JavaScript compara objetos por referência. Mesmo que o conteúdo seja igual, `{latitude: 1, longitude: 2}` !== `{latitude: 1, longitude: 2}`.

### 2. **EntityForm.tsx** - initialValues sempre mudando
```typescript
// ❌ ANTES: initialValues é um objeto que muda toda render
useEffect(() => {
  setFormData((prev) => ({...prev, ...initialValues}));
}, [initialValues]); // ← Loop infinito!
```

## ✅ Solução Implementada

### 1. **DeliveryCRUDPage.tsx** - Usar valores primitivos

```typescript
// ✅ DEPOIS: Extrai valores primitivos
const coordinates = getUserCoordinates();
const userLatitude = coordinates?.latitude;
const userLongitude = coordinates?.longitude;

useEffect(() => {
  // ...
}, [userLatitude, userLongitude]); // ← Valores primitivos não causam loop
```

**Por quê funciona?** Números são comparados por valor: `1 === 1` sempre retorna `true`.

### 2. **EntityForm.tsx** - Flag de controle

```typescript
// ✅ DEPOIS: Usa flag para executar apenas uma vez
const [initialValuesApplied, setInitialValuesApplied] = useState(false);

useEffect(() => {
  if (!entityId && !initialValuesApplied && Object.keys(initialValues).length > 0) {
    setFormData((prev) => ({...prev, ...normalizedValues}));
    setInitialValuesApplied(true); // ← Marca como aplicado
  }
}, [initialValues, entityId, initialValuesApplied]);

// Reset flag quando muda de entidade
useEffect(() => {
  setErrors({});
  setInitialValuesApplied(false);
}, [entityId, metadata.endpoint]);
```

**Por quê funciona?** A flag `initialValuesApplied` garante que o efeito execute apenas uma vez até o reset.

## 📊 Comparação: Objetos vs Primitivos em useEffect

### Objetos (❌ Causa loops):
```typescript
const obj1 = {a: 1};
const obj2 = {a: 1};
console.log(obj1 === obj2); // false ← Sempre diferente!

useEffect(() => {
  // Executa toda vez
}, [obj1]);
```

### Primitivos (✅ Seguro):
```typescript
const num1 = 1;
const num2 = 1;
console.log(num1 === num2); // true ← Comparação por valor

useEffect(() => {
  // Executa apenas quando mudar
}, [num1]);
```

## 🎯 Arquivos Modificados

1. **`DeliveryCRUDPage.tsx`**:
   - Extrai `userLatitude` e `userLongitude` como valores primitivos
   - Usa primitivos no array de dependências do `useEffect`

2. **`EntityForm.tsx`**:
   - Adiciona flag `initialValuesApplied` para controlar execução
   - Reseta flag quando `entityId` ou `metadata.endpoint` mudam
   - Garante que `initialValues` sejam aplicados apenas uma vez por formulário

## 🧪 Como Testar

1. Vá em "Entregas" → "Criar Nova Entrega"
2. Verifique no console:
   - ✅ Deve ver apenas **uma** linha: `🔄 Atualizando formData com initialValues:`
   - ✅ Deve ver apenas **uma** linha: `📍 Endereço de origem pré-preenchido...`
   - ❌ **NÃO** deve ver essas mensagens repetindo infinitamente

3. Abra DevTools → React Components → EntityForm
   - ✅ Contador de renders deve permanecer estável
   - ❌ **NÃO** deve aumentar constantemente

## 📚 Lições Aprendidas

### ⚠️ NUNCA use objetos diretamente em dependências de useEffect:
```typescript
// ❌ ERRADO
const obj = {a: 1, b: 2};
useEffect(() => {}, [obj]);

// ✅ CORRETO - Opção 1: Valores primitivos
const a = obj.a;
const b = obj.b;
useEffect(() => {}, [a, b]);

// ✅ CORRETO - Opção 2: useMemo
const obj = useMemo(() => ({a: 1, b: 2}), []);
useEffect(() => {}, [obj]);

// ✅ CORRETO - Opção 3: Flag de controle
const [applied, setApplied] = useState(false);
useEffect(() => {
  if (!applied) {
    // fazer algo com obj
    setApplied(true);
  }
}, [obj, applied]);
```

### 🎯 Regras de Ouro:

1. **Primitivos**: `string`, `number`, `boolean`, `null`, `undefined` → Seguros em dependências
2. **Objetos/Arrays**: Sempre criam nova referência → Usar `useMemo` ou extrair valores primitivos
3. **Funções**: Usar `useCallback` para memoização
4. **Props de objetos**: Preferir passar valores primitivos individuais

## 🚀 Status

✅ **Problema Resolvido**
- Renderizações infinitas eliminadas
- Formulário carrega normalmente
- Performance otimizada

---

**Data:** 21/11/2025
**Issue:** Loop infinito ao criar nova delivery
**Status:** ✅ Corrigido
