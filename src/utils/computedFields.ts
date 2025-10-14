/**
 * Funções de cálculo para campos computed
 * 
 * Cada função recebe o formData completo e retorna o valor calculado
 */

export type ComputedFieldFunction = (formData: Record<string, unknown>) => string;

/**
 * Formata nome de categoria de corrida
 * Ex: "5KM - Masculino - 60+"
 *     "10KM - Feminino - 30 a 39"
 *     "42.195KM - Misto - Geral"
 *     "100M - Feminino - Sub-18"
 */
export function categoryName(formData: Record<string, unknown>): string {
  const distance = formData.distance;
  const distanceUnit = formData.distanceUnit;
  const gender = formData.gender;
  const minAge = formData.minAge;
  const maxAge = formData.maxAge;

  const parts: string[] = [];

  // 1️⃣ Distância com unidade (KM, M, MI)
  if (distance) {
    const unit = distanceUnit ? String(distanceUnit).toUpperCase() : 'KM';
    parts.push(`${distance}${unit}`);
  }

  // 2️⃣ Gênero traduzido
  if (gender) {
    const genderMap: Record<string, string> = {
      'MALE': 'Masculino',
      'FEMALE': 'Feminino',
      'OTHER': 'Outro',
      'MIXED': 'Misto'
    };
    parts.push(genderMap[String(gender)] || String(gender));
  }

  // 3️⃣ Faixa etária (formato usado em eventos esportivos)
  const minAgeNum = minAge ? Number(minAge) : null;
  const maxAgeNum = maxAge ? Number(maxAge) : null;

  if (minAgeNum !== null || maxAgeNum !== null) {
    if (minAgeNum !== null && maxAgeNum !== null) {
      // Tem ambos: "30 a 39", "40 a 49"
      parts.push(`${minAgeNum} a ${maxAgeNum}`);
    } else if (minAgeNum !== null && maxAgeNum === null) {
      // Só mínima: "60+" (60 anos ou mais)
      parts.push(`${minAgeNum}+`);
    } else if (minAgeNum === null && maxAgeNum !== null) {
      // Só máxima: "Sub-18" (menores de 18), "até 25"
      if (maxAgeNum <= 18) {
        parts.push(`Sub-${maxAgeNum}`);
      } else {
        parts.push(`até ${maxAgeNum}`);
      }
    }
  } else {
    // Sem restrição de idade: "Geral" ou "Livre"
    parts.push('Geral');
  }

  return parts.join(' - ') || 'Nova Categoria';
}

/**
 * Registro de todas as funções disponíveis
 */
export const computedFieldFunctions: Record<string, ComputedFieldFunction> = {
  categoryName,
  // Adicione mais funções aqui conforme necessário
};

/**
 * Executa uma função de cálculo
 */
export function executeComputedField(
  functionName: string,
  formData: Record<string, unknown>
): string {
  const fn = computedFieldFunctions[functionName];
  
  if (!fn) {
    console.warn(`⚠️ Função computed "${functionName}" não encontrada`);
    return '';
  }

  try {
    return fn(formData);
  } catch (error) {
    console.error(`❌ Erro ao executar função computed "${functionName}":`, error);
    return '';
  }
}
