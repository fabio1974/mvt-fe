# 🐛 Correção: IMask Bloqueando onChange em Campos com Máscara

## 📋 Problema

Campos de formulário com máscara (DDD, telefone, CPF, CNPJ) **não estavam enviando valores** ao backend durante o submit, mesmo estando visíveis e preenchidos na tela.

### Sintomas

- ✅ Campos renderizados corretamente no formulário
- ✅ Usuário consegue digitar e ver a máscara aplicada
- ❌ Valores **não aparecem** no `formData` durante o submit
- ❌ Evento `onChange` do React **não é disparado**
- ❌ `handleChange` nunca é chamado

### Exemplo do Problema

```json
// Payload enviado ao backend (ERRADO - sem phone):
{
  "role": "ORGANIZER",
  "name": "Maria Silva",
  "documentNumber": "12345678900",
  "enabled": true
  // ❌ phoneDdd e phoneNumber ausentes!
}
```

## 🔍 Causa Raiz

A biblioteca **IMask** intercepta e bloqueia os eventos `onChange` nativos do DOM quando aplicada diretamente a um `<input>`. 

O código estava usando `onChange` no input, mas o IMask **previne** esse evento de ser disparado:

```tsx
// ❌ CÓDIGO ERRADO (não funciona com IMask)
<input
  ref={inputRef}
  onChange={(e) => onChange(e)} // ← Nunca é chamado!
/>
```

### Por que acontece?

IMask usa `input.addEventListener("input")` internamente e pode fazer `event.stopImmediatePropagation()`, impedindo que handlers React sejam executados.

## ✅ Solução

Usar o **evento correto do IMask** (`on("accept")`) em vez de confiar no `onChange` nativo do React:

### Antes (ERRADO) ❌

```tsx
useEffect(() => {
  if (!inputRef.current) return;

  maskRef.current = IMask(inputRef.current, {
    mask: getIMaskPattern(maskPattern),
    lazy: false,
  });

  maskRef.current.value = value;
}, [mask, value]);

return (
  <input
    ref={inputRef}
    onChange={(e) => {
      // ❌ Nunca é chamado quando IMask está ativo!
      onChange(e);
    }}
  />
);
```

### Depois (CORRETO) ✅

```tsx
useEffect(() => {
  if (!inputRef.current) return;

  if (!maskRef.current) {
    maskRef.current = IMask(inputRef.current, {
      mask: getIMaskPattern(maskPattern),
      lazy: false,
    });

    // ✅ Usa on("accept") do IMask
    maskRef.current.on("accept", () => {
      const event = {
        target: {
          value: maskRef.current.value,
          name: inputRef.current?.name || "",
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    });
  }

  maskRef.current.value = value;
}, [mask, value, onChange]);

return (
  <input
    ref={inputRef}
    // ✅ Sem onChange - usa on("accept") do IMask
  />
);
```

## 📁 Arquivos Corrigidos

### 1. `MaskedInput.tsx` (Telefone, CEP, etc)

**Antes:**
```tsx
// ❌ onChange nativo (não funciona)
<input onChange={(e) => onChange(e)} />
```

**Depois:**
```tsx
// ✅ Evento IMask
maskRef.current.on("accept", () => {
  const event = {
    target: {
      value: maskRef.current.value,
      name: inputRef.current?.name || "",
    },
  } as React.ChangeEvent<HTMLInputElement>;
  onChange(event);
});
```

### 2. `DynamicDocumentInput.tsx` (CPF/CNPJ)

**Antes:**
```tsx
// ❌ onChange nativo (não funciona)
<input
  onChange={(e) => onChange(e)}
  onBlur={(e) => onChange(e as any)}
/>
```

**Depois:**
```tsx
// ✅ Evento IMask
maskRef.current.on("accept", () => {
  const event = {
    target: {
      value: maskRef.current.value,
    },
  } as React.ChangeEvent<HTMLInputElement>;
  onChange(event);
});
```

## 🔍 Como Detectar Esse Problema Rapidamente

### Checklist de Diagnóstico

1. **Campo está visível na tela?** ✅
   - Se SIM, continue

2. **Campo tem máscara (IMask)?** ✅
   - Procure por `IMask(` no código
   - Se SIM, continue

3. **Valor não aparece no formData?** ✅
   - Adicione log no submit: `console.log("formData:", formData)`
   - Se campo está vazio, continue

4. **handleChange não é chamado ao digitar?** ✅
   - Adicione log: `console.log("handleChange:", fieldName, value)`
   - Se não aparecer log, **É ESSE PROBLEMA**

### Comandos de Debug Rápido

```tsx
// 1. No useEffect do IMask:
maskRef.current.on("accept", () => {
  console.log("🎭 IMask accept:", maskRef.current.value);
  // ...
});

// 2. No handleChange do EntityForm:
const handleChange = (fieldName: string, value: unknown) => {
  if (fieldName.includes('phone') || fieldName.includes('ddd')) {
    console.log("📱 handleChange:", fieldName, value);
  }
  // ...
};
```

## 🎯 Solução Resumida

| Componente | Problema | Solução |
|------------|----------|---------|
| `MaskedInput.tsx` | `onChange` do input não dispara | Usar `maskRef.current.on("accept")` |
| `DynamicDocumentInput.tsx` | `onChange` do input não dispara | Usar `maskRef.current.on("accept")` |
| Qualquer input com IMask | Eventos React bloqueados | **Sempre** usar eventos do IMask |

## ⚠️ Regra Importante

**Nunca confie em `onChange` nativo quando IMask está ativo!**

✅ **SEMPRE use:**
```tsx
maskRef.current.on("accept", () => {
  onChange(/* evento sintético */);
});
```

❌ **NUNCA use:**
```tsx
<input ref={inputRef} onChange={onChange} />
```

## 📊 Resultado Final

Após a correção, o payload é enviado corretamente:

```json
{
  "role": "ORGANIZER",
  "name": "Maria Silva",
  "documentNumber": "12345678900",
  "phoneDdd": "85",          // ✅ Presente!
  "phoneNumber": "991234567", // ✅ Presente!
  "enabled": true
}
```

## 🔗 Referências

- [IMask Documentation - Events](https://imask.js.org/guide.html#events)
- Commit que corrigiu: `[insira hash do commit aqui]`
- Issue relacionada: Campos de telefone não sendo salvos no cadastro de usuário

## 📝 Notas Adicionais

- Este problema afeta **todos os componentes** que usam IMask
- A correção é **obrigatória** para qualquer input com máscara
- Testes devem validar que `on("accept")` está configurado
- Se criar novo componente com máscara, **consulte este documento**

---

**Status:** ✅ Resolvido  
**Data:** 29/12/2025  
**Impacto:** Alto (campos não salvavam no backend)  
**Complexidade:** Média (problema na integração IMask + React)
