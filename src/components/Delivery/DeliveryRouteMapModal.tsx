import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import DeliveryRouteMap from "./DeliveryRouteMap";
import { FiX } from "react-icons/fi";

interface DeliveryRouteMapModalProps {
  deliveryId: string | number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal que exibe o mapa de rota de uma entrega
 * Carrega os dados da entrega e renderiza o DeliveryRouteMap
 */
const DeliveryRouteMapModal: React.FC<DeliveryRouteMapModalProps> = ({
  deliveryId,
  isOpen,
  onClose,
}) => {
  const [deliveryData, setDeliveryData] = useState<{
    fromLatitude?: number;
    fromLongitude?: number;
    toLatitude?: number;
    toLongitude?: number;
    fromAddress?: string;
    toAddress?: string;
    distanceKm?: number;
    status?: string;
    inTransitAt?: string;
    courier?: {
      id: number;
      name: string;
      gpsLatitude?: number;
      gpsLongitude?: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !deliveryId) return;

    const loadDelivery = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/deliveries/${deliveryId}`);
        const data = response.data as any;

        setDeliveryData({
          fromLatitude: data.fromLatitude,
          fromLongitude: data.fromLongitude,
          toLatitude: data.toLatitude,
          toLongitude: data.toLongitude,
          fromAddress: data.fromAddress,
          toAddress: data.toAddress,
          distanceKm: data.distanceKm,
          status: data.status,
          inTransitAt: data.inTransitAt,
          courier: data.courier,
        });
      } catch (err) {
        console.error("Erro ao carregar dados da entrega:", err);
        setError("Erro ao carregar dados da entrega");
      } finally {
        setLoading(false);
      }
    };

    loadDelivery();
  }, [deliveryId, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay de fundo */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease-in-out",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          zIndex: 9999,
          width: "90%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "hidden",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {/* Header da Modal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            🗺️ Rota da Entrega #{String(deliveryId).padStart(8, '0')}
          </h2>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Fechar"
          >
            <FiX size={24} color="#000" strokeWidth={2} />
          </button>
        </div>

        {/* Conteúdo da Modal */}
        <div
          style={{
            padding: "24px",
            maxHeight: "calc(90vh - 80px)",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "#6b7280",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid #e5e7eb",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }}
                />
                <p>Carregando mapa...</p>
              </div>
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          ) : deliveryData &&
            deliveryData.fromLatitude !== undefined &&
            deliveryData.fromLongitude !== undefined &&
            deliveryData.toLatitude !== undefined &&
            deliveryData.toLongitude !== undefined ? (
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
              status={deliveryData.status}
              inTransitAt={deliveryData.inTransitAt}
              height="500px"
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "#6b7280",
              }}
            >
              Dados de coordenadas não disponíveis para esta entrega
            </div>
          )}
        </div>
      </div>

      {/* Estilos de animação */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default DeliveryRouteMapModal;
