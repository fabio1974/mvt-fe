# Campo Address com Google Maps - Documentação

## Visão Geral

O sistema agora suporta campos do tipo `address` que integram automaticamente com o Google Maps para seleção visual de endereços.

## Componentes Criados

### 1. AddressMapPicker

Componente principal que renderiza o Google Maps com:

- ✅ Clique no mapa para selecionar posição
- ✅ Campo de busca com autocomplete do Google
- ✅ Geocoding (endereço → coordenadas)
- ✅ Reverse Geocoding (coordenadas → endereço)
- ✅ Exibição de informações (cidade, estado, CEP)
- ✅ Botão de confirmação para uso em modais

### 2. AddressFieldWithMap

Wrapper que integra o input de texto com botão do Google Maps:

- ✅ Input de texto normal para digitação manual
- ✅ Botão com ícone `FiMapPin` ao lado do input
- ✅ Abre modal com o mapa ao clicar no botão
- ✅ Preenche o campo automaticamente ao selecionar no mapa

### 3. Modal

Modal genérico reutilizável com:

- ✅ Overlay com backdrop
- ✅ Tamanhos configuráveis (small, medium, large, xlarge)
- ✅ Fecha com ESC ou clique fora
- ✅ Animação de entrada
- ✅ Previne scroll do body quando aberto

## Como Usar

### 1. Definir campo como "address" na metadata

```typescript
{
  name: "fromAddress",
  label: "Endereço de Origem",
  type: "address",
  required: true,
  placeholder: "Digite o endereço ou clique no mapa"
}
```

### 2. O EntityForm detecta automaticamente

O `EntityForm` detecta campos do tipo `address` e renderiza automaticamente o `AddressFieldWithMap`:

```tsx
case "address":
  fieldContent = (
    <FormField label={field.label} required={field.required} error={error}>
      <AddressFieldWithMap
        value={stringValue}
        onChange={(value) => handleChange(field.name, value)}
        placeholder={field.placeholder}
        disabled={field.disabled || readonly}
        required={field.required}
        label={field.label}
      />
    </FormField>
  );
  break;
```

### 3. Exemplo Completo - Delivery Entity

```typescript
// Backend - delivery.metadata.ts
export const deliveryFormMetadata: FormMetadata = {
  entity: "delivery",
  title: "Entrega",
  sections: [
    {
      title: "Informações da Entrega",
      fields: [
        {
          name: "fromAddress",
          label: "Endereço de Origem",
          type: "address",
          required: true,
          placeholder: "Clique no mapa para selecionar",
        },
        {
          name: "toAddress",
          label: "Endereço de Destino",
          type: "address",
          required: true,
          placeholder: "Clique no mapa para selecionar",
        },
        {
          name: "deliveryDate",
          label: "Data de Entrega",
          type: "date",
          required: true,
        },
      ],
    },
  ],
};
```

## Interface AddressData

Quando um endereço é selecionado no mapa, o componente retorna um objeto com:

```typescript
interface AddressData {
  address: string; // Endereço completo formatado
  latitude: number; // Latitude
  longitude: number; // Longitude
  city: string; // Cidade
  state: string; // Estado (sigla)
  zipCode: string; // CEP
}
```

## Configuração da API Key

A API key do Google Maps está configurada no `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBpJ-PEX_eQunOFbDXKLC3Xr3q69xoROmU
```

## Fluxo de Uso

1. **Usuário vê o campo** → Input de texto + botão com ícone de mapa
2. **Clica no botão** → Modal abre com Google Maps em tela grande
3. **Seleciona no mapa** → Clica em um ponto ou digita endereço
4. **Confirma** → Endereço completo preenche o campo automaticamente
5. **Submit** → Endereço é enviado ao backend junto com os dados do form

## Recursos Implementados

### AddressMapPicker

- ✅ Centro padrão: Fortaleza, CE
- ✅ Zoom 15 para boa visualização
- ✅ Marcador posicionado nas coordenadas selecionadas
- ✅ Busca com restrição ao Brasil
- ✅ Info box com coordenadas, cidade e CEP
- ✅ Modo readonly/disabled
- ✅ Callback onAddressSelect para integração

### AddressFieldWithMap

- ✅ Input text padrão para digitação manual
- ✅ Botão estilizado com hover/active
- ✅ Tooltip "Selecionar no Google Maps"
- ✅ Modal size="xlarge" para visualização ampla
- ✅ Sincronização bidirecional do valor

### Modal

- ✅ z-index: 10000 para ficar acima de tudo
- ✅ ESC fecha o modal
- ✅ Click fora fecha o modal
- ✅ Animação suave de entrada
- ✅ Tamanhos responsivos

## Tipos TypeScript Atualizados

Adicionado `'address'` ao `FormFieldType`:

```typescript
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "date"
  | "datetime"
  | "daterange"
  | "select"
  | "boolean"
  | "entity"
  | "city"
  | "address" // ← NOVO
  | "array";
```

## Estilização

### Cores

- Botão mapa: `#3b82f6` (azul)
- Botão confirmar: `#10b981` (verde)
- Hover: Escurecimento gradual
- Active: Escala 0.98 para feedback tátil

### Layout

- Input flex: 1 (ocupa espaço disponível)
- Botão: 44px (tamanho mínimo para touch)
- Gap: 8px entre elementos
- Border radius: 6px (consistente com o sistema)

## Próximos Passos (Opcionais)

1. **Cálculo de distância**: Adicionar distância entre origem/destino
2. **Rotas**: Integrar Directions API para mostrar rota
3. **Validação**: Validar se coordenadas estão dentro de área permitida
4. **Histórico**: Salvar endereços recentes do usuário
5. **Favoritos**: Permitir salvar endereços favoritos

## Exemplo de Uso Direto (sem EntityForm)

```tsx
import { AddressFieldWithMap } from "../Common/AddressFieldWithMap";

function MyComponent() {
  const [address, setAddress] = useState("");

  return (
    <AddressFieldWithMap
      value={address}
      onChange={(value, addressData) => {
        setAddress(value);
        if (addressData) {
          console.log(
            "Coordenadas:",
            addressData.latitude,
            addressData.longitude
          );
          console.log("Cidade:", addressData.city);
        }
      }}
      label="Endereço"
      placeholder="Digite ou selecione no mapa"
      required
    />
  );
}
```

## Troubleshooting

### Modal não abre

- Verificar se o botão não está disabled
- Verificar console para erros de API key

### Mapa não carrega

- Verificar se `VITE_GOOGLE_MAPS_API_KEY` está definida
- Verificar se a API key tem permissões para Maps JavaScript API
- Verificar console para erros de quota

### Autocomplete não funciona

- Verificar se Places API está habilitada no Google Cloud
- Verificar se a API key tem permissões para Places API

## Arquivos Criados/Modificados

### Criados

- `/src/components/Common/AddressMapPicker.tsx`
- `/src/components/Common/AddressMapPicker.css`
- `/src/components/Common/AddressFieldWithMap.tsx`
- `/src/components/Common/AddressFieldWithMap.css`
- `/src/components/Common/Modal.tsx`
- `/src/components/Common/Modal.css`

### Modificados

- `/src/components/Generic/EntityForm.tsx` - Adicionado case "address"
- `/src/types/metadata.ts` - Adicionado 'address' ao FormFieldType
- `/.env` - Adicionada VITE_GOOGLE_MAPS_API_KEY

## Conclusão

O sistema de endereços com Google Maps está **totalmente funcional** e integrado ao sistema de formulários genéricos. Basta definir um campo como `type: "address"` na metadata do backend que o frontend renderiza automaticamente o campo com botão do mapa! 🗺️✨
