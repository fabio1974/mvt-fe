/**
 * Mapeamento de traduções customizadas para labels
 * 
 * Use este arquivo para sobrescrever labels que vêm do backend
 * quando a tradução padrão não é adequada.
 */

export const LABEL_TRANSLATIONS: Record<string, string> = {
  // Contratos
  "Client Contracts": "Contratos de Serviço",
  "Client Contract": "Contrato de Serviço",
  "Employment Contracts": "Contratos de Motoboy",
  "Employment Contract": "Contrato de Motoboy",
  
  // Plural forms
  "clientContracts": "Contratos de Serviço",
  "employmentContracts": "Contratos de Motoboy",
  
  // Address fields
  "Addresses": "Endereços",
  "Address": "Endereço",

  // Document — apenas CPF (CNPJ não é suportado)
  "document_number": "CPF",
  "documentNumber": "CPF",
  "Document Number": "CPF",
  "CPF": "CPF",
  "cpf": "CPF",
  "Cpf": "CPF",

  // Payment fields
  "Payment Date": "Pago Em",
  "paymentDate": "Pago Em",
  "Payment Completed": "Pagamento",
  "paymentCompleted": "Pagamento",
  "Payment Captured": "Pagamento Capturado",
  "paymentCaptured": "Pagamento Capturado",
  "createdAt": "Criado Em",
  "Created At": "Criado Em",

};

/**
 * Traduz um label se houver uma tradução customizada
 * @param label Label original do backend
 * @returns Label traduzido ou original se não houver tradução
 */
export function translateLabel(label: string): string {
  return LABEL_TRANSLATIONS[label] || label;
}
