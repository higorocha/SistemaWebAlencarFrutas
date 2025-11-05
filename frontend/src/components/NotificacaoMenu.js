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
import useResponsive from "../hooks/useResponsive";
import { getFruitIcon } from "../utils/fruitIcons";

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
  const { isMobile } = useResponsive();

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

  // Verificar se é uma notificação de pedido
  const isNotificacaoPedido = (notificacao) => {
    if (!notificacao) return false;
    
    // Verificar se tem pedidoId nos dados adicionais
    const dadosAdicionais = typeof notificacao.dadosAdicionais === 'string'
      ? JSON.parse(notificacao.dadosAdicionais || '{}')
      : notificacao.dadosAdicionais || {};
    
    return !!dadosAdicionais.pedidoId || notificacao.titulo === 'Novo pedido adicionado';
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

  // Renderização específica para notificações de pedido
  const renderNotificacaoPedido = (item) => {
    // Parsear dados adicionais
    const dadosAdicionais = typeof item.dadosAdicionais === 'string'
      ? JSON.parse(item.dadosAdicionais || '{}')
      : item.dadosAdicionais || {};

    // Obter lista de frutas (para mapear ícones)
    const frutas = dadosAdicionais.frutas || [];

    // Usar conteúdo do menu se disponível, senão usar conteúdo padrão
    const conteudoMenu = dadosAdicionais.menu?.conteudo || item.conteudo || '';
    const linhas = conteudoMenu.split('\n');

    // Função auxiliar para encontrar o nome da fruta em uma linha
    const encontrarNomeFruta = (linha) => {
      if (!linha.includes(' - ')) return null;
      
      // Extrair o nome da fruta (parte antes do " - ")
      const partes = linha.split(' - ');
      if (partes.length > 0) {
        const nomeFrutaLinha = partes[0].trim();
        
        // Se não há frutas na lista, retornar o nome da linha mesmo
        if (!frutas || frutas.length === 0) {
          return nomeFrutaLinha;
        }
        
        // Verificar se existe na lista de frutas (comparação case-insensitive e flexível)
        const frutaEncontrada = frutas.find(f => {
          if (!f || !f.nome) return false;
          const nomeFrutaLista = f.nome.toLowerCase().trim();
          const nomeFrutaLinhaLower = nomeFrutaLinha.toLowerCase().trim();
          
          // Comparação exata ou por inclusão
          return nomeFrutaLista === nomeFrutaLinhaLower || 
                 nomeFrutaLinhaLower.includes(nomeFrutaLista) ||
                 nomeFrutaLista.includes(nomeFrutaLinhaLower);
        });
        
        // Retornar o nome original da lista de frutas se encontrado, senão usar o da linha
        return frutaEncontrada ? frutaEncontrada.nome : nomeFrutaLinha;
      }
      return null;
    };

    const isNaoLida = item?.status === "nao_lida" || item?.status === "NAO_LIDA" || (!item?.lida && !item?.status);
    
    return (
      <Box
        sx={{
          position: "relative",
          padding: "12px",
          paddingLeft: isNaoLida ? "16px" : "12px",
          marginBottom: "8px",
          borderRadius: "4px",
          backgroundColor: theme.palette.background.paper,
          cursor: "pointer",
          border: `1px solid ${theme.palette.ui.border}`,
          borderLeft: isNaoLida ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.ui.border}`,
          boxShadow: isNaoLida ? `0 1px 3px rgba(0, 0, 0, 0.08)` : "none",
          "&:hover": {
            backgroundColor: theme.palette.background.hover,
            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.12)`,
          },
        }}
        onClick={() => handleNotificacaoClick(item)}
      >
        {/* Título */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isNaoLida && (
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: isNaoLida ? "700" : "500",
                fontSize: "15px",
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {item?.titulo || "Novo pedido adicionado"}
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

        {/* Conteúdo formatado */}
        <Box>
          {linhas.map((linha, index) => {
            const linhaTrim = linha.trim();
            
            // Linha vazia (espaçamento) - reduzido para 2px
            if (!linhaTrim) {
              return <Box key={index} sx={{ height: "2px" }} />;
            }
            
            // Linha de cliente - COM BOLD
            if (linhaTrim.startsWith('Cliente:')) {
              return (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    mb: 0.25,
                    fontSize: "13px",
                    color: theme.palette.text.primary,
                    fontWeight: "bold",
                  }}
                >
                  {linhaTrim}
                </Typography>
              );
            }
            
            // Linha de fruta e quantidade (contém " - " mas não "Prev.")
            if (linhaTrim.includes(' - ') && !linhaTrim.includes('Prev.')) {
              const nomeFruta = encontrarNomeFruta(linhaTrim);
              
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 0.25,
                    gap: 0.5,
                  }}
                >
                  {/* Ícone pequeno da fruta */}
                  {nomeFruta && (
                    <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      {getFruitIcon(nomeFruta, { width: 16, height: 16 })}
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.primary,
                      fontWeight: "normal", // SEM BOLD
                    }}
                  >
                    {linhaTrim}
                  </Typography>
                </Box>
              );
            }
            
            // Linha de data prevista colheita - mais discreta
            if (linhaTrim.includes('Prev. Colheita:')) {
              return (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    mt: 0.75,
                    mb: 0,
                    fontSize: "11px",
                    color: theme.palette.text.muted || theme.palette.text.secondary,
                    fontStyle: "italic",
                  }}
                >
                  {linhaTrim}
                </Typography>
              );
            }
            
            // Outras linhas
            return (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  mb: 0.25,
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                }}
              >
                {linhaTrim}
              </Typography>
            );
          })}
        </Box>

        {/* Data da notificação */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            pt: 0.75,
            borderTop: `1px solid ${theme.palette.ui.border}`,
            color: theme.palette.text.muted || theme.palette.text.secondary,
            fontSize: "11px",
          }}
        >
          {formatarData(item)}
        </Typography>
      </Box>
    );
  };

  // Garantir que notificacoes seja um array e filtrar corretamente
  const notificacoesSeguras = Array.isArray(notificacoes) ? notificacoes : [];
  const notificacoesAtivas = notificacoesSeguras.filter(
    (n) => n && n.status !== "descartada"
  );

  const content = (
    <Box
      sx={{
        width: isMobile ? 280 : 350,
        maxHeight: isMobile ? 300 : 400,
        overflow: "auto",
        p: isMobile ? 1.5 : 2,
      }}
    >
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
        notificacoesAtivas.slice(0, 10).map((item) => {
          // Renderizar notificação de pedido com layout customizado
          if (isNotificacaoPedido(item)) {
            return (
              <Box key={item?.id || Math.random()}>
                {renderNotificacaoPedido(item)}
              </Box>
            );
          }

          // Renderizar notificação padrão
          const isNaoLidaPadrao = item?.status === "nao_lida" || item?.status === "NAO_LIDA" || (!item?.lida && !item?.status);
          
          return (
            <Box
              key={item?.id || Math.random()}
              sx={{
                position: "relative",
                padding: "10px",
                paddingLeft: isNaoLidaPadrao ? "16px" : "10px",
                marginBottom: "8px",
                borderRadius: "4px",
                backgroundColor: theme.palette.background.paper,
                cursor: "pointer",
                border: `1px solid ${theme.palette.ui.border}`,
                borderLeft: isNaoLidaPadrao ? `3px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.ui.border}`,
                boxShadow: isNaoLidaPadrao ? `0 1px 3px rgba(0, 0, 0, 0.08)` : "none",
                "&:hover": {
                  backgroundColor: theme.palette.background.hover,
                  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.12)`,
                },
              }}
              onClick={() => handleNotificacaoClick(item)}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {isNaoLidaPadrao && (
                    <Box
                      sx={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {renderTipo(item?.tipo)}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: isNaoLidaPadrao ? "600" : "400",
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
          );
        })
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
        overlayStyle={{ width: isMobile ? 280 : 350 }}
      >
        <IconButton
          color="inherit"
          onClick={handleIconClick}
          size={isMobile ? "small" : "medium"}
          sx={{
            padding: { xs: "6px", sm: "8px" },
          }}
        >
          <Badge badgeContent={badgeCount} color="error">
            <NotificationsIcon fontSize={isMobile ? "small" : "medium"} />
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
