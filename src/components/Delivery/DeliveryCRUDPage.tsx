import React, { useMemo, useEffect, useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import DeliveryRouteMap from "./DeliveryRouteMap";
import DeliveryRouteMapModal from "./DeliveryRouteMapModal";
import DeliveryWizard from "./DeliveryWizard";
import { getUserRole, getUserId, getUserName, getUserCoordinates, getUserAddress, isClient, isCourier } from "../../utils/auth";
import { api } from "../../services/api";
import { FiMap, FiPlus } from "react-icons/fi";
import "./DeliveryCRUDPage.css";

/**
 * Verifica se o usuário logado é ORGANIZER
 */
const isOrganizer = (): boolean => {
  const role = getUserRole();
  return role === "ROLE_ORGANIZER";
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

  // Estado para o wizard de nova entrega
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardKey, setWizardKey] = useState(0); // força re-mount após sucesso
  const [crudKey, setCrudKey] = useState(0); // força refresh da tabela
  
  // Define filtros iniciais baseados no role
  // NOTA: O backend filtra automaticamente pelo token para COURIER
  const initialFilters = useMemo((): Record<string, string> | undefined => {
    // Se é CLIENT ou CUSTOMER, filtra apenas suas entregas
    if ((userRole === "ROLE_CLIENT" || userRole === "CLIENT" || userRole === "ROLE_CUSTOMER" || userRole === "CUSTOMER") && userId) {
      return { client: String(userId) };
    }
    // Se é ORGANIZER, filtra entregas da sua organização
    if (userRole === "ROLE_ORGANIZER" && userId) {
      return { organizer: String(userId) };
    }
    // ADMIN e COURIER: backend filtra pelo token
    return undefined;
  }, [userRole, userId]);

  // Busca o endereço mais recente do cliente via API
  useEffect(() => {
    const fetchDefaultValues = async () => {
      // Se é CLIENT ou CUSTOMER, pré-preenche o campo client com o ID do usuário logado
      if ((userRole === "ROLE_CLIENT" || userRole === "CLIENT" || userRole === "ROLE_CUSTOMER" || userRole === "CUSTOMER") && userId) {
        const values: Record<string, unknown> = {
          // Para TypeAhead, precisa ser um objeto com id e label
          client: {
            id: userId,
            label: userName
          }
        };

        try {
          // 📍 Busca os endereços do cliente logado via API
          const response = await api.get("/api/addresses/me");
          const addresses = response.data as Array<{
            id: number;
            street?: string;
            number?: string;
            complement?: string;
            neighborhood?: string;
            referencePoint?: string;
            city?: { id: number; name: string; state?: string; stateCode?: string } | string;
            state?: string;
            zipCode?: string;
            latitude?: number;
            longitude?: number;
            isDefault?: boolean;
            updatedAt?: string;
          }>;

          // Pega o endereço mais recente (último updatedAt) ou o último do array
          if (addresses && addresses.length > 0) {
            // Ordena por updatedAt decrescente (mais recente primeiro)
            const sortedAddresses = [...addresses].sort((a, b) => {
              if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              }
              // Se não tem updatedAt, mantém ordem original (últimos primeiro)
              return 0;
            });
            
            // Usa o endereço mais recente (ou o último se não houver updatedAt)
            const mostRecentAddress = sortedAddresses[0] || addresses[addresses.length - 1];
            
            // Monta o endereço formatado
            const addressParts: string[] = [];
            if (mostRecentAddress.street) addressParts.push(mostRecentAddress.street);
            if (mostRecentAddress.number) addressParts.push(mostRecentAddress.number);
            if (mostRecentAddress.neighborhood) addressParts.push(mostRecentAddress.neighborhood);
            
            // Extrai o nome da cidade (pode ser objeto ou string)
            let cityName = "";
            if (mostRecentAddress.city) {
              if (typeof mostRecentAddress.city === "object" && mostRecentAddress.city.name) {
                cityName = mostRecentAddress.city.name;
                // Adiciona o estado (stateCode ou state)
                const stateCode = mostRecentAddress.city.stateCode || mostRecentAddress.city.state;
                if (stateCode) {
                  cityName += ` - ${stateCode}`;
                }
              } else if (typeof mostRecentAddress.city === "string") {
                cityName = mostRecentAddress.city;
              }
            }
            if (cityName) addressParts.push(cityName);
            if (mostRecentAddress.zipCode) addressParts.push(mostRecentAddress.zipCode);

            const formattedAddress = addressParts.join(", ");
            
            if (formattedAddress) {
              values.fromAddress = formattedAddress;
            }

            // Preenche coordenadas se disponíveis
            if (mostRecentAddress.latitude !== undefined && mostRecentAddress.longitude !== undefined) {
              values.fromLatitude = mostRecentAddress.latitude;
              values.fromLongitude = mostRecentAddress.longitude;
            }
          }
        } catch (error) {
          console.error("Erro ao buscar endereços do cliente:", error);
          // Fallback: usa dados do JWT se a API falhar
          if (userLatitude !== undefined && userLongitude !== undefined) {
            values.fromLatitude = userLatitude;
            values.fromLongitude = userLongitude;
            if (userAddress) {
              values.fromAddress = userAddress;
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
      
      // Só carrega se estiver no modo view e tiver ID
      if (viewMode !== "view" || !entityId) {
        return;
      }

      const loadDelivery = async () => {
        try {
          const response = await api.get(`/api/deliveries/${entityId}`);
          
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
        } catch (error) {
          console.error("❌ DeliveryMapWrapper - Erro ao carregar dados da entrega:", error);
        }
      };

      loadDelivery();
    }, [entityId, viewMode]);

    // Só renderiza o mapa no modo view com todos os dados carregados
    if (viewMode !== "view" || 
        !deliveryData || 
        deliveryData.fromLatitude === undefined || 
        deliveryData.fromLongitude === undefined ||
        deliveryData.toLatitude === undefined ||
        deliveryData.toLongitude === undefined) {
      return null;
    }

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

  // Estado para popup de detalhes do frete
  const [freightDetailId, setFreightDetailId] = useState<string | number | null>(null);
  const [freightDetail, setFreightDetail] = useState<any>(null);
  const [freightDetailLoading, setFreightDetailLoading] = useState(false);

  const loadFreightDetail = async (deliveryId: string | number) => {
    setFreightDetailId(deliveryId);
    setFreightDetailLoading(true);
    try {
      const resp = await api.get(`/api/deliveries/${deliveryId}`);
      const d = resp.data as any;
      // Simula frete para mostrar o breakdown
      const simResp = await api.post("/api/deliveries/simulate-freight", {
        fromLatitude: d.fromLatitude,
        fromLongitude: d.fromLongitude,
        fromAddress: d.fromAddress || "",
        toLatitude: d.toLatitude,
        toLongitude: d.toLongitude,
        toAddress: d.toAddress || "",
        distanceKm: d.distanceKm || 0,
        stops: d.stops?.map((s: any) => ({ latitude: s.latitude, longitude: s.longitude, address: s.address || "" })),
      });
      setFreightDetail({ delivery: d, freight: simResp.data });
    } catch {
      setFreightDetail(null);
    } finally {
      setFreightDetailLoading(false);
    }
  };

  // Custom renderer para shippingFee — botão com valor que abre detalhes
  const tableCustomRenderers = {
    shippingFee: (value: any, row: any) => {
      if (value == null) return "-";
      const formatted = `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
      return (
        <button
          onClick={(e) => { e.stopPropagation(); loadFreightDetail(row.id); }}
          style={{
            background: "none", border: "1px solid #d1d5db", borderRadius: 6,
            padding: "4px 10px", cursor: "pointer", fontWeight: 600,
            color: "#059669", fontSize: 13, whiteSpace: "nowrap",
          }}
          title="Ver detalhes do frete"
        >
          {formatted}
        </button>
      );
    },
  };

  // Apenas CLIENT e CUSTOMER criam entregas via wizard
  const canUseWizard = isClient() || userRole === "ROLE_CUSTOMER" || userRole === "CUSTOMER";

  const wizardButton = canUseWizard ? (
    <button
      onClick={() => setWizardOpen(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
      }}
    >
      <FiPlus size={16} />
      Nova Entrega
    </button>
  ) : undefined;

  return (
    <>
      <EntityCRUD
        key={crudKey}
        entityName="delivery"
        hideArrayFields={false}
        pageTitle="Entregas"
        pageDescription={
          userRole === "ROLE_CLIENT" || userRole === "CLIENT" || userRole === "ROLE_CUSTOMER" || userRole === "CUSTOMER"
            ? "Acompanhe suas entregas"
            : userRole === "ROLE_ORGANIZER"
            ? "Gerencie as entregas do seu grupo"
            : userRole === "ROLE_COURIER"
            ? "Acompanhe suas corridas"
            : "Gerencie as entregas cadastradas na plataforma"
        }
        extraHeaderActions={wizardButton}
        hideCreateButton={canUseWizard}
        initialFilters={initialFilters}
        defaultValues={defaultValues}
        tableHideFields={[
          "actualRoute", "approachRoute", "plannedRoute",
          "estimatedDistanceKm", "estimatedShippingFee",
          "fromLatitude", "fromLongitude", "toLatitude", "toLongitude",
          "paymentCaptured", "inTransitAt",
        ]}
        disableCreate={isOrganizer() || isCourier()}
        hideFields={
          isClient() ? ["client"] : isOrganizer() ? ["organizer"] : []
        }
        hiddenFields={
          ["fromLatitude", "fromLongitude", "toLatitude", "toLongitude"].concat(
            isClient() ? ["client"] : isOrganizer() ? ["organizer"] : []
          )
        }
        afterFormComponent={(entityId, viewMode) => (
          <DeliveryMapWrapper entityId={entityId} viewMode={viewMode} />
        )}
        customActions={customActions}
        customRenderers={tableCustomRenderers}
        canEdit={() => false}
        canDelete={(row) => !isCourier() && row.status === "PENDING"}
      />

      {/* Popup detalhes do frete */}
      {freightDetailId && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9990 }} onClick={() => setFreightDetailId(null)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 12, padding: 24, zIndex: 9991, minWidth: 360, maxWidth: 500, boxShadow: "0 20px 25px -5px rgb(0 0 0/0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🧮 Detalhes do Frete</h3>
              <button onClick={() => setFreightDetailId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            {freightDetailLoading ? (
              <div style={{ textAlign: "center", padding: 20, color: "#6b7280" }}>Calculando...</div>
            ) : freightDetail?.freight ? (() => {
              const f = freightDetail.freight;
              const vd = f.motorcycle || f.car;
              const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
              if (!vd) return <div style={{ color: "#6b7280" }}>Dados não disponíveis</div>;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Veículo</span><span>{vd.vehicleLabel || "🏍️ Moto"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Taxa base</span><span>{fmt(vd.baseFee)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Distância ({f.distanceKm?.toFixed(2)} km × {fmt(vd.pricePerKm)}/km)</span><span>{fmt(f.distanceKm * vd.pricePerKm)}</span></div>
                  {vd.minimumApplied && <div style={{ display: "flex", justifyContent: "space-between", color: "#f59e0b" }}><span>ℹ️ Valor mínimo aplicado</span><span>{fmt(vd.minimumFee)}</span></div>}
                  <div style={{ borderTop: "1px solid #d1d5db", paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span style={{ color: "#6b7280" }}>Subtotal</span><span>{fmt(vd.feeBeforeZone)}</span></div>
                  {f.zoneName && <div style={{ display: "flex", justifyContent: "space-between", color: f.zoneType === "DANGER" ? "#dc2626" : "#7c3aed" }}><span>{f.zoneType === "DANGER" ? "⚠️" : "💎"} Zona: {f.zoneName} (+{(f.zoneFeePercentage * 100).toFixed(0)}%)</span><span>+{fmt(vd.zoneSurcharge)}</span></div>}
                  {f.stopCount > 1 && f.totalAdditionalStopFee > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#6366f1" }}><span>📍 {f.stopCount - 1} parada(s) extra</span><span>+{fmt(f.totalAdditionalStopFee)}</span></div>}
                  <div style={{ borderTop: "2px solid #16a34a", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: "#166534" }}><span>Total</span><span>{fmt(vd.totalShippingFee)}</span></div>
                </div>
              );
            })() : (
              <div style={{ color: "#6b7280" }}>Não foi possível calcular os detalhes</div>
            )}
          </div>
        </>
      )}

      {/* Modal do mapa */}
      {selectedDeliveryId && (
        <DeliveryRouteMapModal
          deliveryId={selectedDeliveryId}
          isOpen={mapModalOpen}
          onClose={() => {
            setMapModalOpen(false);
            setSelectedDeliveryId(null);
            setCrudKey((k) => k + 1); // refresh da tabela
          }}
        />
      )}

      {/* Wizard de nova entrega multi-parada */}
      {wizardOpen && (
        <DeliveryWizard
          key={wizardKey}
          defaultValues={defaultValues as any}
          onSuccess={(deliveryId) => {
            setWizardOpen(false);
            setWizardKey((k) => k + 1);
            // Abre o mapa da entrega recém-criada
            setSelectedDeliveryId(deliveryId);
            setMapModalOpen(true);
          }}
          onCancel={() => setWizardOpen(false)}
        />
      )}
    </>
  );
};

export default DeliveryCRUDPage;
