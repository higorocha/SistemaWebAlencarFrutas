// src/components/pedidos/dashboard/StatusSectionsContainer.js

import React from "react";
import { Row, Col } from "antd";
import {
  AguardandoColheitaSection,
  AguardandoPrecificacaoSection,
  AguardandoPagamentoSection,
} from "./StatusSection";

const StatusSectionsContainer = ({ 
  dashboardData, 
  onColheita, 
  onPrecificacao, 
  onPagamento,
  onVisualizar,
  loadingType = null // null, 'novo-pedido', 'colheita', 'precificacao', 'pagamento'
}) => {
  return (
    <div className="status-sections-container">
      <Row gutter={[16, 16]} style={{ height: "100%" }}>
        {/* Aguardando Colheita */}
        <Col xs={24} lg={8} style={{ height: "100%" }}>
          <AguardandoColheitaSection
            pedidos={dashboardData.aguardandoColheita}
            onAction={onColheita}
            onVisualizar={onVisualizar}
            showProgress={loadingType === 'novo-pedido' || loadingType === 'colheita'}
          />
        </Col>

        {/* Aguardando Precificação */}
        <Col xs={24} lg={8} style={{ height: "100%" }}>
          <AguardandoPrecificacaoSection
            pedidos={dashboardData.aguardandoPrecificacao}
            onAction={onPrecificacao}
            onVisualizar={onVisualizar}
            showProgress={loadingType === 'colheita' || loadingType === 'precificacao'}
          />
        </Col>

        {/* Aguardando Pagamento */}
        <Col xs={24} lg={8} style={{ height: "100%" }}>
          <AguardandoPagamentoSection
            pedidos={dashboardData.aguardandoPagamento}
            onAction={onPagamento}
            onVisualizar={onVisualizar}
            showProgress={loadingType === 'precificacao' || loadingType === 'pagamento'}
          />
        </Col>
      </Row>
    </div>
  );
};

export default StatusSectionsContainer;