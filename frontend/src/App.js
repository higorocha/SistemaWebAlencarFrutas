// src/App.js
import React from "react";
import CustomScrollbar from "./CustomScrollbar.js";
import "simplebar-react/dist/simplebar.min.css";
import "antd/dist/reset.css";
import ptBR from "antd/lib/locale/pt_BR";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from './components/PrivateRoute';

import { ConfigProvider, App as AntApp } from "antd";
import "./App.css";
import "./global.css";
import "./FormGlobal.css";
import "./EditableTableForm.css";
import "./components/common/buttons/ButtonStyles.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Configuracoes from "./pages/Configuracoes";
import AreasAgricolas from "./pages/AreasAgricolas";
import Frutas from "./pages/Frutas";
import Clientes from "./pages/Clientes";
import Culturas from "./pages/Culturas";
import Pedidos from "./pages/Pedidos";
import PedidosDashboard from "./pages/PedidosDashboard";
import Fornecedores from "./pages/FornecedoresPage";
import TurmaColheita from "./pages/TurmaColheita";
import Pagamentos from "./pages/Pagamentos";
import ControleBanana from "./pages/producao/ControleBanana";
import MapaGeral from "./pages/MapaGeral";
import Login from "./pages/Login";
import { NotificacaoProvider } from './contexts/NotificacaoContext';
import { useThemeVariables } from './hooks/useThemeVariables';
import { setAntAppInstance } from './config/notificationConfig';

const LoadingContext = React.createContext();

// Componente interno para usar useApp dentro do AntApp
const AppContent = ({ children }) => {
  const antApp = AntApp.useApp();
  
  // Configurar instância do App para notificações
  React.useEffect(() => {
    setAntAppInstance(antApp);
  }, [antApp]);
  
  return <>{children}</>;
};

const App = () => {
  const [loading, setLoading] = React.useState(false);
  
  // Aplicar CSS Variables do tema
  useThemeVariables();

  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        components: {
          Message: {
            zIndexPopupBase: 100001, // Maior que modal filho (100000)
          },
          Notification: {
            zIndexPopupBase: 100001, // Maior que modal filho (100000)
          },
        },
      }}
    >
      <AntApp>
        <AppContent>
          <AuthProvider>
            <LoadingContext.Provider value={{ loading, setLoading }}>
              <CustomScrollbar>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <Routes>
                    {/* Rota pública */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Rotas protegidas */}
                    <Route path="/*" element={
                      <PrivateRoute>
                        <NotificacaoProvider>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/areas-agricolas" element={<AreasAgricolas />} />
                            <Route path="/frutas" element={<Frutas />} />
                            <Route path="/clientes" element={<Clientes />} />
                            <Route path="/culturas" element={<Culturas />} />
                            <Route path="/pedidos" element={<Pedidos />} />
                            <Route path="/pedidos/dashboard" element={<PedidosDashboard />} />
                            <Route path="/fornecedores" element={<Fornecedores />} />
                            <Route path="/turma-colheita" element={<TurmaColheita />} />
                            <Route path="/relatorios/pagamentos" element={<Pagamentos />} />
                            <Route path="/producao/banana" element={<ControleBanana />} />
                            <Route path="/mapa-geral" element={<MapaGeral />} />
                            <Route path="/configuracoes" element={<Configuracoes />} />
                          </Routes>
                        </Layout>
                        </NotificacaoProvider>
                      </PrivateRoute>
                    } />
                  </Routes>
                </Router>
              </CustomScrollbar>
              {loading && <div className="spinner">Loading...</div>}
            </LoadingContext.Provider>
          </AuthProvider>
        </AppContent>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
