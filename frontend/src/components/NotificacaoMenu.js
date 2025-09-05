import React, { useState } from "react";
import { Popover, Tooltip } from "antd";
import {
  Badge,
  IconButton,
  Box,
  Typography,
  Divider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNotificacao } from "../contexts/NotificacaoContext";
import NotificacaoDetalheModal from "./NotificacaoDetalheModal";
import { useNavigate } from "react-router-dom";
import moment from "../config/momentConfig";
import { formatarValorMonetario } from "../utils/formatters";

const NotificacaoMenu = () => {
  const {
    notificacoes,
    naoLidas,
    loading,
    marcarComoLida,
    marcarTodasComoLidas,
    descartarNotificacao,
    buscarNotificacoes,
  } = useNotificacao();

  const navigate = useNavigate();
  const theme = useTheme();

  // Estados para controlar o modal
  const [modalAberto, setModalAberto] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState(null);

  // Função para carregar notificações ao clicar no ícone
  const handleIconClick = (e) => {
    e.stopPropagation();
    buscarNotificacoes();
  };

  // Função para lidar com o clique na notificação
  const handleNotificacaoClick = (notificacao) => {
    if (!notificacao || !notificacao.id) return;

    // Marcar como lida
    marcarComoLida(notificacao.id);

    // Selecionar a notificação e abrir o modal
    setNotificacaoSelecionada(notificacao);
    setModalAberto(true);
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalAberto(false);
  };

  // Função para formatar data
  const formatarData = (notificacao) => {
    // Primeiro verificar se deve usar createdAt ou created_at
    const dataString = notificacao?.createdAt || notificacao?.created_at || notificacao?.data_criacao;

    if (!dataString) {
      return "Data não disponível";
    }

    try {
      // Usar moment para formatação
      const data = moment(dataString);

      // Verificar se é válido
      if (!data.isValid()) {
        return "Data não disponível";
      }

      // Formatar no padrão brasileiro
      return data.format("DD/MM/YYYY HH:mm");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data não disponível";
    }
  };

  // Renderização do tipo da notificação com cores específicas
  const renderTipo = (tipo) => {
    if (!tipo) return null;

    return (
      <Box
        sx={{
          backgroundColor: theme.palette.notifications[tipo] || theme.palette.notifications.sistema,
          color: "white",
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "12px",
          fontWeight: "bold",
          display: "inline-block",
          marginRight: "8px",
        }}
      >
        {tipo.toUpperCase()}
      </Box>
    );
  };

  // Garantir que notificacoes seja um array e filtrar corretamente
  const notificacoesSeguras = Array.isArray(notificacoes) ? notificacoes : [];
  const notificacoesAtivas = notificacoesSeguras.filter(
    (n) => n && n.status !== "descartada"
  );

  const content = (
    <Box sx={{ width: 350, maxHeight: 400, overflow: "auto", p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6">Notificações</Typography>
        <Tooltip title="Marcar todas como lidas" placement="left">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              marcarTodasComoLidas();
            }}
          >
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notificacoesAtivas.length > 0 ? (
        notificacoesAtivas.slice(0, 10).map((item) => (
          <Box
            key={item?.id || Math.random()}
            sx={{
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "4px",
              backgroundColor:
                item?.status === "nao_lida" ? theme.palette.background.active : theme.palette.background.paper,
              cursor: "pointer",
              border: `1px solid ${theme.palette.ui.border}`,
              "&:hover": {
                backgroundColor: theme.palette.background.hover,
              },
            }}
            onClick={() => handleNotificacaoClick(item)}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {renderTipo(item?.tipo)}
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: item?.status === "nao_lida" ? "bold" : "normal",
                  }}
                >
                  {item?.titulo || "Sem título"}
                </Typography>
              </Box>
              <Tooltip title="Remover notificação">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item?.id) descartarNotificacao(item.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {item?.conteudo || "Sem conteúdo"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatarData(item)}
            </Typography>
          </Box>
        ))
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 100,
          }}
        >
          <Typography color="textSecondary">
            Nenhuma notificação disponível
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Verificar se naoLidas é um número válido
  const badgeCount =
    typeof naoLidas === "number" && !isNaN(naoLidas) ? naoLidas : 0;

  return (
    <>
      <Popover
        content={content}
        trigger="click"
        placement="bottomRight"
        overlayStyle={{ width: 350 }}
      >
        <IconButton color="inherit" onClick={handleIconClick}>
          <Badge badgeContent={badgeCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Popover>

      {/* Modal de detalhes da notificação */}
      <NotificacaoDetalheModal
        notificacao={notificacaoSelecionada}
        open={modalAberto}
        onClose={fecharModal}
      />
    </>
  );
};

export default NotificacaoMenu;
