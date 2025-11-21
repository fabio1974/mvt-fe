import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { FiPackage, FiHome, FiChevronRight } from "react-icons/fi";
import QRCodeSVG from "react-qr-code";
import EntityTable from "../Generic/EntityTable";
import { isClient } from "../../utils/auth";
import "../Generic/EntityCRUD.css";

/**
 * Página de Pagamento Diário para Clientes
 * 
 * Mostra entregas concluídas no dia corrente sem pagamento
 * e gera QR Code para pagamento total
 */
const DailyPaymentPage: React.FC = () => {
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);

  useEffect(() => {
    loadDailySummary();
  }, []);

  const loadDailySummary = async () => {
    try {
      // Busca entregas concluídas hoje sem pagamento
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const response = await api.get<{ content: any[] }>("/api/deliveries", {
        params: {
          status: "COMPLETED",
          hasPayment: false,
          completedAfter: startOfDay,
          completedBefore: endOfDay,
          size: 1000,
        },
      });

      const deliveries = response.data.content || [];
      setDeliveryCount(deliveries.length);

      // Calcula o total
      const total = deliveries.reduce(
        (sum: number, delivery: any) => sum + (delivery.shippingFee || 0),
        0
      );
      setTotalAmount(total);

      console.log(`💰 Total de entregas hoje: ${deliveries.length}, Valor: R$ ${total.toFixed(2)}`);
    } catch (error) {
      console.error("Erro ao carregar resumo do dia:", error);
      showToast("Erro ao carregar resumo do dia", "error");
    }
  };

  // Gera o PIX payload (exemplo simplificado - adaptar conforme necessário)
  const generatePixPayload = () => {
    // TODO: Implementar geração real do PIX payload com Brcode
    const pixKey = "pagamento@zapi10.com"; // Substituir pela chave PIX real
    return `00020126580014br.gov.bcb.pix0136${pixKey}52040000530398654${String(totalAmount.toFixed(2)).padStart(13, '0')}5802BR5925Sistema Zapi106009SAO PAULO62070503***6304`;
  };

  // Filtros para a tabela - entregas concluídas hoje sem pagamento
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const tableFilters = {
    status: "COMPLETED",
    hasPayment: "false",
    completedAfter: startOfDay,
    completedBefore: endOfDay,
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
            <span>Pagamento Diário</span>
          </div>
        </div>
      </div>

      {/* Container para o conteúdo */}
      <div className="entity-crud-container">
        {/* Tabela de Entregas */}
        <EntityTable
          entityName="delivery"
          showActions={false}
          hideHeader={true}
          hideFilters={true}
          noWrapper={true}
          hideFields={isClient() ? ["client"] : []}
          initialFilters={tableFilters}
          customRenderers={{
            shippingFee: (value: number) => (
              <span className="font-medium text-green-600">
                R$ {(value || 0).toFixed(2)}
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
          }}
        />

        {/* QR Code de Pagamento - SEMPRE aparece */}
        <div className="entity-crud-form-wrapper mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            💳 Pagar com PIX
          </h2>
          
          {deliveryCount > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                  <QRCodeSVG
                    value={generatePixPayload()}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">
                  Escaneie o QR Code com o app do seu banco
                </p>
              </div>

              {/* Informações de Pagamento */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-600 mb-1">Total de Entregas</p>
                  <p className="text-2xl font-bold text-gray-900 mb-3">
                    {deliveryCount} {deliveryCount === 1 ? "entrega" : "entregas"}
                  </p>
                </div>

                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-600 mb-1">Valor Total a Pagar</p>
                  <p className="text-4xl font-bold text-green-600">
                    R$ {totalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="text-center md:text-left w-full">
                  <p className="text-xs text-gray-500 mb-1">Chave PIX</p>
                  <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded border border-gray-300">
                    pagamento@zapi10.com
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatePixPayload());
                    showToast("Código PIX copiado para a área de transferência!", "success");
                  }}
                  className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  📋 Copiar Código PIX
                </button>

                <p className="text-xs text-gray-500 text-center md:text-left max-w-xs">
                  💡 Após o pagamento, as entregas serão automaticamente marcadas como pagas
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl text-gray-600 mb-2">
                Nenhuma entrega concluída hoje
              </p>
              <p className="text-gray-500">
                Entregas concluídas sem pagamento aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyPaymentPage;
