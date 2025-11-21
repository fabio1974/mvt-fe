import React, { useMemo, useEffect, useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserRole, getUserId, getUserName, getUserCoordinates, getUserAddress, isClient } from "../../utils/auth";

/**
 * Função auxiliar para fazer geocoding reverso (lat/long -> endereço)
 */
const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API Key não configurada");
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao fazer geocoding reverso:", error);
    return null;
  }
};

/**
 * Página de CRUD para Deliveries (Entregas)
 * 
 * Para clientes (CLIENT), filtra automaticamente apenas suas entregas
 * usando o campo 'client' no filtro, que corresponde ao client_id no backend
 * e pré-preenche o campo client ao criar uma nova entrega
 */
const DeliveryCRUDPage: React.FC = () => {
  const userRole = getUserRole();
  const userId = getUserId();
  const userName = getUserName() || "Você (Cliente atual)";
  const userAddress = getUserAddress();
  
  // ⚠️ Extrai valores primitivos para evitar re-renders infinitos
  const coordinates = getUserCoordinates();
  const userLatitude = coordinates?.latitude;
  const userLongitude = coordinates?.longitude;
  
  const [defaultValues, setDefaultValues] = useState<Record<string, unknown> | undefined>(undefined);
  
  // Define filtros iniciais baseados no role
  const initialFilters = useMemo(() => {
    // Se é CLIENT, filtra apenas suas entregas
    if ((userRole === "ROLE_CLIENT" || userRole === "CLIENT") && userId) {
      // O nome do campo deve corresponder ao campo de relacionamento no metadata
      // Geralmente é o nome da entidade relacionada (sem ID)
      return { client: userId };
    }
    return undefined;
  }, [userRole, userId]);

  // Busca o endereço a partir das coordenadas do cliente
  useEffect(() => {
    const fetchDefaultValues = async () => {
      // Se é CLIENT, pré-preenche o campo client com o ID do usuário logado
      if ((userRole === "ROLE_CLIENT" || userRole === "CLIENT") && userId) {
        const values: Record<string, unknown> = {
          // Para TypeAhead, precisa ser um objeto com id e label
          client: {
            id: userId,
            label: userName
          }
        };

        // 📍 Pré-preenche latitude, longitude e endereço de origem se disponíveis
        if (userLatitude !== undefined && userLongitude !== undefined) {
          values.fromLatitude = userLatitude;
          values.fromLongitude = userLongitude;
          
          // Se temos o endereço salvo, usa diretamente
          if (userAddress) {
            values.fromAddress = userAddress;
          } else {
            // Senão, busca o endereço por extenso usando geocoding reverso
            const address = await reverseGeocode(userLatitude, userLongitude);
            if (address) {
              values.fromAddress = address;
            }
          }
        }

        setDefaultValues(values);
      }
    };

    fetchDefaultValues();
  }, [userRole, userId, userName, userAddress, userLatitude, userLongitude]);

  return (
    <EntityCRUD
      entityName="delivery"
      hideArrayFields={false}
      pageTitle="Entregas"
      pageDescription={
        userRole === "ROLE_CLIENT" || userRole === "CLIENT"
          ? "Acompanhe suas entregas"
          : "Gerencie as entregas cadastradas na plataforma"
      }
      initialFilters={initialFilters}
      defaultValues={defaultValues}
      hideFields={isClient() ? ["client"] : []}
    />
  );
};

export default DeliveryCRUDPage;
