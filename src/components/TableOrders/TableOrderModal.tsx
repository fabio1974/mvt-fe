import { useCallback, useState } from "react";
import DetailView from "./tableFlow/DetailView";
import MenuView from "./tableFlow/MenuView";
import ProductView from "./tableFlow/ProductView";
import type { FlowView, PendingItem, RestaurantTable } from "./tableFlow/types";
import { useTableFlowData } from "./tableFlow/useTableFlowData";
import "./TableOrderModal.css";
import "./tableFlow/tableFlow.css";

interface Props {
  table: RestaurantTable;
  onClose: () => void;
  onUpdated: () => void;
}

/**
 * Wrapper da modal de gerenciamento de mesa.
 * Paridade com mobile/WaiterTableFlow: navegação interna entre detail → menu → product,
 * estado central de drafts (PendingItem[]) com identidade própria, suporte a
 * addons + observação per-item (fase 2).
 */
export default function TableOrderModal({ table, onClose, onUpdated }: Props) {
  const data = useTableFlowData(table);

  const [view, setView] = useState<FlowView>({ kind: "detail" });
  const [activeCommandId, setActiveCommandId] = useState<number | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [cancelledItemIds, setCancelledItemIds] = useState<Set<number>>(new Set());

  const goBack = useCallback(() => {
    setView((v) => {
      if (v.kind === "detail") { onClose(); return v; }
      if (v.kind === "menu") {
        if (v.categoryName) return { kind: "menu" };
        return { kind: "detail" };
      }
      if (v.kind === "product") return { kind: "menu" };
      return v;
    });
  }, [onClose]);

  if (data.loading) {
    return (
      <div className="tom-overlay" onClick={onClose}>
        <div className="tom-panel" onClick={(e) => e.stopPropagation()}>
          <div className="tom-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  const common = {
    table, data,
    activeCommandId, setActiveCommandId,
    pendingItems, setPendingItems,
    cancelledItemIds, setCancelledItemIds,
    onExit: onClose,
    onUpdated,
    navigate: setView,
    goBack,
  };

  let content: React.ReactNode;
  switch (view.kind) {
    case "detail":
      content = <DetailView {...common} />;
      break;
    case "menu":
      content = <MenuView {...common} categoryName={view.categoryName} />;
      break;
    case "product":
      content = <ProductView {...common} productId={view.productId} editingDraftId={view.editingDraftId} />;
      break;
  }

  return (
    <div className="tom-overlay" onClick={onClose}>
      <div className="tom-panel" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
