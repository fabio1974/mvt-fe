import { useNavigate } from "react-router-dom";
import EntityTable from "../Generic/EntityTable";
import { showToast } from "../../utils/toast";
import { api } from "../../services/api";

/**
 * 🎯 EXEMPLO COMPLETO DE PÁGINA COM ENTITYTABLE
 *
 * Esta página demonstra:
 * - ✅ Listagem dinâmica de eventos
 * - ✅ Filtros automáticos (status, organização, categoria, cidade, estado)
 * - ✅ Paginação configurável
 * - ✅ Ações customizadas (visualizar, editar, excluir)
 * - ✅ Renderização customizada (badges, formatação)
 * - ✅ Integração com API
 *
 * COMO USAR:
 * 1. Copie este arquivo como template para novas páginas
 * 2. Altere o entityName para a entidade desejada
 * 3. Customize os renderers conforme necessário
 * 4. Adicione a rota no App.tsx
 */

const ExampleEventsListPage: React.FC = () => {
  const navigate = useNavigate();

  // ==========================================
  // 📊 FUNÇÕES DE TRADUÇÃO E FORMATAÇÃO
  // ==========================================

  /**
   * Traduz valores do enum EventType para português
   */
  const getSportText = (eventType: string): string => {
    const sports: Record<string, string> = {
      RUNNING: "Corrida",
      FOOTBALL: "Futebol",
      BASKETBALL: "Basquete",
      VOLLEYBALL: "Vôlei",
      TENNIS: "Tênis",
      SWIMMING: "Natação",
      CYCLING: "Ciclismo",
      TRAIL_RUNNING: "Trail Running",
      TRIATHLON: "Triatlo",
      MARATHON: "Maratona",
    };
    return sports[eventType] || eventType;
  };

  /**
   * Traduz valores do enum EventStatus para português
   */
  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      DRAFT: "Rascunho",
      PUBLISHED: "Publicado",
      ACTIVE: "Ativo",
      FINISHED: "Finalizado",
      CANCELLED: "Cancelado",
      COMPLETED: "Concluído",
    };
    return texts[status] || status;
  };

  /**
   * Retorna cores para badges de status
   */
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      DRAFT: "#6b7280", // Gray
      PUBLISHED: "#8b5cf6", // Purple
      ACTIVE: "#10b981", // Green
      FINISHED: "#3b82f6", // Blue
      CANCELLED: "#ef4444", // Red
      COMPLETED: "#3b82f6", // Blue
    };
    return colors[status] || "#6b7280";
  };

  // ==========================================
  // 🎬 HANDLERS DE AÇÕES
  // ==========================================

  /**
   * Navega para página de visualização do evento
   */
  const handleView = (eventId: number) => {
    console.log("📖 Visualizando evento ID:", eventId);
    navigate(`/eventos/${eventId}`);
  };

  /**
   * Navega para página de edição do evento
   */
  const handleEdit = (eventId: number) => {
    console.log("✏️ Editando evento ID:", eventId);
    navigate(`/editar-evento/${eventId}`);
  };

  /**
   * Exclui evento após confirmação
   */
  const handleDelete = async (eventId: number) => {
    console.log("🗑️ Solicitação de exclusão para evento ID:", eventId);

    const confirmed = window.confirm(
      "⚠️ Tem certeza que deseja excluir este evento?\n\nEsta ação não pode ser desfeita."
    );

    if (!confirmed) {
      console.log("❌ Exclusão cancelada pelo usuário");
      return;
    }

    try {
      console.log("🔄 Enviando requisição de exclusão...");
      await api.delete(`/events/${eventId}`);

      showToast("✅ Evento excluído com sucesso!", "success");
      console.log("✅ Evento excluído com sucesso");

      // Recarrega a página para atualizar a lista
      window.location.reload();
    } catch (error: unknown) {
      console.error("❌ Erro ao excluir evento:", error);

      const err = error as {
        response?: { data?: { message?: string }; status?: number };
      };
      const errorMessage = err.response?.data?.message || "";
      const isConstraintError =
        errorMessage.toLowerCase().includes("constraint") ||
        errorMessage.toLowerCase().includes("foreign key") ||
        errorMessage.toLowerCase().includes("referenced") ||
        err.response?.status === 409;

      if (isConstraintError) {
        showToast(
          "❌ Não é possível excluir este evento porque ele possui inscrições ou outras informações vinculadas. " +
            "Você precisa remover as informações relacionadas primeiro.",
          "error"
        );
      } else {
        showToast(
          `❌ ${errorMessage || "Erro ao excluir evento. Tente novamente."}`,
          "error"
        );
      }
    }
  };

  // ==========================================
  // 🎨 RENDERIZADORES CUSTOMIZADOS
  // ==========================================

  const customRenderers = {
    /**
     * Renderiza esporte traduzido
     */
    eventType: (value: string) => {
      return <span style={{ fontWeight: 500 }}>{getSportText(value)}</span>;
    },

    /**
     * Renderiza badge de status customizado
     */
    status: (value: string) => (
      <span
        className="status-badge"
        style={{
          backgroundColor: getStatusColor(value),
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "white",
          textTransform: "uppercase",
          display: "inline-block",
          minWidth: "80px",
          textAlign: "center",
        }}
      >
        {getStatusText(value)}
      </span>
    ),

    /**
     * Formata data do evento de forma mais legível
     */
    eventDate: (value: string) => {
      try {
        const date = new Date(value);
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch {
        return value;
      }
    },

    /**
     * Renderiza nome da organização com fallback
     */
    "organization.name": (value: string) => {
      return (
        <span
          style={{
            fontStyle: value ? "normal" : "italic",
            opacity: value ? 1 : 0.6,
          }}
        >
          {value || "Sem organização"}
        </span>
      );
    },

    /**
     * Formata local com ícone
     */
    location: (value: string) => {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          📍 {value || "A definir"}
        </span>
      );
    },
  };

  // ==========================================
  // 🎯 RENDER DO COMPONENTE
  // ==========================================

  return (
    <div style={{ padding: "20px" }}>
      {/* Header opcional da página */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}
        >
          📅 Gerenciamento de Eventos
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Visualize, filtre e gerencie todos os eventos da plataforma
        </p>
      </div>

      {/* EntityTable - Componente principal */}
      <EntityTable
        // Nome da entidade (deve corresponder ao metadata do backend)
        entityName="event"
        // Endpoint customizado (opcional - usa o do metadata se não fornecido)
        // apiEndpoint="/events"

        // Callbacks de ações
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        // Mostra coluna de ações (visualizar, editar, excluir)
        showActions={true}
        // Renderizadores customizados para campos específicos
        customRenderers={customRenderers}
      />

      {/* Informações de debug (remover em produção) */}
      {import.meta.env.DEV && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <strong>🔧 Debug Info:</strong>
          <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
            <li>Entity: event</li>
            <li>
              Filtros automáticos: status, organizationId, categoryId, city,
              state
            </li>
            <li>Paginação: 5, 10, 20, 50 itens por página</li>
            <li>Ações habilitadas: Visualizar, Editar, Excluir</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExampleEventsListPage;

/**
 * ==========================================
 * 📝 NOTAS DE USO
 * ==========================================
 *
 * 1. FILTROS AUTOMÁTICOS:
 *    - Os filtros são renderizados automaticamente baseado no metadata
 *    - Não precisa configurar nada manualmente
 *    - Filtros disponíveis: status, organizationId, categoryId, city, state
 *
 * 2. PAGINAÇÃO:
 *    - Configurada automaticamente pelo metadata
 *    - Usuário pode escolher: 5, 10, 20 ou 50 itens por página
 *    - Controles de navegação (primeira, anterior, próxima, última página)
 *
 * 3. CUSTOMIZAÇÃO:
 *    - Use customRenderers para alterar como campos são exibidos
 *    - Exemplo: traduzir enums, adicionar badges, formatar datas
 *    - Recebe (value, row) como parâmetros
 *
 * 4. AÇÕES:
 *    - onView: callback ao clicar em visualizar
 *    - onEdit: callback ao clicar em editar
 *    - onDelete: callback ao clicar em excluir
 *    - showActions: true/false para mostrar/ocultar coluna
 *
 * 5. PERFORMANCE:
 *    - Metadata carregado uma vez na inicialização
 *    - Debounce de 300ms nos filtros de texto
 *    - Paginação evita carregar muitos dados
 *
 * 6. PARA CRIAR NOVA PÁGINA:
 *    a) Copie este arquivo
 *    b) Altere entityName para: "registration", "payment", "user", etc.
 *    c) Customize os renderers conforme necessário
 *    d) Ajuste os handlers de ação
 *    e) Adicione rota no App.tsx
 *
 * ==========================================
 * 🔗 REFERÊNCIAS
 * ==========================================
 *
 * - METADATA_SYSTEM.md - Documentação completa
 * - QUICK_START_GUIDE.md - Guia rápido
 * - METADATA_FRONTEND_BACKEND_MAPPING.md - Mapeamento BE/FE
 * - src/components/Generic/EntityTable.tsx - Implementação
 */
