import React, { useEffect, useState } from "react";
import {
  Sidebar,
  Menu,
  MenuItem,
  SubMenu,
  useProSidebar,
} from "react-pro-sidebar";
import { Switch, Divider } from "antd";
// Importar ícones do Iconify para agricultura
import { Icon } from "@iconify/react";
import {
  Dashboard,
  People,
  BarChart,
  AccountBalance,
  ExitToApp,
  Settings,
  LightMode,
  DarkMode,
  LocalFlorist,
  WaterDrop,
  MoneyOff,
  WarningAmber as WarningAmberIcon,
  Apple,
  Nature,
  Store,
  Business,
  Spa,
  Assignment,
} from "@mui/icons-material";
import { 
  ShoppingCartOutlined,
  EnvironmentOutlined 
} from "@ant-design/icons";
import {
  LocalAtm as LocalAtmIcon,
  Category as CategoryIcon,
  PostAdd as PostAddIcon,
  Groups as GroupsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Typography, Box, useTheme, Tooltip } from "@mui/material";
import useResponsive from "../hooks/useResponsive";
import "./Sidebar.css";
import logo from "./assets/img/logo.png";
import EcoIcon from "./Icons/EcoIcon";

/**
 * SidebarMenu
 *
 * Modo Expandido:
 *   - Clique no título do pai: abre/fecha sem fechar os demais (vários abertos se desejar).
 *   - Clique num item de outro pai: fecha todos os pais e deixa aberto só o pai clicado.
 *
 * Modo Colapsado:
 *   - Clique no pai: abre o submenu (e se houver sub-submenu, também é possível abrir).
 *   - Clique num item final: fecha tudo para não atrapalhar.
 *
 * Remove transições de submenu p/ minimizar "pulos".
 */
const SidebarMenu = ({ isOpen, mode, toggleTheme, handleSidebarCollapse }) => {
  const { collapseSidebar } = useProSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();

  // ------------------------------------------------------------------
  // (1) Controlar via a lib o (des)colapsar conforme "isOpen" e responsividade
  // ------------------------------------------------------------------
  useEffect(() => {
    // Em mobile, sempre recolher o sidebar
    if (isMobile) {
      collapseSidebar(true);
    } else {
      collapseSidebar(!isOpen);
    }
  }, [isOpen, collapseSidebar, isMobile]);

  // ------------------------------------------------------------------
  // (2) Estados de cada SubMenu (pai) => PEDIDOS, CADASTRO e PRODUCAO
  //     Se true, aquele pai está aberto.
  // ------------------------------------------------------------------
  const [openParents, setOpenParents] = useState({
    PEDIDOS: false,
    CADASTRO: false,
    PRODUCAO: false,
    RELATORIOS: false,
    ARH: false,
  });

  // ------------------------------------------------------------------
  // (4) Itens do menu
  // ------------------------------------------------------------------
  const menuItems = [{ text: "Dashboard", icon: <Icon icon="mdi:monitor-dashboard" style={{ fontSize: '28px' }} />, path: "/" }];

  const pedidosItems = [
    { text: "Dashboard", icon: <Icon icon="mdi:monitor-dashboard" style={{ fontSize: '20px' }} />, path: "/pedidos/dashboard" },
    { text: "Pedidos", icon: <Icon icon="mdi:cart" style={{ fontSize: '20px' }} />, path: "/pedidos" },
  ];

  const cadastroItems = [
    { 
      text: "Clientes", 
      icon: <Icon icon="mdi:account-group" style={{ fontSize: '20px' }} />, 
      path: "/clientes" 
    },
    { 
      text: "Culturas", 
      icon: <Icon icon="mdi:seedling" style={{ fontSize: '20px' }} />, 
      path: "/culturas" 
    },
    { 
      text: "Frutas", 
      icon: <Icon icon="healthicons:fruits" style={{ fontSize: '20px' }} />, 
      path: "/frutas" 
    },
    { 
      text: "Áreas Agrícolas", 
      icon: <Icon icon="mdi:map-marker" style={{ fontSize: '20px' }} />, 
      path: "/areas-agricolas" 
    },
    { 
      text: "Fornecedores", 
      icon: <Icon icon="mdi:truck-delivery" style={{ fontSize: '20px' }} />, 
      path: "/fornecedores" 
    },
    { 
      text: "Turma de Colheita", 
      icon: <Icon icon="game-icons:farmer" style={{ fontSize: '20px' }} />, 
      path: "/turma-colheita" 
    },
  ];
  
  const arhItems = [
    {
      text: "Cargos / Funções",
      icon: <Icon icon="mdi:briefcase-account" style={{ fontSize: '20px' }} />,
      path: "/arh/cargos-funcoes",
    },
    {
      text: "Funcionários",
      icon: <Icon icon="mdi:account-badge" style={{ fontSize: '20px' }} />,
      path: "/arh/funcionarios",
    },
    {
      text: "Folha de Pagamento",
      icon: <Icon icon="mdi:cash-multiple" style={{ fontSize: '20px' }} />,
      path: "/arh/folhas",
    },
  ];

  const relatoriosItems = [
    { 
      text: "Pagamentos", 
      icon: <Icon icon="mdi:bank-transfer" style={{ fontSize: '20px' }} />, 
      path: "/relatorios/pagamentos" 
    },
  ];

  const producaoItems = [
      { 
        text: "Banana", 
        icon: <Icon icon="emojione-monotone:banana" style={{ fontSize: '20px' }} />, 
        path: "/producao/banana" 
      },
  ];

  // ------------------------------------------------------------------
  // (5) Helper para detectar se o path atual começa com algum prefixo
  // ------------------------------------------------------------------
  const isMenuActive = (paths) => {
    if (Array.isArray(paths)) {
      return paths.some((p) => location.pathname.startsWith(p));
    }
    return location.pathname.startsWith(paths);
  };

  // ------------------------------------------------------------------
  // (6) Abertura inicial ao montar, conforme rota
  // ------------------------------------------------------------------
  useEffect(() => {
    // se "/pedidos" => abre PEDIDOS
    if (location.pathname.startsWith("/pedidos")) {
      setOpenParents((prev) => ({ ...prev, PEDIDOS: true }));
    }
    // se "/clientes", "/culturas", "/frutas", "/areas-agricolas", "/fornecedores", "/turma-colheita" => abre CADASTRO
    if (
      ["/clientes", "/culturas", "/frutas", "/areas-agricolas", "/fornecedores", "/turma-colheita"].some((p) =>
        location.pathname.startsWith(p)
      )
    ) {
      setOpenParents((prev) => ({ ...prev, CADASTRO: true }));
    }
    // se "/producao" => abre PRODUCAO
    if (location.pathname.startsWith("/producao")) {
      setOpenParents((prev) => ({ ...prev, PRODUCAO: true }));
    }
    // se "/relatorios" => abre RELATORIOS
    if (location.pathname.startsWith("/relatorios")) {
      setOpenParents((prev) => ({ ...prev, RELATORIOS: true }));
    }
    if (location.pathname.startsWith("/arh")) {
      setOpenParents((prev) => ({ ...prev, ARH: true }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // (7) Clique no título do SubMenu pai => abre/fecha sem fechar os outros
  // ------------------------------------------------------------------
  const handleParentOpenChange = (parentKey, isOpenNow) => {
    setOpenParents((prev) => ({
      ...prev,
      [parentKey]: isOpenNow,
    }));
  };

  // ------------------------------------------------------------------
  // (9) Clique em um item => navega
  //     - Se modo colapsado => fecha tudo
  //     - Se modo expandido => single open => fecha outros pais,
  //       deixa aberto só o pai do item
  //     - Em mobile => sempre fecha tudo após navegar
  // ------------------------------------------------------------------
  const handleMenuItemClick = (path, parentKey, isTarifasItem = false) => {
    navigate(path);

    if (!isOpen || isMobile) {
      // Modo colapsado ou mobile => fecha tudo
      setOpenParents({
        PEDIDOS: false,
        CADASTRO: false,
        PRODUCAO: false,
        RELATORIOS: false,
        ARH: false,
      });
      
      // Em mobile, sempre colapsar o sidebar após selecionar uma opção
      if (isMobile) {
        collapseSidebar(true);
        handleSidebarCollapse(); // Atualizar estado no Layout
      }
    } else {
      // Modo expandido => single open
      // Fecha todos e deixa aberto só "parentKey"
      setOpenParents({
        PEDIDOS: false,
        CADASTRO: false,
        PRODUCAO: false,
        RELATORIOS: false,
        ARH: false,
        [parentKey]: true,
      });
    }
  };

  // ------------------------------------------------------------------
  // (10) Logout
  // ------------------------------------------------------------------
  const handleLogout = () => {
    logout();
    navigate("/login");
    
    // Em mobile, colapsar o sidebar após logout
    if (isMobile) {
      collapseSidebar(true);
      handleSidebarCollapse(); // Atualizar estado no Layout
    }
  };

  // ------------------------------------------------------------------
  // (11) Estilos (remover transições para evitar flickers)
  // ------------------------------------------------------------------
  const sidebarStyles = {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    "& .ps-sidebar-container": {
      backgroundColor: "inherit",
      height: "100dvh",
      maxHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    "& .ps-menuitem-root": {
      marginBottom: "4px",
    },
    "& .ps-submenu-content": {
      backgroundColor: theme.palette.sidebar.submenuBackground,
      transition: "none !important",
    },
  };

  // ------------------------------------------------------------------
  // (12) Render auxiliar
  // ------------------------------------------------------------------
  // Renders um item simples
  const renderMenuItem = (
    item,
    parentKey,
    isTarifasItem = false,
    level = 1
  ) => (
    <MenuItem
      key={item.text}
      icon={item.icon}
      active={location.pathname === item.path}
      onClick={() => handleMenuItemClick(item.path, parentKey, isTarifasItem)}
      level={level}
    >
      {item.text}
    </MenuItem>
  );

  useEffect(() => {
    const adjustSubmenuHeights = () => {
      const openSubmenus = document.querySelectorAll(
        '[data-testid="ps-submenu-content-test-id"].ps-open'
      );
      openSubmenus.forEach((el) => {
        // Obtemos o scrollHeight arredondado para evitar subpixels
        const newHeight = Math.round(el.scrollHeight);
        // Se o estilo inline já estiver definido, convertemos para número
        const currentHeight = parseInt(el.style.height || "0", 10);
        // Se o valor atual for diferente do novo valor, atualizamos
        if (currentHeight !== newHeight) {
          requestAnimationFrame(() => {
            el.style.height = `${newHeight}px`;
          });
        }
      });
    };

    const timeoutId = setTimeout(adjustSubmenuHeights, 1);
    window.addEventListener("resize", adjustSubmenuHeights);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", adjustSubmenuHeights);
    };
  }, [openParents, location.pathname]);

  return (
    <Sidebar
      collapsed={!isOpen}
      width="270px"
      collapsedWidth="70px"
      rootStyles={{
        ...sidebarStyles,
        overflow: "hidden",
      }}
    >
      {/* LOGO / TÍTULO */}
      <Box
        sx={{
          p: isOpen ? 1 : 0.25,
          textAlign: "center",
          mb: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: isOpen ? 0.5 : 0,
            width: "100%",
          }}
        >
          <img
            src={logo}
            alt="AlencarFrutas"
            style={{
              width: isOpen ? "120px" : "50px",
              height: "auto",
              objectFit: "contain",
              maxHeight: isOpen ? "90px" : "40px",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}
          />
        </Box>
        {isOpen && (
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: "1.5rem",
              lineHeight: 1.1,
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            AlencarFrutas
          </Typography>
        )}
      </Box>

      {isOpen && (
        <Divider
          style={{
            margin: "8px 0",
            borderColor: theme.palette.divider,
          }}
        />
      )}

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
          maxHeight: "100%", // Garante que não exceda o container pai
          px: 0.5,
          WebkitOverflowScrolling: "touch", // Scroll suave em iOS
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.divider,
            borderRadius: "3px",
          },
          "& > nav": {
            padding: "8px 0",
          },
        }}
      >
        <Menu
          // closeOnClick => se colapsado ou mobile, ao clicar num ITEM, fecha
          closeOnClick={!isOpen || isMobile}
          menuItemStyles={{
            button: ({ level, active }) => ({
              backgroundColor: active
                ? theme.palette.primary.main
                : "transparent",
              color: active
                ? "#fff"
                : (level > 0 && theme.palette.sidebar?.submenuText)
                  ? theme.palette.sidebar.submenuText
                  : theme.palette.text.primary,
              fontWeight: active ? 700 : 500,
              "&:hover": {
                backgroundColor: active
                  ? theme.palette.primary.dark
                  : "rgba(0, 0, 0, 0.04)",
              },
              borderRadius: "8px",
              margin: level === 0 ? "4px 8px" : "2px 4px",
            }),
            icon: ({ level }) => ({
              color: (level > 0 && theme.palette.sidebar?.submenuIcon)
                ? theme.palette.sidebar.submenuIcon
                : theme.palette.text.secondary,
            }),
            SubMenuExpandIcon: {
              color: theme.palette.text.secondary,
              size: "20px",
            },
          }}
        >
          {/* DASHBOARD */}
          {menuItems.map((item) => renderMenuItem(item, null, false, 0))}

          {/* SUBMENU PEDIDOS */}
          {isOpen ? (
            <SubMenu
              key="PEDIDOS"
              icon={<Icon icon="mdi:cart" style={{ fontSize: '20px' }} />}
              label="Pedidos"
              open={openParents.PEDIDOS}
              onOpenChange={(opened) =>
                handleParentOpenChange("PEDIDOS", opened)
              }
              className={
                isMenuActive(["/pedidos"])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {pedidosItems.map((p) => renderMenuItem(p, "PEDIDOS"))}
            </SubMenu>
          ) : (
            <SubMenu
              key="PEDIDOS"
              icon={
                <Tooltip title="Pedidos" placement="right">
                  <Icon icon="mdi:cart" style={{ fontSize: '20px' }} />
                </Tooltip>
              }
              label=""
              open={openParents.PEDIDOS}
              onOpenChange={(opened) =>
                handleParentOpenChange("PEDIDOS", opened)
              }
              className={
                isMenuActive(["/pedidos"])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {pedidosItems.map((p) => renderMenuItem(p, "PEDIDOS"))}
            </SubMenu>
          )}

          {/* SUBMENU CADASTRO */}
          {isOpen ? (
            <SubMenu
              key="CADASTRO"
              icon={<Assignment />}
              label="Cadastro"
              open={openParents.CADASTRO}
              onOpenChange={(opened) =>
                handleParentOpenChange("CADASTRO", opened)
              }
              className={
                isMenuActive([
                  "/clientes",
                  "/culturas",
                  "/frutas",
                  "/areas-agricolas",
                  "/fornecedores",
                  "/turma-colheita",
                ])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {cadastroItems.map((c) => renderMenuItem(c, "CADASTRO"))}
            </SubMenu>
          ) : (
            <SubMenu
              key="CADASTRO"
              icon={
                <Tooltip title="Cadastro" placement="right">
                  <Assignment />
                </Tooltip>
              }
              label=""
              open={openParents.CADASTRO}
              onOpenChange={(opened) =>
                handleParentOpenChange("CADASTRO", opened)
              }
              className={
                isMenuActive([
                  "/clientes",
                  "/culturas",
                  "/frutas",
                  "/areas-agricolas",
                  "/fornecedores",
                  "/turma-colheita",
                ])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {cadastroItems.map((c) => renderMenuItem(c, "CADASTRO"))}
            </SubMenu>
          )}

          {/* SUBMENU PRODUÇÃO */}
          {isOpen ? (
            <SubMenu
              key="PRODUCAO"
              icon={<Icon icon="fa6-solid:tractor" style={{ fontSize: '20px' }} />}
              label="Produção"
              open={openParents.PRODUCAO}
              onOpenChange={(opened) =>
                handleParentOpenChange("PRODUCAO", opened)
              }
              className={
                isMenuActive(["/producao"])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {producaoItems.map((p) => renderMenuItem(p, "PRODUCAO"))}
            </SubMenu>
          ) : (
            <SubMenu
              key="PRODUCAO"
              icon={
                <Tooltip title="Produção" placement="right">
                  <Icon icon="fa6-solid:tractor" style={{ fontSize: '20px' }} />
                </Tooltip>
              }
              label=""
              open={openParents.PRODUCAO}
              onOpenChange={(opened) =>
                handleParentOpenChange("PRODUCAO", opened)
              }
              className={
                isMenuActive(["/producao"])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {producaoItems.map((p) => renderMenuItem(p, "PRODUCAO"))}
            </SubMenu>
          )}

          {/* SUBMENU ARH */}
          {isOpen ? (
            <SubMenu
              key="ARH"
              icon={<Icon icon="mdi:account-cash" style={{ fontSize: '20px' }} />}
              label="ARH"
              open={openParents.ARH}
              onOpenChange={(opened) =>
                handleParentOpenChange("ARH", opened)
              }
              className={
                isMenuActive([
                  "/arh",
                ])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {arhItems.map((item) => renderMenuItem(item, "ARH"))}
            </SubMenu>
          ) : (
            <SubMenu
              key="ARH"
              icon={
                <Tooltip title="ARH" placement="right">
                  <Icon icon="mdi:account-cash" style={{ fontSize: '20px' }} />
                </Tooltip>
              }
              label=""
              open={openParents.ARH}
              onOpenChange={(opened) =>
                handleParentOpenChange("ARH", opened)
              }
              className={
                isMenuActive([
                  "/arh",
                ])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {arhItems.map((item) => renderMenuItem(item, "ARH"))}
            </SubMenu>
          )}

          {/* SUBMENU RELATÓRIOS */}
          {isOpen ? (
            <SubMenu
              key="RELATORIOS"
              icon={<Icon icon="mdi:chart-box-outline" style={{ fontSize: '20px' }} />}
              label="Relatórios"
              open={openParents.RELATORIOS}
              onOpenChange={(opened) =>
                handleParentOpenChange("RELATORIOS", opened)
              }
              className={
                isMenuActive([
                  "/relatorios",
                ])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {relatoriosItems.map((r) => renderMenuItem(r, "RELATORIOS"))}
            </SubMenu>
          ) : (
            <SubMenu
              key="RELATORIOS"
              icon={
                <Tooltip title="Relatórios" placement="right">
                  <Icon icon="mdi:chart-box-outline" style={{ fontSize: '20px' }} />
                </Tooltip>
              }
              label=""
              open={openParents.RELATORIOS}
              onOpenChange={(opened) =>
                handleParentOpenChange("RELATORIOS", opened)
              }
              className={
                isMenuActive([
                  "/relatorios",
                ])
                  ? "ps-active-parent"
                  : ""
              }
            >
              {relatoriosItems.map((r) => renderMenuItem(r, "RELATORIOS"))}
            </SubMenu>
          )}
        </Menu>
      </Box>

      {/* RODAPÉ */}
      <Box
        sx={{
          padding: "12px 8px",
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: "inherit",
          mt: "auto",
        }}
      >
        <Menu
          closeOnClick={!isOpen || isMobile}
          menuItemStyles={{
            button: {
              color: theme.palette.text.primary,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            },
          }}
          style={{
            padding: 0,
          }}
        >
          {isOpen ? (
            <MenuItem
              icon={<Settings />}
              style={{ padding: "8px" }}
              onClick={() => handleMenuItemClick("/configuracoes", null)}
            >
              Configurações
            </MenuItem>
          ) : (
              <div>
                <MenuItem
                  icon={<Tooltip title="Configurações" placement="right"><Settings /></Tooltip>}
                  style={{ padding: "8px" }}
                  onClick={() => handleMenuItemClick("/configuracoes", null)}
                />
              </div>
            
          )}

          {isOpen ? (
            <MenuItem
              icon={<ExitToApp />}
              style={{ padding: "8px" }}
              onClick={handleLogout}
            >
              Sair
            </MenuItem>
          ) : (
            
              <div>
                <MenuItem
                  icon={<Tooltip title="Sair" placement="right"><ExitToApp /></Tooltip>}
                  style={{ padding: "8px" }}
                  onClick={handleLogout}
                />
              </div>
          )}
        </Menu>

        {isOpen && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "16px",
            }}
          >
            {mode === "light" ? <LightMode /> : <DarkMode />}
            <Switch
              checked={mode === "dark"}
              onChange={toggleTheme}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              style={{ marginLeft: "8px" }}
            />
          </Box>
        )}
      </Box>
    </Sidebar>
  );
};

export default SidebarMenu;
