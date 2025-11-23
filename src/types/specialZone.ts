/**
 * Tipo de zona especial
 */
export type SpecialZoneType = 'DANGER' | 'HIGH_INCOME';

/**
 * Interface para Zona Especial
 */
export interface SpecialZone {
  id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  zoneType: SpecialZoneType;
  radiusMeters?: number; // Raio de influência em metros (padrão: 300)
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Dados para criar/atualizar zona especial
 */
export interface SpecialZoneInput {
  latitude: number;
  longitude: number;
  address?: string;
  zoneType: SpecialZoneType;
  radiusMeters?: number;
  isActive?: boolean;
  notes?: string;
}

/**
 * Resposta de busca de zona mais próxima
 */
export interface NearestZoneResponse {
  zone: SpecialZone | null;
  distance: number; // Distância em metros
  withinRadius: boolean; // Se está dentro do raio de influência
}
