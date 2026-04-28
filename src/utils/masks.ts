/**
 * Detecta se o campo é um telefone baseado no nome
 */
const isPhoneField = (fieldName: string): boolean => {
  const name = fieldName.toLowerCase();
  const phoneKeywords = [
    "phone", "telefone", "fone", "tel",
    "celular", "cellphone", "cellular",
    "móvel", "movel", "mobile",
    "whatsapp", "whats", "zap"
  ];
  
  return phoneKeywords.some(keyword => name.includes(keyword));
};

/**
 * Detecta se o campo é especificamente um telefone FIXO
 */
export const isLandlineField = (fieldName: string): boolean => {
  const name = fieldName.toLowerCase();
  const landlineKeywords = [
    "fixo", "landline", "residencial", "comercial"
  ];
  
  return landlineKeywords.some(keyword => name.includes(keyword));
};

/**
 * Retorna a máscara correta para telefone baseado no nome do campo
 * Por padrão usa celular (11 dígitos), exceto se for explicitamente fixo
 */
export const getPhoneMask = (fieldName: string): string => {
  if (isLandlineField(fieldName)) {
    return "(99) 9999-9999"; // Telefone fixo: 10 dígitos
  }
  return "(99) 99999-9999"; // Celular: 11 dígitos (padrão)
};

/**
 * Detecta se o campo é um CEP baseado no nome
 */
const isCEPField = (fieldName: string): boolean => {
  // Separa camelCase e snake_case em palavras: "addressZipCode" → ["address","Zip","Code"]
  const words = fieldName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().split(/[_\-]/);
  const cepWords = ["cep", "zipcode", "zip", "postalcode", "postal"];
  const excludeWords = ["point", "reference", "referencia"];

  const hasCep = words.some(w => cepWords.includes(w));
  const isExcluded = words.some(w => excludeWords.includes(w));
  return hasCep && !isExcluded;
};

/**
 * Detecta automaticamente a máscara baseada no nome do campo
 */
export const getAutoMask = (fieldName: string): string | null => {
  const name = fieldName.toLowerCase();
  
  if (name.includes("cpf")) {
    return "999.999.999-99";
  }
  
  if (name.includes("cnpj")) {
    return "99.999.999/9999-99";
  }

  // Campo "document" aceita apenas CPF (Pessoa Jurídica não suportada —
  // Pagar.me exige KYC corporativo completo que não capturamos).
  if (name.includes("document")) {
    return "999.999.999-99";
  }
  
  if (isPhoneField(fieldName)) {
    return getPhoneMask(fieldName); // Usa celular por padrão, fixo se explícito
  }
  
  if (isCEPField(fieldName)) {
    return "99999-999";
  }
  
  return null;
};

/**
 * Remove caracteres da máscara, deixando apenas números
 */
export const unmaskValue = (value: string): string => {
  return value.replace(/[^\d]/g, "");
};

/**
 * Aplica máscara de CPF
 */
export const maskCPF = (value: string): string => {
  const numbers = unmaskValue(value);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

/**
 * Aplica máscara de telefone brasileiro
 * Formato: (85) 99757-2919 ou (85) 3257-2919
 */
export const maskPhone = (value: string): string => {
  const numbers = unmaskValue(value);
  
  if (numbers.length <= 10) {
    // Telefone fixo: (85) 3257-2919
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // Celular: (85) 99757-2919
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
};

/**
 * Aplica máscara de CEP
 */
export const maskCEP = (value: string): string => {
  const numbers = unmaskValue(value);
  return numbers.replace(/(\d{5})(\d)/, "$1-$2");
};

/**
 * Aplica máscara de CNPJ
 */
export const maskCNPJ = (value: string): string => {
  const numbers = unmaskValue(value);
  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

/**
 * Aplica máscara automaticamente baseada no nome do campo
 */
export const applyAutoMask = (value: string, fieldName: string): string => {
  if (!value) return value;
  
  const name = fieldName.toLowerCase();
  
  if (name.includes("cpf")) {
    return maskCPF(value);
  }
  
  if (isPhoneField(fieldName)) {
    return maskPhone(value);
  }
  
  if (isCEPField(fieldName)) {
    return maskCEP(value);
  }
  
  if (name.includes("cnpj")) {
    return maskCNPJ(value);
  }
  
  return value;
};

/**
 * Valida CPF
 */
export const isValidCPF = (cpf: string): boolean => {
  const numbers = unmaskValue(cpf);
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

/**
 * Valida telefone brasileiro
 */
export const isValidPhone = (phone: string): boolean => {
  const numbers = unmaskValue(phone);
  
  // Aceita 10 (fixo) ou 11 (celular) dígitos
  if (numbers.length !== 10 && numbers.length !== 11) return false;
  
  // DDD deve estar entre 11 e 99
  const ddd = parseInt(numbers.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  return true;
};

/**
 * Valida CNPJ
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const numbers = unmaskValue(cnpj);
  
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let length = numbers.length - 2;
  let nums = numbers.substring(0, length);
  const digits = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(nums.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Validação do segundo dígito verificador
  length = length + 1;
  nums = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(nums.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Valida CEP brasileiro
 */
export const isValidCEP = (cep: string): boolean => {
  const numbers = unmaskValue(cep);
  return numbers.length === 8;
};

/**
 * Verifica se o campo deve ter a máscara removida antes de enviar ao backend
 */
export const shouldUnmask = (fieldName: string): boolean => {
  const name = fieldName.toLowerCase();
  
  // Campos que precisam ser salvos sem máscara no backend
  return (
    name.includes("cpf") ||
    name.includes("cnpj") ||
    name.includes("document") ||
    isCEPField(fieldName) ||
    isPhoneField(fieldName)
  );
};

/**
 * Remove máscaras de um objeto de dados antes de enviar ao backend
 * Percorre todos os campos e remove máscaras dos campos identificados
 */
export const unmaskFormData = (data: Record<string, unknown>): Record<string, unknown> => {
  const unmasked: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      unmasked[key] = value;
      continue;
    }
    
    // Se é um objeto aninhado, processa recursivamente
    if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      unmasked[key] = unmaskFormData(value as Record<string, unknown>);
      continue;
    }
    
    // Se é um array, processa cada item
    if (Array.isArray(value)) {
      unmasked[key] = value.map(item => {
        if (typeof item === "object" && item !== null) {
          return unmaskFormData(item as Record<string, unknown>);
        }
        return item;
      });
      continue;
    }
    
    // Se é string e o campo deve ser desmascardo
    if (typeof value === "string" && shouldUnmask(key)) {
      const numbersOnly = unmaskValue(value);
      // 🚫 Garantir tamanho correto por tipo conhecido
      if (key.toLowerCase().includes("cpf") && !key.toLowerCase().includes("cnpj")) {
        // CPF tem exatamente 11 dígitos
        unmasked[key] = numbersOnly.substring(0, 11);
      } else if (key.toLowerCase().includes("cnpj")) {
        // CNPJ tem exatamente 14 dígitos
        unmasked[key] = numbersOnly.substring(0, 14);
      } else if (key.toLowerCase().includes("document")) {
        // DocumentNumber: aceita apenas CPF (11 dígitos)
        unmasked[key] = numbersOnly.substring(0, 11);
      } else if (isCEPField(key)) {
        unmasked[key] = numbersOnly.substring(0, 8);
      } else if (isPhoneField(key)) {
        // Telefone brasileiro: 10 (fixo) ou 11 (celular) — não corta além de 11
        unmasked[key] = numbersOnly.substring(0, 11);
      } else {
        unmasked[key] = numbersOnly;
      }
    } else {
      unmasked[key] = value;
    }
  }
  
  return unmasked;
};
