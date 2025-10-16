// src/pages/Configuracoes.js
import React, {
  useState,
  Suspense,
  lazy,
  startTransition,
  useEffect,
} from "react";
import { Typography, Card, Tabs } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { BankOutlined, SettingOutlined, UserOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import CentralizedLoader from "components/common/loaders/CentralizedLoader";
import { MailOutlined } from "@mui/icons-material";
import { showNotification } from "config/notificationConfig";
import axiosInstance from "../api/axiosConfig";
import styled from "styled-components";
import "../components/configuracoes/ConfiguracaoFormStyles.css";

const { Title } = Typography;

// Componentes lazy
const Geral = lazy(() => import("../components/configuracoes/Geral"));
const DadosBancarios = lazy(() =>
  import("../components/configuracoes/DadosBancarios")
);
const Usuarios = lazy(() => import("../components/configuracoes/Usuarios"));
const Preferencias = lazy(() =>
  import("../components/configuracoes/ConfigServers")
);
const Certificados = lazy(() =>
  import("../components/configuracoes/Certificados")
);

// Styled components para aplicar o estilo do sistema
const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8f5e8;
  overflow: hidden;
  
  .ant-card-body {
    padding: 0;
  }
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    background: linear-gradient(135deg, #f8fffe 0%, #f0fdf4 100%);
    margin: 0;
    padding: 0 24px;
    border-bottom: 2px solid #e8f5e8;
  }
  
  .ant-tabs-tab {
    border: none !important;
    border-radius: 12px 12px 0 0 !important;
    margin-right: 8px !important;
    padding: 16px 24px !important;
    background: transparent !important;
    transition: all 0.3s ease !important;
    
    &:hover {
      background: rgba(5, 150, 105, 0.1) !important;
      color: #059669 !important;
    }
    
    &.ant-tabs-tab-active {
      background: #059669 !important;
      color: white !important;
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
      
      .ant-tabs-tab-btn {
        color: white !important;
      }
    }
  }
  
  .ant-tabs-content-holder {
    padding: 24px;
    background: white;
  }
`;

// Variantes de animação para cada tab
const tabVariants = {
  initial: { x: 50, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

const API_URL = "/config/dados-empresa";

const Configuracoes = () => {
  // state para gerenciar a aba ativa
  const [activeKey, setActiveKey] = useState("1");
  const [loading, setLoading] = useState(false);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);

  // Função para buscar dados da empresa
  const buscarDadosEmpresa = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_URL);
      setDadosEmpresa(response.data);
    } catch (error) {
      showNotification(
        "error",
        "Erro ao Buscar Dados",
        "Erro ao carregar dados da empresa."
      );
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    buscarDadosEmpresa();
  }, []);

  // Função para salvar dados
  const handleSalvarDados = async (values) => {
    try {
      setLoading(true);
      const dadosFormatados = {
        ...values,
        cep: values.cep.replace(/[^\d-]/g, ""), // Remove qualquer caractere que não seja número ou hífen
      };
      await axiosInstance.post(API_URL, dadosFormatados);
      showNotification("success", "Dados Salvos", "Dados salvos com sucesso!");
      buscarDadosEmpresa(); // Recarrega os dados
    } catch (error) {
      showNotification(
        "error",
        "Erro ao Salvar",
        "Ocorreu um erro ao salvar os dados."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    startTransition(() => {
      setActiveKey(key);
    });
  };

  // Conteúdo que será renderizado em cada aba
  const tabsContent = {
    1: (
      <motion.div
        key="1"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={tabVariants}
      >
        <Suspense fallback={<CentralizedLoader visible={true} message="Carregando configurações gerais..." />}>
          <Geral
            loading={loading}
            dadosEmpresa={dadosEmpresa}
            onSalvar={handleSalvarDados}
          />
        </Suspense>
      </motion.div>
    ),
    2: (
      <motion.div
        key="2"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={tabVariants}
      >
        <Suspense fallback={<CentralizedLoader visible={true} message="Carregando dados bancários..." />}>
          <DadosBancarios />
        </Suspense>
      </motion.div>
    ),
    3: (
      <motion.div
        key="3"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={tabVariants}
      >
        <Suspense fallback={<CentralizedLoader visible={true} message="Carregando usuários..." />}>
          <Usuarios />
        </Suspense>
      </motion.div>
    ),
    4: (
      <motion.div
        key="4"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={tabVariants}
      >
        <Suspense fallback={<CentralizedLoader visible={true} message="Carregando configurações de servidor..." />}>
          <Preferencias />
        </Suspense>
      </motion.div>
    ),
    5: (
      <motion.div
        key="5"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={tabVariants}
      >
        <Suspense fallback={<CentralizedLoader visible={true} message="Carregando monitoramento de certificados..." />}>
          <Certificados />
        </Suspense>
      </motion.div>
    ),
  };

  // Configuração das abas (label, key, etc.)
  const items = [
    {
      label: (
        <span>
          <SettingOutlined
            style={{
              fontSize: "20px",
              verticalAlign: "middle",
              marginRight: "8px",
            }}
          />
          <span style={{ fontSize: "16px" }}>Geral</span>
        </span>
      ),
      key: "1",
    },
    {
      label: (
        <span>
          <BankOutlined
            style={{
              fontSize: "20px",
              verticalAlign: "middle",
              marginRight: "8px",
            }}
          />
          <span style={{ fontSize: "16px" }}>Dados Bancários</span>
        </span>
      ),
      key: "2",
    },
    {
      label: (
        <span>
          <UserOutlined
            style={{
              fontSize: "20px",
              verticalAlign: "middle",
              marginRight: "8px",
            }}
          />
          <span style={{ fontSize: "16px" }}>Usuários</span>
        </span>
      ),
      key: "3",
    },
    {
      label: (
        <span>
          <MailOutlined
            style={{
              fontSize: "20px",
              verticalAlign: "middle",
              marginRight: "8px",
            }}
          />
          <span style={{ fontSize: "16px" }}>Servidores (Email/WhatsApp)</span>
        </span>
      ),
      key: "4",
    },
    {
      label: (
        <span>
          <SafetyCertificateOutlined
            style={{
              fontSize: "20px",
              verticalAlign: "middle",
              marginRight: "8px",
            }}
          />
          <span style={{ fontSize: "16px" }}>Certificados</span>
        </span>
      ),
      key: "5",
    },
  ];

  return (
    <div className="configuracao-form" style={{ padding: 16 }}>
      {/* Título */}
      <Typography.Title level={1} style={{ marginBottom: 16, color: "#059669" }}>
        Configurações
      </Typography.Title>

      <StyledCard>
        <StyledTabs
          type="card"
          activeKey={activeKey}
          onChange={handleTabChange}
          items={items}
          size={"large"}
          destroyInactiveTabPane
        />

        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeKey}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={tabVariants}
            transition={{ duration: 0.3 }}
            style={{ position: "relative" }}
          >
            {tabsContent[activeKey]}
          </motion.div>
        </AnimatePresence>
      </StyledCard>
    </div>
  );
};

export default Configuracoes;
