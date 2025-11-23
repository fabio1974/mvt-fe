import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { FiDollarSign, FiHome, FiChevronRight, FiCheckCircle, FiClock } from "react-icons/fi";
import EntityTable from "../Generic/EntityTable";
import { getUserId, getUserRole } from "../../utils/auth";
import "../Generic/EntityCRUD.css";
import "./OrganizerFinancialPage.css";

/**
 * Página de Balanço Financeiro para Organizers
 * 
 * Mostra entregas completadas do organizer com resumo financeiro
 */
const OrganizerFinancialPage: React.FC = () => {
  const [totalShippingFees, setTotalShippingFees] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);

  const userId = getUserId();
  const userRole = getUserRole();

  const isOrganizer = (): boolean => {
    return userRole === "ROLE_ORGANIZER" || userRole === "ORGANIZER";
  };

  useEffect(() => {
    loadFinancialSummary();
  }, [userId]);

  const loadFinancialSummary = async () => {
    try {
      console.log("💰 Carregando resumo financeiro do organizer:", userId);

      // Busca todas as entregas completadas do organizer
      const response = await api.get<{ content: any[] }>("/api/deliveries", {
        params: {
          "organizer.id": userId,
          status: "COMPLETED",
          size: 1000,
        },
      });

      const deliveries = response.data.content || [];
      setDeliveryCount(deliveries.length);

      // Calcula os totais
      let shippingTotal = 0;
      let paidTotal = 0;

      deliveries.forEach((delivery: any) => {
        const shippingFee = delivery.shippingFee || 0;
        shippingTotal += shippingFee;

        // Se tem payment e está pago
        if (delivery.payment && delivery.payment.amount > 0) {
          paidTotal += delivery.payment.amount;
        }
      });

      const pendingTotal = shippingTotal - paidTotal;

      setTotalShippingFees(shippingTotal);
      setTotalPaid(paidTotal);
      setTotalPending(pendingTotal);

      console.log(`💰 Resumo: ${deliveries.length} entregas | Total: R$ ${shippingTotal.toFixed(2)} | Pago: R$ ${paidTotal.toFixed(2)} | Pendente: R$ ${pendingTotal.toFixed(2)}`);
    } catch (error) {
      console.error("❌ Erro ao carregar resumo financeiro:", error);
      showToast("Erro ao carregar resumo financeiro", "error");
    }
  };

  // Filtros para a tabela - entregas completadas do organizer
  const tableFilters = {
    "organizer.id": userId?.toString() || "",
    status: "COMPLETED",
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      {/* Breadcrumb com mesmo estilo do CRUD */}
      <div className="entity-crud-breadcrumb">
        <div className="breadcrumb-content">
          <div className="breadcrumb-item">
            <FiHome className="breadcrumb-icon" />
            <span>Início</span>
          </div>
          <FiChevronRight className="breadcrumb-separator" />
          <div className="breadcrumb-item">
            <span>Balanço Financeiro</span>
            <span style={{ 
              marginLeft: "8px", 
              fontSize: "0.9em", 
              color: "#ffffff",
              fontWeight: "normal" 
            }}>
              (Entregas completadas do seu grupo)
            </span>
          </div>
        </div>
      </div>

      {/* Container para o conteúdo */}
      <div className="entity-crud-container">
        {/* Tabela de Entregas */}
        <EntityTable
          entityName="delivery"
          showActions={true}
          hideHeader={true}
          hideFilters={true}
          noWrapper={true}
          hideFields={isOrganizer() ? ["organizer"] : []}
          initialFilters={tableFilters}
          customRenderers={{
            shippingFee: (value: number) => (
              <span className="font-medium text-green-600">
                {formatCurrency(value || 0)}
              </span>
            ),
            completedAt: (value: string) => (
              <span className="text-gray-700">
                {value ? new Date(value).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "-"}
              </span>
            ),
            payment: (value: any) => (
              <span className={`font-medium ${value && value.amount > 0 ? "text-green-600" : "text-orange-600"}`}>
                {value && value.amount > 0 ? formatCurrency(value.amount) : "Pendente"}
              </span>
            ),
          }}
        />

        {/* Resumo Financeiro - NO LUGAR DO QR CODE */}
        <div className="entity-crud-form-wrapper mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            💰 Resumo Financeiro
          </h2>
          
          {deliveryCount > 0 ? (
            <div className="financial-summary-grid">
              {/* Card 1: Total em Fretes */}
              <div className="financial-card total-card">
                <div className="card-icon-wrapper">
                  <FiDollarSign size={32} className="card-icon" />
                </div>
                <div className="card-content">
                  <p className="card-label">Total em Fretes</p>
                  <p className="card-value">{formatCurrency(totalShippingFees)}</p>
                  <p className="card-subtitle">
                    {deliveryCount} {deliveryCount === 1 ? "entrega completada" : "entregas completadas"}
                  </p>
                </div>
              </div>

              {/* Card 2: Valores Recebidos */}
              <div className="financial-card paid-card">
                <div className="card-icon-wrapper">
                  <FiCheckCircle size={32} className="card-icon" />
                </div>
                <div className="card-content">
                  <p className="card-label">Valores Recebidos</p>
                  <p className="card-value">{formatCurrency(totalPaid)}</p>
                  <p className="card-subtitle">
                    {totalShippingFees > 0
                      ? `${((totalPaid / totalShippingFees) * 100).toFixed(1)}% do total`
                      : "0% do total"}
                  </p>
                </div>
              </div>

              {/* Card 3: Valores a Receber */}
              <div className="financial-card pending-card">
                <div className="card-icon-wrapper">
                  <FiClock size={32} className="card-icon" />
                </div>
                <div className="card-content">
                  <p className="card-label">Valores a Receber</p>
                  <p className="card-value">{formatCurrency(totalPending)}</p>
                  <p className="card-subtitle">
                    {totalShippingFees > 0
                      ? `${((totalPending / totalShippingFees) * 100).toFixed(1)}% do total`
                      : "0% do total"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiDollarSign className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl text-gray-600 mb-2">
                Nenhuma entrega completada
              </p>
              <p className="text-gray-500">
                Entregas completadas do seu grupo aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrganizerFinancialPage;
