import React, { useMemo, useEffect, useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import DeliveryRouteMap from "./DeliveryRouteMap";
import DeliveryRouteMapModal from "./DeliveryRouteMapModal";
import { getUserRole, getUserId, getUserName, getUserCoordinates, getUserAddress, isClient } from "../../utils/auth";
import { api } from "../../services/api";
import { FiMap } from "react-icons/fi";
import "./DeliveryCRUDPage.css";

/**
 * Verifica se o usuário logado é ORGANIZER
 */
const isOrganizer = (): boolean => {
  const role = getUserRole();
  return role === "ROLE_ORGANIZER";
};

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
 * Comportamento por perfil:
 * - CLIENT: Filtra apenas suas entregas (campo 'client'), oculta campo cliente
 * - ORGANIZER: Filtra entregas da sua organização (campo 'organizer'), mostra campo cliente
 * - ADMIN: Vê todas as entregas, mostra campo cliente
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
  
  // Estado para controlar a modal do mapa
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | number | null>(null);
  
  // Define filtros iniciais baseados no role
  const initialFilters = useMemo((): Record<string, string> | undefined => {
    // Se é CLIENT, filtra apenas suas entregas
    if ((userRole === "ROLE_CLIENT" || userRole === "CLIENT") && userId) {
      return { client: String(userId) };
    }
    // Se é ORGANIZER, filtra entregas da sua organização
    if (userRole === "ROLE_ORGANIZER" && userId) {
      return { organizer: String(userId) };
    }
    // ADMIN vê todas
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

  // 🗺️ Componente que renderiza o mapa de rota no modo view
  const DeliveryMapWrapper: React.FC<{ entityId: number | string | undefined; viewMode: string }> = ({ entityId, viewMode }) => {
    console.log("🗺️ DeliveryMapWrapper - Montado com:", { entityId, viewMode });

    const [deliveryData, setDeliveryData] = useState<{
      fromLatitude?: number;
      fromLongitude?: number;
      toLatitude?: number;
      toLongitude?: number;
      fromAddress?: string;
      toAddress?: string;
      distanceKm?: number;
      courier?: {
        id: number;
        name: string;
        gpsLatitude?: number;
        gpsLongitude?: number;
      };
    } | null>(null);

    useEffect(() => {
      console.log("🗺️ DeliveryMapWrapper - useEffect disparado", { entityId, viewMode });
      
      // Só carrega se estiver no modo view e tiver ID
      if (viewMode !== "view" || !entityId) {
        console.log("🗺️ DeliveryMapWrapper - Não carregando (viewMode ou entityId inválido)");
        return;
      }

      const loadDelivery = async () => {
        try {
          console.log("🗺️ DeliveryMapWrapper - Carregando delivery:", entityId);
          const response = await api.get(`/api/deliveries/${entityId}`);
          console.log("🗺️ DeliveryMapWrapper - Resposta da API:", response.data);
          
          const data = response.data as {
            fromLatitude: number;
            fromLongitude: number;
            toLatitude: number;
            toLongitude: number;
            fromAddress?: string;
            toAddress?: string;
            distanceKm?: number;
            courier?: {
              id: number;
              name: string;
              gpsLatitude?: number;
              gpsLongitude?: number;
            };
          };
          
          setDeliveryData({
            fromLatitude: data.fromLatitude,
            fromLongitude: data.fromLongitude,
            toLatitude: data.toLatitude,
            toLongitude: data.toLongitude,
            fromAddress: data.fromAddress,
            toAddress: data.toAddress,
            distanceKm: data.distanceKm,
            courier: data.courier,
          });
          console.log("🗺️ DeliveryMapWrapper - Dados salvos no estado");
        } catch (error) {
          console.error("❌ DeliveryMapWrapper - Erro ao carregar dados da entrega:", error);
        }
      };

      loadDelivery();
    }, [entityId, viewMode]);

    console.log("🗺️ DeliveryMapWrapper - Estado deliveryData:", deliveryData);
    console.log("🗺️ DeliveryMapWrapper - Validações:", {
      isViewMode: viewMode === "view",
      hasDeliveryData: !!deliveryData,
      hasFromLat: deliveryData?.fromLatitude !== undefined,
      hasFromLng: deliveryData?.fromLongitude !== undefined,
      hasToLat: deliveryData?.toLatitude !== undefined,
      hasToLng: deliveryData?.toLongitude !== undefined,
    });

    // Só renderiza o mapa no modo view com todos os dados carregados
    if (viewMode !== "view" || 
        !deliveryData || 
        deliveryData.fromLatitude === undefined || 
        deliveryData.fromLongitude === undefined ||
        deliveryData.toLatitude === undefined ||
        deliveryData.toLongitude === undefined) {
      console.log("🗺️ DeliveryMapWrapper - Não renderizando mapa (condições não atendidas)");
      return null;
    }

    console.log("🗺️ DeliveryMapWrapper - ✅ Renderizando DeliveryRouteMap");

    return (
      <DeliveryRouteMap
        fromLatitude={deliveryData.fromLatitude}
        fromLongitude={deliveryData.fromLongitude}
        toLatitude={deliveryData.toLatitude}
        toLongitude={deliveryData.toLongitude}
        fromAddress={deliveryData.fromAddress}
        toAddress={deliveryData.toAddress}
        distance={deliveryData.distanceKm}
        deliveryManGpsLatitude={deliveryData.courier?.gpsLatitude}
        deliveryManGpsLongitude={deliveryData.courier?.gpsLongitude}
        deliveryManName={deliveryData.courier?.name}
        height="450px"
      />
    );
  };

  // Custom actions para adicionar ícone de mapa na coluna de ações
  const customActions = (row: any) => {
    const isInTransit = row.status === "IN_TRANSIT";
    
    return (
      <button
        onClick={() => {
          setSelectedDeliveryId(row.id);
          setMapModalOpen(true);
        }}
        className="btn-action"
        style={{
          backgroundColor: "transparent",
          border: `1px solid ${isInTransit ? "#10b981" : "#3b82f6"}`,
          color: isInTransit ? "#10b981" : "#3b82f6",
          borderRadius: "6px",
          padding: "6px 8px",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          animation: isInTransit ? "pulse 2s ease-in-out infinite, glow 2s ease-in-out infinite" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isInTransit ? "#10b981" : "#3b82f6";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = isInTransit ? "#10b981" : "#3b82f6";
        }}
        title={isInTransit ? "🏍️ Em trânsito - Ver rota no mapa" : "Ver rota no mapa"}
      >
        <FiMap size={16} />
      </button>
    );
  };

  return (
    <>
      <EntityCRUD
        entityName="delivery"
        hideArrayFields={false}
        pageTitle="Entregas"
        pageDescription={
          userRole === "ROLE_CLIENT" || userRole === "CLIENT"
            ? "Acompanhe suas entregas"
            : userRole === "ROLE_ORGANIZER"
            ? "Gerencie as entregas do seu grupo"
            : "Gerencie as entregas cadastradas na plataforma"
        }
        initialFilters={initialFilters}
        defaultValues={defaultValues}
        hideFields={
          // CLIENT oculta "client", ORGANIZER oculta "organizer", ADMIN vê tudo
          isClient() ? ["client"] : isOrganizer() ? ["organizer"] : []
        }
        hiddenFields={
          // ✅ Oculta coordenadas para todos os perfis
          // ✅ CLIENT oculta "client", ORGANIZER oculta "organizer" no formulário
          ["fromLatitude", "fromLongitude", "toLatitude", "toLongitude"].concat(
            isClient() ? ["client"] : isOrganizer() ? ["organizer"] : []
          )
        }
        afterFormComponent={(entityId, viewMode) => (
          <DeliveryMapWrapper entityId={entityId} viewMode={viewMode} />
        )}
        customActions={customActions}
      />

      {/* Modal do mapa */}
      {selectedDeliveryId && (
        <DeliveryRouteMapModal
          deliveryId={selectedDeliveryId}
          isOpen={mapModalOpen}
          onClose={() => {
            setMapModalOpen(false);
            setSelectedDeliveryId(null);
          }}
        />
      )}
    </>
  );
};

export default DeliveryCRUDPage;
