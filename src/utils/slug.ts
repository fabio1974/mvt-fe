/**
 * Converte um texto em slug amigável para URLs
 * @param text - Texto a ser convertido
 * @param id - ID do evento para garantir unicidade
 * @returns Slug formatado
 */
export function createSlug(text: string, id?: number): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim

  // Adiciona o ID no final para garantir unicidade
  return id ? `${slug}-${id}` : slug;
}

/**
 * Extrai o ID do evento a partir do slug
 * @param slug - Slug do evento
 * @returns ID do evento ou null se não encontrado
 */
export function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Gera URL amigável para evento
 * @param eventName - Nome do evento
 * @param eventId - ID do evento
 * @returns URL completa do evento
 */
export function getEventUrl(eventName: string, eventId: number): string {
  const slug = createSlug(eventName, eventId);
  return `/evento/${slug}`;
}

/**
 * Valida se um slug está no formato correto
 * @param slug - Slug a ser validado
 * @returns true se válido, false caso contrário
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+-\d+$/.test(slug);
}