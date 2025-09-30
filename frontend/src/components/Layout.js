// src/components/Layout.js

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  CssBaseline,
  IconButton,
  AppBar,
  Toolbar,
  useMediaQuery,
  ThemeProvider,
  Typography,
} from "@mui/material";
import {
  Popover,
  Card,
  Avatar,
  Typography as AntTypography,
  Button,
  Tooltip,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import Sidebar from "./Sidebar";
import { ProSidebarProvider } from "react-pro-sidebar";
import useResponsive from "../hooks/useResponsive";

import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import getTheme from "../theme";
import { useAuth } from "../contexts/AuthContext";
import { NotificacaoProvider } from "../contexts/NotificacaoContext";
import NotificacaoMenu from "./NotificacaoMenu";
import { capitalizeName } from "../utils/formatters";

const drawerWidth = 240;
const collapsedDrawerWidth = 64;
const appBarHeight = 64; // Altura do AppBar

const getInitials = (name) => {
  if (!name) return "";
  const words = name.trim().split(" ");
  return words.length === 1 ? words[0][0] : words[0][0] + words[1][0];
};

const Layout = ({ children }) => {
  const { isMobile, isTablet } = useResponsive();
  const [isOpen, setIsOpen] = useState(!isMobile); // Iniciar fechado em mobile
  const [mode, setMode] = useState("light");
  const { user, logout, getTokenExpiration } = useAuth();

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  // Ajustar estado do sidebar quando o tamanho da tela mudar
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false); // Fechar em mobile
    } else {
      setIsOpen(true); // Abrir em desktop/tablet
    }
  }, [isMobile]);

  const handleLogout = () => {
    logout();
  };

  const popoverContent = (
    <Card 
      bordered={false} 
      styles={{ body: { padding: 0 } }} // Remove padding interno do Card
      style={{ 
        width: 300,
        borderRadius: "6px"
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "flex-start",
        marginBottom: "6px",
        gap: "8px",
        padding: "6px 8px" // Padding bem reduzido
      }}>
        <Avatar
          size={48} // Voltando ao tamanho original
          style={{ 
            backgroundColor: theme.palette.primary.dark,
            flexShrink: 0
          }}
        >
          {getInitials(user?.nome)}
        </Avatar>
        <div style={{ 
          flex: 1,
          minWidth: 0
        }}>
          <AntTypography.Title 
            level={5} 
            style={{ 
              margin: 0, 
              marginBottom: "4px", // Voltando ao original
              wordBreak: "break-word"
            }}
          >
            {user?.nome || "Usuário"}
          </AntTypography.Title>
          <AntTypography.Text 
            type="secondary"
            style={{
              fontSize: "14px", // Aumentando a fonte do email
              wordBreak: "break-all",
              lineHeight: "1.4"
            }}
          >
            {user?.email || "sem email"}
          </AntTypography.Text>
        </div>
      </div>
      <div style={{ 
        marginBottom: "6px",
        padding: "4px 8px" // Padding bem reduzido
      }}>
        <AntTypography.Text strong style={{ fontSize: "13px" }}>
          Último Acesso:
        </AntTypography.Text>
        <br />
        <AntTypography.Text 
          type="secondary"
          style={{ 
            fontSize: "12px", // Voltando ao tamanho original
            lineHeight: "1.4"
          }}
        >
          {user?.ultimoAcesso
            ? new Date(user.ultimoAcesso).toLocaleString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Nunca logado"}
        </AntTypography.Text>
      </div>
      <div style={{ 
        marginBottom: "6px",
        padding: "4px 8px" // Padding bem reduzido
      }}>
        <AntTypography.Text strong style={{ fontSize: "13px" }}>
          Sessão Válida Até:
        </AntTypography.Text>
        <br />
        <AntTypography.Text 
          type="secondary"
          style={{ 
            fontSize: "12px",
            lineHeight: "1.4"
          }}
        >
          {getTokenExpiration()
            ? new Date(getTokenExpiration()).toLocaleString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Indefinido"}
        </AntTypography.Text>
      </div>
      <div style={{ 
        textAlign: "right",
        padding: "6px 8px", // Padding bem reduzido
        borderTop: "1px solid #f0f0f0"
      }}>
        <Button 
          type="primary" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          size="small"
        >
          Logout
        </Button>
      </div>
    </Card>
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const handleDrawerToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSidebarCollapse = () => {
    setIsOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <NotificacaoProvider>
        <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <CssBaseline />

          <AppBar
            position="fixed"
            sx={{
              width: {
                xs: `calc(100% - ${isOpen ? drawerWidth : collapsedDrawerWidth}px)`, // Mobile: sempre deixa espaço para sidebar
                sm: `calc(100% - ${
                  isOpen ? drawerWidth : collapsedDrawerWidth
                }px)`, // Desktop: empurrado pelo sidebar
              },
              ml: {
                xs: isOpen ? `${drawerWidth}px` : `${collapsedDrawerWidth}px`, // Mobile: sempre margem para sidebar
                sm: isOpen ? `${drawerWidth}px` : `${collapsedDrawerWidth}px`, // Desktop: empurrado pelo sidebar
              },
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
          >
            <Toolbar
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0 16px",
              }}
            >
              <Tooltip title="Abrir/Fechar menu lateral" placement="bottom">
                <IconButton
                  color="inherit"
                  aria-label="toggle drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { sm: "none" } }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Abrir/Fechar menu lateral" placement="bottom">
                <IconButton
                  color="inherit"
                  aria-label="toggle drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { xs: "none", sm: "block" } }}
                >
                  {isOpen ? <MenuIcon /> : <MenuIcon />}
                </IconButton>
              </Tooltip>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexGrow: 1,
                }}
              >
                <Typography 
                  variant="h6" 
                  noWrap 
                  component="div"
                  sx={{
                    fontSize: {
                      xs: "1.5rem", // Mobile: fonte um pouco maior
                      sm: "1.5rem", // Desktop: fonte normal
                    }
                  }}
                >
                  {isMobile ? "AlencarFrutas" : "Sistemas de Informações - AlencarFrutas"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Tooltip title="Alternar tema claro/escuro" placement="bottom">
                  <IconButton
                    sx={{ ml: 1 }}
                    onClick={toggleTheme}
                    color="inherit"
                  >
                    {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Notificações do sistema" placement="bottom">
                  <span>
                    <NotificacaoMenu />
                  </span>
                </Tooltip>
                <Tooltip title="Perfil do usuário" placement="bottomLeft">
                  <Popover
                    content={popoverContent}
                    trigger="click"
                    placement="bottomRight"
                  >
                    <IconButton color="inherit">
                      <AccountCircle />
                    </IconButton>
                  </Popover>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>

          <ProSidebarProvider>
            <Sidebar
              isOpen={isOpen}
              handleDrawerToggle={handleDrawerToggle}
              handleSidebarCollapse={handleSidebarCollapse}
              mode={mode}
              toggleTheme={toggleTheme}
            />
          </ProSidebarProvider>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: {
                xs: "100%", // Mobile: largura total (acompanha AppBar)
                sm: "100%", // Desktop: largura total (conteúdo fica colado no sidebar)
              },
              ml: {
                xs: 0, // Mobile: sem margem (acompanha AppBar)
                sm: 0, // Desktop: sem margem (conteúdo fica colado no sidebar)
              },
              height: `calc(100vh - ${appBarHeight}px)`,
              mt: `${appBarHeight}px`,
              overflow: "auto",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
                minHeight: "100%",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  margin: "0 auto",
                }}
              >
                {children}
              </Box>
            </Box>
          </Box>
        </Box>
      </NotificacaoProvider>
    </ThemeProvider>
  );
};

export default Layout;