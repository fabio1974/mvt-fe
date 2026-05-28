import React, { useState } from "react";
import { FiBarChart2 } from "react-icons/fi";
import EntityCRUD from "../Generic/EntityCRUD";
import CouponProjectionModal from "./CouponProjectionModal";

/**
 * CRUD admin de Cupons (Campanhas de Desconto).
 *
 * O admin define `couponsCount` (quantidade de cupons); o BE deriva o orçamento total
 * (`budgetTotalCents = couponsCount × descontoMáx`) no save. O action button "Relatório"
 * abre uma projeção de custo (CAC bruto/líquido, taxa Pagar.me, margem absorvida).
 *
 * APENAS ADMIN.
 */
const CouponCRUDPage: React.FC = () => {
  const [projection, setProjection] = useState<{ id: number | string; code?: string } | null>(null);

  return (
    <>
      <EntityCRUD
        entityName="coupon"
        hideArrayFields={true}
        pageTitle="Campanhas de Desconto"
        pageDescription="Gerencie cupons de desconto (ex.: primeira compra)"
        initialFilters={{ active: "true" }}
        customActions={(row: { id: number | string; code?: string }) => (
          <button
            onClick={() => setProjection({ id: row.id, code: row.code })}
            title="Relatório / projeção de custo"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              border: "none",
              borderRadius: 4,
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 14,
              marginRight: 8,
            }}
          >
            <FiBarChart2 />
          </button>
        )}
      />

      {projection && (
        <CouponProjectionModal
          couponId={projection.id}
          couponCode={projection.code}
          onClose={() => setProjection(null)}
        />
      )}
    </>
  );
};

export default CouponCRUDPage;
