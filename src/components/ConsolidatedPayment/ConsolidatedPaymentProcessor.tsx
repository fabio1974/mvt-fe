import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { FiPlay, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";
import "./ConsolidatedPaymentProcessor.css";

interface TaskStatus {
  taskId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
  startedAt?: string;
  completedAt?: string;
  progressPercentage: number;
  statistics?: {
    processedClients?: number;
    createdPayments?: number;
    includedDeliveries?: number;
    [key: string]: number | undefined;
  };
  errors?: string[];
}

const ConsolidatedPaymentProcessor: React.FC = () => {
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  // Cleanup do polling quando componente desmonta
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Inicia o processamento
  const handleStartProcessing = async () => {
    try {
      setIsProcessing(true);
      
      const response = await api.post("/consolidated-payments/process-all");
      
      if (response.status === 202) {
        const data = response.data as TaskStatus;
        setTaskStatus(data);
        showToast("Processamento iniciado com sucesso!", "success");
        
        // Inicia polling para monitorar progresso
        startPolling(data.taskId);
      }
    } catch (error: any) {
      console.error("Erro ao iniciar processamento:", error);
      setIsProcessing(false);
      
      if (error.response?.status === 403) {
        showToast("Acesso negado. Apenas ADMIN pode processar pagamentos.", "error");
      } else {
        showToast(
          error.response?.data?.message || "Erro ao iniciar processamento de pagamentos",
          "error"
        );
      }
    }
  };

  // Polling para monitorar status
  const startPolling = (taskId: string) => {
    // Limpa polling anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Polling a cada 3 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/consolidated-payments/status/${taskId}`);
        const status = response.data as TaskStatus;
        
        setTaskStatus(status);

        // Se completou ou falhou, para o polling
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          stopPolling();
          setIsProcessing(false);

          if (status.status === "COMPLETED") {
            showToast(
              `Processamento concluído! ${status.statistics?.createdPayments || 0} pagamentos criados.`,
              "success"
            );
          } else {
            showToast(`Processamento falhou: ${status.message}`, "error");
          }
        }
      } catch (error: any) {
        console.error("Erro ao consultar status:", error);
        stopPolling();
        setIsProcessing(false);
        showToast("Erro ao consultar status do processamento", "error");
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const getStatusIcon = () => {
    if (!taskStatus) return null;

    switch (taskStatus.status) {
      case "QUEUED":
        return <FiClock className="status-icon queued" />;
      case "PROCESSING":
        return <div className="spinner" />;
      case "COMPLETED":
        return <FiCheckCircle className="status-icon completed" />;
      case "FAILED":
        return <FiAlertCircle className="status-icon failed" />;
      default:
        return null;
    }
  };

  const getStatusLabel = () => {
    if (!taskStatus) return "";

    const labels = {
      QUEUED: "Na fila",
      PROCESSING: "Processando",
      COMPLETED: "Concluído",
      FAILED: "Falhou",
    };

    return labels[taskStatus.status] || taskStatus.status;
  };

  const formatDuration = () => {
    if (!taskStatus?.startedAt) return null;

    const start = new Date(taskStatus.startedAt);
    const end = taskStatus.completedAt ? new Date(taskStatus.completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="consolidated-payment-processor">
      <div className="processor-header">
        <h2>Processamento de Pagamentos Consolidados</h2>
        <p className="description">
          Processa automaticamente todos os pagamentos consolidados pendentes para os clientes.
        </p>
      </div>

      <div className="processor-actions">
        <button
          className="btn-process"
          onClick={handleStartProcessing}
          disabled={isProcessing}
        >
          <FiPlay />
          {isProcessing ? "Processando..." : "Iniciar Processamento"}
        </button>
      </div>

      {taskStatus && (
        <div className="task-status-container">
          <div className="status-header">
            {getStatusIcon()}
            <div className="status-info">
              <h3>{getStatusLabel()}</h3>
              <p className="status-message">{taskStatus.message}</p>
              {formatDuration() && (
                <p className="status-duration">Duração: {formatDuration()}</p>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          {taskStatus.status !== "FAILED" && (
            <div className="progress-container">
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${taskStatus.progressPercentage}%` }}
                >
                  <span className="progress-percentage">
                    {taskStatus.progressPercentage}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          {taskStatus.statistics && Object.keys(taskStatus.statistics).length > 0 && (
            <div className="statistics">
              <h4>Estatísticas</h4>
              <div className="stats-grid">
                {taskStatus.statistics.processedClients !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Clientes Processados</span>
                    <span className="stat-value">{taskStatus.statistics.processedClients}</span>
                  </div>
                )}
                {taskStatus.statistics.createdPayments !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Pagamentos Criados</span>
                    <span className="stat-value">{taskStatus.statistics.createdPayments}</span>
                  </div>
                )}
                {taskStatus.statistics.includedDeliveries !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Entregas Incluídas</span>
                    <span className="stat-value">{taskStatus.statistics.includedDeliveries}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Erros */}
          {taskStatus.errors && taskStatus.errors.length > 0 && (
            <div className="errors-container">
              <h4>Erros</h4>
              <ul className="error-list">
                {taskStatus.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detalhes técnicos */}
          <div className="task-details">
            <p className="task-id">Task ID: <code>{taskStatus.taskId}</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedPaymentProcessor;
