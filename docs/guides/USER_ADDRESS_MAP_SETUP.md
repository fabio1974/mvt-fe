# 🗺️ Configuração do Mapa no Formulário de Dados Pessoais

## ✅ Como funciona

O frontend já está 100% preparado para mostrar o mapa no formulário de Dados Pessoais do usuário. O sistema detecta **automaticamente** campos de endereço e renderiza com integração ao Google Maps.

## 📋 Requisitos no Backend

Para que o mapa apareça automaticamente no formulário de Dados Pessoais, o backend precisa configurar o metadata da entidade `user` com os seguintes campos:

### 1. Campo de Endereço (obrigatório)

O nome do campo deve conter uma dessas palavras:
- `address`
- `endereco`
- `endereço`

**Exemplos aceitos:**
- `address` ✅
- `clientAddress` ✅
- `endereco` ✅
- `enderecoCompleto` ✅

### 2. Campos de Latitude e Longitude (obrigatórios)

Os nomes devem seguir o padrão: `{prefixo}Latitude` e `{prefixo}Longitude`

**Exemplos:**

#### Opção 1: Sem prefixo
```json
{
  "name": "address",
  "type": "text",
  "label": "Endereço"
}
```
Campos relacionados: `latitude` e `longitude`

#### Opção 2: Com prefixo "client"
```json
{
  "name": "clientAddress",
  "type": "text",
  "label": "Endereço"
}
```
Campos relacionados: `addressLatitude` e `addressLongitude`

**Nota:** O sistema também aceita outros padrões como `clientLatitude`/`clientLongitude`, mas o padrão recomendado é `addressLatitude`/`addressLongitude`.

## 🎯 Exemplo Completo de Metadata

```json
{
  "entityName": "user",
  "label": "Usuário",
  "endpoint": "/users",
  "sections": [
    {
      "id": "personal-info",
      "title": "Informações Pessoais",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "label": "Nome",
          "required": true
        },
        {
          "name": "email",
          "type": "email",
          "label": "Email",
          "required": true
        },
        {
          "name": "phone",
          "type": "text",
          "label": "Telefone"
        }
      ]
    },
    {
      "id": "address-info",
      "title": "Endereço",
      "fields": [
        {
          "name": "clientAddress",
          "type": "text",
          "label": "Endereço Completo",
          "required": false,
          "placeholder": "Digite o endereço ou use o mapa"
        },
        {
          "name": "addressLatitude",
          "type": "number",
          "label": "Latitude",
          "visible": false
        },
        {
          "name": "addressLongitude",
          "type": "number",
          "label": "Longitude",
          "visible": false
        }
      ]
    }
  ]
}
```

## 🎨 Como aparece para o usuário

Quando o usuário acessa "Meus Dados Pessoais":

1. **Campo de Endereço** aparece com um **botão de mapa** 📍
2. Ao clicar no botão, abre um **modal com Google Maps**
3. Usuário pode:
   - Buscar endereço por texto
   - Clicar no mapa para marcar a localização
   - Ver a marcação em tempo real
4. Ao confirmar:
   - Campo de endereço é preenchido automaticamente
   - Latitude e longitude são salvos (campos ocultos)

## 🔧 Configurações Opcionais

### Campos ocultos

Para esconder os campos de latitude/longitude da interface (mas mantê-los no banco):

```json
{
  "name": "clientLatitude",
  "type": "number",
  "visible": false
}
```

### Campo somente leitura

Para que o usuário só possa editar pelo mapa:

```json
{
  "name": "clientAddress",
  "type": "text",
  "label": "Endereço",
  "readonly": true
}
```

**Nota:** Os campos no backend agora são `addressLatitude` e `addressLongitude` (não mais `clientLatitude` e `clientLongitude`).

## ⚙️ Fluxo Automático

```
┌─────────────────────────────────────┐
│  Backend configura metadata         │
│  com campo "clientAddress"          │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Frontend detecta automaticamente   │
│  que é campo de endereço            │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Renderiza com botão de mapa 📍     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Usuário clica → Abre Google Maps   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Salva endereço + lat/long no BD    │
└─────────────────────────────────────┘
```

## ✅ Checklist

- [ ] Campo de endereço tem nome com "address", "endereco" ou "endereço"
- [ ] Campos de latitude/longitude seguem padrão `{prefixo}Latitude` e `{prefixo}Longitude`
- [ ] Google Maps API Key configurada no frontend (`.env`)
- [ ] Metadata da entidade `user` atualizado no backend
- [ ] Testado criação/edição de usuário com mapa

## 🚀 Resultado

Sem nenhuma linha de código adicional, o formulário de Dados Pessoais já terá integração completa com Google Maps! 🎉
