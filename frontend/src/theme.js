// src/theme.js
import { createTheme } from "@mui/material/styles";

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // Paleta para o modo claro
            primary: {
              main: "#059669", // Cor da barra principal (verde)
              light: "#10b981",   // Verde claro (hover/focus)
              dark: "#047857",    // Verde escuro (botões/ações)
            },
            background: {
              default: "#f2f4f8",
              paper: "#ffffff",
              sidebar: "#f8f9fa",
              hover: "#f5f5f5",
              active: "#e3f2fd",
              disabled: "#f5f5f5",
            },
            text: {
              primary: "#333333",
              secondary: "#666666",
              muted: "#888888",
              disabled: "#bfbfbf",
            },
            sidebar: {
              background: "#ffffff",
              text: "#333333",
              activeItem: "#e3f2fd",
              hoverItem: "#f5f5f5",
              submenuBackground: "#ededed", // Nova cor para submenus
              submenuText: "#000000", // PRETO para texto dos submenus
              submenuIcon: "#000000", // PRETO para ícones dos submenus
            },
            status: {
              success: "#10b981", // Verde mais vibrante
              error: "#ff4d4f",
              warning: "#faad14",
              info: "#059669", // Verde para informações
              successDark: "#047857",
              errorDark: "#cf1322",
            },
            notifications: {
              sistema: "#8c8c8c",
              pix: "#10b981", // Verde para PIX
              cobranca: "#059669", // Verde para cobrança
              fatura: "#722ed1",
              boleto: "#fa8c16",
              alerta: "#f5222d",
            },
            data: {
              positive: "#10b981", // Verde positivo
              negative: "#cf1322",
              neutral: "#059669", // Verde neutro
              chart1: "#32BCAD",
              chart2: "#1D4ED8",
              chart3: "#047857",
              chart4: "#9333EA",
              chart5: "#D97706",
              chart6: "#6B7280",
            },
            ui: {
              border: "#e0e0e0",
              borderDark: "#d9d9d9",
              divider: "#f0f0f0",
              shadow: "rgba(0, 0, 0, 0.1)",
              overlay: "rgba(0, 0, 0, 0.2)",
              disabled: "#f5f5f5",
            },
            // NOVA SEÇÃO: Apenas Formulários
            forms: {
              // Cabeçalhos de seções - mesma cor das tabelas
              sectionHeader: "#059669", // Verde principal (igual ao cabeçalho das tabelas)
              sectionSubheader: "#047857", // Verde médio para subcabeçalhos
              sectionText: "#064e3b", // Verde muito escuro para textos de seção
              sectionBorder: "#10b981", // Verde claro para bordas
              sectionBackground: "#f0fdf4", // Verde muito claro para fundos
              
              // Grupos de campos
              fieldGroupHeader: "#059669", // Verde principal para grupos
              fieldGroupBackground: "#f7fafc", // Cinza muito claro para fundos
              fieldGroupBorder: "#d1fae5", // Verde claro para bordas
              
              // Labels e textos
              labelText: "#065f46", // Verde escuro para labels
              helperText: "#059669", // Verde médio para textos de ajuda
              requiredText: "#dc2626", // Vermelho para campos obrigatórios
              
              // Estados dos campos
              fieldFocus: "#10b981", // Verde claro para foco
              fieldError: "#dc2626", // Vermelho para erro
              fieldSuccess: "#059669", // Verde para sucesso
              fieldDisabled: "#9ca3af", // Cinza para desabilitado
              
              // Botões de formulário - CORES DIFERENCIADAS para evitar conflito
              buttonPrimary: "#047857", // Verde escuro para botões principais
              buttonSecondary: "#10b981", // Verde claro para botões secundários
              buttonDanger: "#dc2626", // Vermelho
              buttonText: "#ffffff", // Branco para texto
              
              // NOVO: Botões de cabeçalho de seções - DESTAQUE ESPECIAL
              buttonHeader: "#ffffff", // Fundo branco
              buttonHeaderBorder: "#059669", // Borda verde
              buttonHeaderText: "#059669", // Texto verde
              buttonHeaderHover: "#f0fdf4", // Hover verde muito claro
            },
            // NOVA SEÇÃO: Inputs e Campos de Texto
            inputs: {
              textColor: "#065f46",        // Verde escuro para texto digitado
              placeholderColor: "#059669",  // Verde médio para placeholder
              focusTextColor: "#064e3b",    // Verde muito escuro quando em foco
              disabledTextColor: "#10b981", // Verde claro quando desabilitado
              errorTextColor: "#dc2626",    // Vermelho para erro
              borderColor: "#d1fae5",       // Verde claro para borda
              focusBorderColor: "#059669",   // Verde principal quando em foco
              backgroundColor: "#ffffff",    // Fundo branco
              disabledBackgroundColor: "#f0fdf4", // Verde muito claro quando desabilitado
            },
            table: {
              headerBg: "#059669", // Verde principal
              headerText: "#fff",
              rowEven: "#fafafa",
              rowOdd: "#fff",
              rowHover: "#e6f7ff",
              rowSelected: "#d1fae5", // Verde claro
              border: "#e0e0e0",
              focus: "#10b981", // Verde claro para foco
              focusBg: "#f0f7ff",
              newRowBg: "#f6ffed", // Verde muito claro
              newRowBorder: "#52c41a", // Verde vibrante
              error: "#ff4d4f",
              errorBg: "#fff2f0",
            },
            // NOVA SEÇÃO: Cores de Status de Pedidos (Padronizadas)
            pedidoStatus: {
              // Status iniciais (azul)
              PEDIDO_CRIADO: "#1890ff", // Azul - Pedidos recém-criados
              AGUARDANDO_COLHEITA: "#1890ff", // Azul - Aguardando colheita
              
              // Status de colheita e precificação (roxo)
              COLHEITA_REALIZADA: "#722ed1", // Roxo - Colheita concluída
              AGUARDANDO_PRECIFICACAO: "#722ed1", // Roxo - Aguardando precificação
              PRECIFICACAO_REALIZADA: "#722ed1", // Roxo - Precificação concluída
              
              // Status de pagamento (amarelo)
              AGUARDANDO_PAGAMENTO: "#faad14", // Amarelo - Aguardando pagamento
              PAGAMENTO_PARCIAL: "#faad14", // Amarelo - Pagamento parcial
              
              // Status finais (verde)
              PAGAMENTO_REALIZADO: "#52c41a", // Verde - Pagamento completo
              PEDIDO_FINALIZADO: "#52c41a", // Verde - Processo finalizado
              
              // Status de cancelamento (vermelho)
              CANCELADO: "#ff4d4f", // Vermelho - Pedido cancelado
              
              // Cores de fallback
              DEFAULT: "#d9d9d9", // Cinza para status não reconhecidos
            },
            
            // NOVA SEÇÃO: Paginação padronizada
            pagination: {
              // Layout e espaçamento
              containerBg: "#ffffff", // Fundo branco
              containerBorder: "#f0f0f0", // Borda sutil
              containerPadding: "12px 0", // Padding compacto
              
              // Texto de total
              totalText: "#666666", // Cinza médio
              totalTextSize: "14px",
              totalTextWeight: "500",
              
              // Items de página (números)
              itemBg: "#ffffff", // Fundo branco
              itemBorder: "#d9d9d9", // Borda cinza
              itemText: "#333333", // Texto escuro
              itemHoverBg: "#ffffff", // Fundo branco no hover
              itemHoverBorder: "#059669", // Borda verde no hover
              itemHoverText: "#059669", // Texto verde no hover
              itemActiveBg: "#ffffff", // Fundo branco quando ativo
              itemActiveBorder: "#059669", // Borda verde quando ativo
              itemActiveText: "#059669", // Texto verde quando ativo
              itemDisabledBg: "#f5f5f5", // Fundo cinza quando desabilitado
              itemDisabledText: "#bfbfbf", // Texto cinza quando desabilitado
              
              // Botões de navegação (setas)
              navButtonBg: "#ffffff", // Fundo branco
              navButtonBorder: "#d9d9d9", // Borda cinza
              navButtonText: "#666666", // Texto cinza
              navButtonHoverBg: "#ffffff", // Fundo branco no hover
              navButtonHoverBorder: "#059669", // Borda verde no hover
              navButtonHoverText: "#059669", // Texto verde no hover
              navButtonDisabledBg: "#f5f5f5", // Fundo cinza quando desabilitado
              navButtonDisabledText: "#bfbfbf", // Texto cinza quando desabilitado
              
              // Select de tamanho da página
              selectBg: "#ffffff", // Fundo branco
              selectBorder: "#d9d9d9", // Borda cinza
              selectText: "#333333", // Texto escuro
              selectHoverBorder: "#059669", // Borda verde no hover
              selectFocusBorder: "#059669", // Borda verde no focus
              selectFocusShadow: "rgba(5, 150, 105, 0.1)", // Sombra verde
              selectArrow: "#666666", // Seta cinza
              
              // Input de jump
              jumpInputBg: "#ffffff", // Fundo branco
              jumpInputBorder: "#d9d9d9", // Borda cinza
              jumpInputText: "#333333", // Texto escuro
              jumpInputHoverBorder: "#059669", // Borda verde no hover
              jumpInputFocusBorder: "#059669", // Borda verde no focus
              jumpInputFocusShadow: "rgba(5, 150, 105, 0.1)", // Sombra verde
              jumpLabelText: "#666666", // Texto do label cinza
            },
          }
        : {
            // Paleta para o modo escuro
            primary: {
              main: "#1f2937", // Cinza escuro para header no modo escuro
              light: "#374151", // Cinza médio para hover
              dark: "#111827",  // Cinza muito escuro para ações
            },
            background: {
              default: "#303030",
              paper: "#424242",
              sidebar: "#0A1929",
              hover: "#173A5E",
              active: "#132F4C",
              disabled: "#424242",
            },
            text: {
              primary: "#ffffff",
              secondary: "#b0bec5",
              muted: "#888888",
              disabled: "#bfbfbf",
            },
            sidebar: {
              background: "#0A1929",
              text: "#ffffff",
              activeItem: "#132F4C",
              hoverItem: "#173A5E",
              submenuBackground: "#374151", // Nova cor para submenus no modo escuro
              submenuText: "#000000", // PRETO para texto dos submenus
              submenuIcon: "#000000", // PRETO para ícones dos submenus
            },
            status: {
              success: "#10b981", // Verde para sucessos (mantém destaque)
              error: "#cf1322",
              warning: "#faad14",
              info: "#6b7280", // Cinza para informações no modo escuro
              successDark: "#047857",
              errorDark: "#cf1322",
            },
            notifications: {
              sistema: "#8c8c8c",
              pix: "#10b981", // Verde para PIX (mantém destaque)
              cobranca: "#6b7280", // Cinza para cobrança no modo escuro
              fatura: "#722ed1",
              boleto: "#fa8c16",
              alerta: "#f5222d",
            },
            data: {
              positive: "#10b981", // Verde positivo
              negative: "#cf1322",
              neutral: "#059669", // Verde neutro
              chart1: "#32BCAD",
              chart2: "#1D4ED8",
              chart3: "#047857",
              chart4: "#9333EA",
              chart5: "#D97706",
              chart6: "#6B7280",
            },
            ui: {
              border: "#424242",
              borderDark: "#303030",
              divider: "#303030",
              shadow: "rgba(0, 0, 0, 0.3)",
              overlay: "rgba(0, 0, 0, 0.5)",
              disabled: "#424242",
            },
            // NOVA SEÇÃO: Apenas Formulários (Modo Escuro)
            forms: {
              // Cabeçalhos de seções - mesma cor das tabelas
              sectionHeader: "#059669", // Verde principal (igual ao cabeçalho das tabelas)
              sectionSubheader: "#059669", // Verde médio para subcabeçalhos
              sectionText: "#d1fae5", // Verde muito claro para textos
              sectionBorder: "#047857", // Verde escuro para bordas
              sectionBackground: "#064e3b", // Verde muito escuro para fundos
              
              // Grupos de campos
              fieldGroupHeader: "#10b981", // Verde claro para grupos
              fieldGroupBackground: "#1f2937", // Cinza escuro para fundos
              fieldGroupBorder: "#374151", // Cinza médio para bordas
              
              // Labels e textos
              labelText: "#d1fae5", // Verde claro para labels
              helperText: "#10b981", // Verde claro para textos de ajuda
              requiredText: "#f87171", // Vermelho claro para campos obrigatórios
              
              // Estados dos campos
              fieldFocus: "#10b981", // Verde claro para foco
              fieldError: "#f87171", // Vermelho claro para erro
              fieldSuccess: "#059669", // Verde para sucesso
              fieldDisabled: "#6b7280", // Cinza para desabilitado
              
              // Botões de formulário - CORES DIFERENCIADAS para evitar conflito
              buttonPrimary: "#047857", // Verde escuro para botões principais
              buttonSecondary: "#10b981", // Verde claro para botões secundários
              buttonDanger: "#f87171", // Vermelho claro
              buttonText: "#ffffff", // Branco para texto
              
              // NOVO: Botões de cabeçalho de seções - DESTAQUE ESPECIAL (Modo Escuro)
              buttonHeader: "#1f2937", // Fundo cinza escuro
              buttonHeaderBorder: "#10b981", // Borda verde claro
              buttonHeaderText: "#10b981", // Texto verde claro
              buttonHeaderHover: "#374151", // Hover cinza médio
            },
            table: {
              headerBg: "#059669",
              headerText: "#fff",
              rowEven: "#232a2f",
              rowOdd: "#1a1d1f",
              rowHover: "#173A5E",
              rowSelected: "#14532d",
              border: "#303030",
              focus: "#10b981",
              focusBg: "#173A5E",
              newRowBg: "#1e293b",
              newRowBorder: "#10b981",
              error: "#ff4d4f",
              errorBg: "#2d1a1a",
            },
            // NOVA SEÇÃO: Cores de Status de Pedidos (Modo Escuro)
            pedidoStatus: {
              // Status iniciais (azul)
              PEDIDO_CRIADO: "#1890ff", // Azul - Pedidos recém-criados
              AGUARDANDO_COLHEITA: "#1890ff", // Azul - Aguardando colheita
              
              // Status de colheita e precificação (roxo)
              COLHEITA_REALIZADA: "#722ed1", // Roxo - Colheita concluída
              AGUARDANDO_PRECIFICACAO: "#722ed1", // Roxo - Aguardando precificação
              PRECIFICACAO_REALIZADA: "#722ed1", // Roxo - Precificação concluída
              
              // Status de pagamento (amarelo)
              AGUARDANDO_PAGAMENTO: "#faad14", // Amarelo - Aguardando pagamento
              PAGAMENTO_PARCIAL: "#faad14", // Amarelo - Pagamento parcial
              
              // Status finais (verde)
              PAGAMENTO_REALIZADO: "#52c41a", // Verde - Pagamento completo
              PEDIDO_FINALIZADO: "#52c41a", // Verde - Processo finalizado
              
              // Status de cancelamento (vermelho)
              CANCELADO: "#ff4d4f", // Vermelho - Pedido cancelado
              
              // Cores de fallback
              DEFAULT: "#6b7280", // Cinza para status não reconhecidos (modo escuro)
            },
            
            // NOVA SEÇÃO: Paginação padronizada (Modo Escuro)
            pagination: {
              // Layout e espaçamento
              containerBg: "#424242", // Fundo cinza escuro
              containerBorder: "#303030", // Borda cinza
              containerPadding: "12px 0", // Padding compacto
              
              // Texto de total
              totalText: "#b0bec5", // Cinza claro
              totalTextSize: "14px",
              totalTextWeight: "500",
              
              // Items de página (números)
              itemBg: "#424242", // Fundo cinza escuro
              itemBorder: "#303030", // Borda cinza
              itemText: "#ffffff", // Texto branco
              itemHoverBg: "#424242", // Fundo cinza escuro no hover
              itemHoverBorder: "#10b981", // Borda verde no hover
              itemHoverText: "#10b981", // Texto verde no hover
              itemActiveBg: "#424242", // Fundo cinza escuro quando ativo
              itemActiveBorder: "#10b981", // Borda verde quando ativo
              itemActiveText: "#10b981", // Texto verde quando ativo
              itemDisabledBg: "#303030", // Fundo cinza muito escuro quando desabilitado
              itemDisabledText: "#6b7280", // Texto cinza quando desabilitado
              
              // Botões de navegação (setas)
              navButtonBg: "#424242", // Fundo cinza escuro
              navButtonBorder: "#303030", // Borda cinza
              navButtonText: "#b0bec5", // Texto cinza claro
              navButtonHoverBg: "#424242", // Fundo cinza escuro no hover
              navButtonHoverBorder: "#10b981", // Borda verde no hover
              navButtonHoverText: "#10b981", // Texto verde no hover
              navButtonDisabledBg: "#303030", // Fundo cinza muito escuro quando desabilitado
              navButtonDisabledText: "#6b7280", // Texto cinza quando desabilitado
              
              // Select de tamanho da página
              selectBg: "#424242", // Fundo cinza escuro
              selectBorder: "#303030", // Borda cinza
              selectText: "#ffffff", // Texto branco
              selectHoverBorder: "#10b981", // Borda verde no hover
              selectFocusBorder: "#10b981", // Borda verde no focus
              selectFocusShadow: "rgba(16, 185, 129, 0.1)", // Sombra verde
              selectArrow: "#b0bec5", // Seta cinza claro
              
              // Input de jump
              jumpInputBg: "#424242", // Fundo cinza escuro
              jumpInputBorder: "#303030", // Borda cinza
              jumpInputText: "#ffffff", // Texto branco
              jumpInputHoverBorder: "#10b981", // Borda verde no hover
              jumpInputFocusBorder: "#10b981", // Borda verde no focus
              jumpInputFocusShadow: "rgba(16, 185, 129, 0.1)", // Sombra verde
              jumpLabelText: "#b0bec5", // Texto do label cinza claro
            },
          }),
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.sidebar.background,
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
          }),
        },
      },
    },
    // NOVO: Configuração de CSS Variables para FormGlobal.css
    cssVarPrefix: 'input',
    unstable_cssVarPrefix: 'input',
    // Função para aplicar CSS Variables ao documento
    applyCssVariables: (theme) => {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        
        // Aplicar CSS Variables baseadas no tema
        root.style.setProperty('--input-text-color', theme.palette.inputs?.textColor || '#065f46');
        root.style.setProperty('--input-placeholder-color', theme.palette.inputs?.placeholderColor || '#059669');
        root.style.setProperty('--input-border-color', theme.palette.inputs?.borderColor || '#d1fae5');
        root.style.setProperty('--input-focus-border-color', theme.palette.inputs?.focusBorderColor || '#059669');
        root.style.setProperty('--input-focus-shadow-color', theme.palette.inputs?.focusBorderColor ? `${theme.palette.inputs.focusBorderColor}33` : 'rgba(5, 150, 105, 0.2)');
        root.style.setProperty('--input-background-color', theme.palette.inputs?.backgroundColor || '#ffffff');
        root.style.setProperty('--input-icon-color', theme.palette.inputs?.placeholderColor || '#059669');
        root.style.setProperty('--input-error-color', theme.palette.inputs?.errorTextColor || '#ff4d4f');
        root.style.setProperty('--input-error-hover-color', '#ff7875');
        
        // Aplicar CSS Variables para Sidebar
        root.style.setProperty('--sidebar-submenu-bg', theme.palette.sidebar?.submenuBackground || '#ededed');
      }
    },
  });

export default getTheme;
