// src/pages/Configuracoes.js
import React, {
  useState,
  Suspense,
  lazy,
  startTransition,
  useEffect,
} from "react";
import { Spin, Typography, Card, Tabs } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { BankOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import LoadingFallback from "components/common/loaders/LoadingFallback"; // se você tiver esse componente
import { MailOutlined } from "@mui/icons-material";
import { showNotification } from "config/notificationConfig";
import axiosInstance from "../api/axiosConfig"; // Substituir axios por axiosInstance
// Se não tiver, pode usar <Spin /> diretamente ou criar um fallback simples.

const { Title } = Typography;

// Aqui, só para fins de exemplo, vamos criar 4 componentes fictícios
// que representam o conteúdo de cada aba.
// Se preferir, você pode extrair cada um para um arquivo separado.
const Geral = lazy(() => import("../components/configuracoes/Geral"));
const DadosBancarios = lazy(() =>
  import("../components/configuracoes/DadosBancarios")
);
const Usuarios = lazy(() => import("../components/configuracoes/Usuarios"));
const Preferencias = lazy(() =>
  import("../components/configuracoes/ConfigServers")
);

// Exemplo de variantes de animação para cada tab
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
        <Suspense fallback={<Spin />}>
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
        <Suspense
          fallback={<LoadingFallback message="Carregando dados bancários..." />}
        >
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
        <Suspense
          fallback={<LoadingFallback message="Carregando usuários..." />}
        >
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
        <Suspense
          fallback={
            <LoadingFallback message="Carregando servidor de email..." />
          }
        >
          <Preferencias />
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
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Configurações
      </Title>

      <Card style={{ padding: 16 }}>
        <Tabs
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
            style={{ position: "relative", marginTop: 16 }}
          >
            {tabsContent[activeKey]}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default Configuracoes;
