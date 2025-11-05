import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificacaoDto, UpdateNotificacaoDto, NotificacaoResponseDto, TipoNotificacao, PrioridadeNotificacao, StatusNotificacao } from './dto';
import { CreateNotificacaoCompletaDto } from './dto/create-notificacao-completa.dto';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ExpoPushService } from './services/expo-push.service';
import { PushTokensService } from '../mobile/services/push-tokens.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class NotificacoesService {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private expoPushService: ExpoPushService,
    private pushTokensService: PushTokensService,
  ) {}

  /**
   * Retorna emoji baseado no tipo de notificação
   */
  private getEmojiPorTipo(tipo?: TipoNotificacao): string {
    const emojis: Partial<Record<TipoNotificacao, string>> = {
      [TipoNotificacao.SISTEMA]: '📋',
      [TipoNotificacao.BOLETO]: '💰',
      [TipoNotificacao.PIX]: '💳',
      [TipoNotificacao.COBRANCA]: '💵',
      [TipoNotificacao.FATURA]: '📄',
      [TipoNotificacao.ALERTA]: '⚠️',
    };
    // Para notificações de pedido (usar SISTEMA mas com emoji de pedido)
    return emojis[tipo || TipoNotificacao.SISTEMA] || '📋';
  }

  /**
   * Retorna emoji para notificações de pedido
   */
  private getEmojiPedido(): string {
    return '🍎';
  }

  async create(createNotificacaoDto: CreateNotificacaoDto, userId?: number): Promise<NotificacaoResponseDto> {
    const data = {
      ...createNotificacaoDto,
      usuarioId: createNotificacaoDto.usuarioId || userId,
      expirarEm: createNotificacaoDto.expirarEm ? new Date(createNotificacaoDto.expirarEm) : null,
    };

    const notificacao = await this.prisma.notificacao.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Emitir evento via Socket.io para notificação em tempo real
    this.emitNovaNotificacao(notificacao);

    // Enviar push notification se houver usuarioId
    // NOTA: Para notificações de pedido, o push é enviado separadamente no método criarNotificacaoPedidoCriado
    // para evitar duplicação e permitir envio em lote para múltiplos usuários
    if (notificacao.usuarioId) {
      const dadosAdicionais = notificacao.dadosAdicionais as any;
      const isPedido = dadosAdicionais?.pedidoId || notificacao.titulo === 'Novo pedido adicionado';
      
      // Não enviar push aqui para notificações de pedido (será enviado em criarNotificacaoPedidoCriado)
      if (!isPedido) {
        const textoToast = dadosAdicionais?.toast?.conteudo || notificacao.conteudo;
        
        console.log(`[Push] Enviando push para usuário ${notificacao.usuarioId} (título: ${notificacao.titulo})`);
        this.enviarPushNotificationParaUsuario(
          notificacao.usuarioId,
          notificacao.titulo,
          textoToast,
          dadosAdicionais,
        ).catch((error) => {
          console.error(`[Push] Erro ao enviar push para usuário ${notificacao.usuarioId}:`, error);
        });
      } else {
        console.log(`[Push] Push de pedido será enviado em lote via criarNotificacaoPedidoCriado`);
      }
    }

    return this.mapToResponseDto(notificacao);
  }

  /**
   * Envia push notification para um usuário específico
   */
  private async enviarPushNotificationParaUsuario(
    userId: number,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      console.log(`[Push] Buscando tokens para usuário ${userId}`);
      const tokens = await this.pushTokensService.getActiveTokensByUserId(userId);

      if (tokens.length === 0) {
        console.log(`[Push] Usuário ${userId} não tem tokens registrados`);
        return; // Usuário não tem tokens registrados
      }

      console.log(`[Push] Usuário ${userId} tem ${tokens.length} token(s) ativo(s)`);

      // Enviar para todos os tokens do usuário
      let successCount = 0;
      let failedCount = 0;
      
      for (const token of tokens) {
        const result = await this.expoPushService.sendPushNotification(token, title, body, data);
        if (result) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`[Push] Resultado para usuário ${userId}: ${successCount} sucesso, ${failedCount} falhas`);
    } catch (error) {
      console.error(`[Push] Erro ao enviar push para usuário ${userId}:`, error);
      // Não propagar erro
    }
  }

  async findAll(userId?: number): Promise<{ notificacoes: NotificacaoResponseDto[]; nao_lidas: number }> {
    const where = {
      AND: [
        {
          OR: [
            { usuarioId: null },
            { usuarioId: userId },
          ],
        },
        {
          OR: [
            { expirarEm: null },
            { expirarEm: { gt: new Date() } },
          ],
        },
        {
          status: {
            not: StatusNotificacao.DESCARTADA,
          },
        },
      ],
    };

    const [notificacoes, naoLidas] = await Promise.all([
      this.prisma.notificacao.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notificacao.count({
        where: {
          ...where,
          status: StatusNotificacao.NAO_LIDA,
        },
      }),
    ]);

    return {
      notificacoes: notificacoes.map(this.mapToResponseDto),
      nao_lidas: naoLidas,
    };
  }

  async findOne(id: number, userId?: number): Promise<NotificacaoResponseDto> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.mapToResponseDto(notificacao);
  }

  async update(id: number, updateNotificacaoDto: UpdateNotificacaoDto, userId?: number): Promise<NotificacaoResponseDto> {
    // Verificar se a notificação existe e pertence ao usuário
    const existingNotificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!existingNotificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    const data = {
      ...updateNotificacaoDto,
      expirarEm: updateNotificacaoDto.expirarEm ? new Date(updateNotificacaoDto.expirarEm) : undefined,
    };

    const notificacao = await this.prisma.notificacao.update({
      where: { id },
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponseDto(notificacao);
  }

  async remove(id: number, userId?: number): Promise<void> {
    // Verificar se a notificação existe e pertence ao usuário
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    await this.prisma.notificacao.delete({
      where: { id },
    });
  }

  async marcarComoLida(id: number, userId?: number): Promise<NotificacaoResponseDto> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    const updatedNotificacao = await this.prisma.notificacao.update({
      where: { id },
      data: { status: StatusNotificacao.LIDA },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Emitir evento via Socket.io
    this.emitNotificacaoLida(id);

    return this.mapToResponseDto(updatedNotificacao);
  }

  async marcarTodasComoLidas(userId?: number): Promise<void> {
    await this.prisma.notificacao.updateMany({
      where: {
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
        status: StatusNotificacao.NAO_LIDA,
      },
      data: { status: StatusNotificacao.LIDA },
    });

    // Emitir evento via Socket.io
    this.emitTodasNotificacoesLidas();
  }

  async descartarNotificacao(id: number, userId?: number): Promise<void> {
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        id,
        OR: [
          { usuarioId: null },
          { usuarioId: userId },
        ],
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    const eraNaoLida = notificacao.status === StatusNotificacao.NAO_LIDA;

    await this.prisma.notificacao.update({
      where: { id },
      data: { status: StatusNotificacao.DESCARTADA },
    });

    // Emitir evento via Socket.io
    this.emitNotificacaoDescartada(id, eraNaoLida);
  }


  /**
   * Cria uma notificação com estrutura completa de exibição
   */
  async criarNotificacaoCompleta(dto: CreateNotificacaoCompletaDto): Promise<NotificacaoResponseDto> {
    const dadosAdicionais = {
      // Informações de exibição
      toast: dto.toast,
      menu: dto.menu,
      modal: dto.modal,
      // Dados adicionais existentes
      ...dto.dadosAdicionais
    };

    return this.create({
      titulo: dto.titulo,
      conteudo: dto.conteudo,
      tipo: dto.tipo,
      prioridade: dto.prioridade,
      dadosAdicionais
    });
  }

  /**
   * Cria notificações para criação de pedido
   * Distribui notificações baseado no nível do usuário e cultura do pedido
   * 
   * Regras:
   * - ADMINISTRADOR, GERENTE_GERAL, ESCRITORIO: Recebem todas as notificações
   * - GERENTE_CULTURA: Recebe apenas se o pedido contém fruta(s) da cultura dele
   * - O criador do pedido NÃO recebe notificação (já sabe que criou)
   * 
   * @param pedidoId ID do pedido criado
   * @param origem Origem da criação: 'web' ou 'mobile'
   * @param usuarioCriadorId ID do usuário que criou o pedido (será excluído das notificações)
   */
  async criarNotificacaoPedidoCriado(
    pedidoId: number,
    origem: 'web' | 'mobile' = 'web',
    usuarioCriadorId?: number
  ): Promise<void> {
    try {
      // 1. Buscar pedido completo com frutas e culturas
      const pedidoCompleto = await this.prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
            },
          },
          frutasPedidos: {
            select: {
              id: true,
              frutaId: true,
              quantidadePrevista: true,
              unidadeMedida1: true,
              unidadeMedida2: true,
              fruta: {
                select: {
                  id: true,
                  nome: true,
                  culturaId: true,
                  cultura: {
                    select: {
                      id: true,
                      descricao: true,
                    },
                  },
                },
              },
            },
          },
          historico: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!pedidoCompleto) {
        console.error(`[Notificações] Pedido ${pedidoId} não encontrado para criar notificações`);
        return;
      }

      // 2. Extrair todas as culturas únicas do pedido (de todas as frutas)
      const culturasDoPedido = new Set<number>(
        pedidoCompleto.frutasPedidos
          .map((fp) => fp.fruta.culturaId)
          .filter((id): id is number => id !== null && id !== undefined)
      );

      // 3. Buscar todos os usuários elegíveis
      const whereConditions: any[] = [
        // Admin, Gerente Geral, Escritório recebem todas
        {
          nivel: {
            in: ['ADMINISTRADOR', 'GERENTE_GERAL', 'ESCRITORIO'],
          },
        },
      ];

      // Gerente Cultura recebe apenas se ALGUMA cultura do pedido for dele
      if (culturasDoPedido.size > 0) {
        whereConditions.push({
          nivel: 'GERENTE_CULTURA',
          culturaId: {
            in: Array.from(culturasDoPedido),
          },
        });
      }

      const usuariosElegiveis = await this.prisma.usuario.findMany({
        where: {
          OR: whereConditions,
        },
        select: {
          id: true,
          nome: true,
          nivel: true,
          culturaId: true,
        },
      });

      // Filtrar o criador do pedido (não deve receber notificação dele mesmo)
      let usuariosParaNotificar = usuarioCriadorId
        ? usuariosElegiveis.filter((usuario) => usuario.id !== usuarioCriadorId)
        : usuariosElegiveis;

      // Deduplicar por ID do usuário (caso algum usuário apareça múltiplas vezes)
      const usuariosUnicos = new Map<number, typeof usuariosParaNotificar[0]>();
      usuariosParaNotificar.forEach((usuario) => {
        if (!usuariosUnicos.has(usuario.id)) {
          usuariosUnicos.set(usuario.id, usuario);
        }
      });
      usuariosParaNotificar = Array.from(usuariosUnicos.values());

      if (usuariosParaNotificar.length === 0) {
        console.log(
          `[Notificações] Nenhum usuário elegível para notificar sobre pedido ${pedidoId}${usuarioCriadorId ? ` (criador ${usuarioCriadorId} excluído)` : ''}`
        );
        return;
      }

      // Log para debug: verificar se havia duplicatas
      if (usuariosElegiveis.length !== usuariosParaNotificar.length + (usuarioCriadorId ? 1 : 0)) {
        console.log(
          `[Notificações] Atenção: ${usuariosElegiveis.length} usuários elegíveis, ${usuariosParaNotificar.length} únicos após deduplicação para pedido ${pedidoId}`
        );
      }

      if (usuarioCriadorId && usuariosElegiveis.length > usuariosParaNotificar.length) {
        console.log(
          `[Notificações] Criador do pedido (usuário ${usuarioCriadorId}) excluído das notificações`
        );
      }

      // 4. Preparar informações da notificação
      const nomeCliente = pedidoCompleto.cliente?.nome || 'Cliente';
      const numeroPedido = pedidoCompleto.numeroPedido;
      const dataPrevistaColheita = pedidoCompleto.dataPrevistaColheita;

      // Função auxiliar para formatar quantidade
      const formatarQuantidade = (quantidade: number, unidade: string): string => {
        // Formatar número com separador de milhar se necessário
        const quantidadeFormatada = quantidade % 1 === 0 
          ? quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
          : quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${quantidadeFormatada} ${unidade}`;
      };

      // Função auxiliar para formatar data
      const formatarData = (data: Date): string => {
        return new Date(data).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      };

      // Gerar conteúdo simplificado para o menu de notificações
      const gerarConteudoMenu = (): string => {
        if (pedidoCompleto.frutasPedidos.length === 0) {
          return `Cliente: ${nomeCliente}`;
        }

        const dataColheita = formatarData(dataPrevistaColheita);
        let conteudo = `Cliente: ${nomeCliente}\n`;

        // Listar todas as frutas
        pedidoCompleto.frutasPedidos.forEach((frutaPedido) => {
          const nomeFruta = frutaPedido.fruta.nome;
          const quantidade = formatarQuantidade(frutaPedido.quantidadePrevista, frutaPedido.unidadeMedida1);
          conteudo += `${nomeFruta} - ${quantidade}\n`;
        });

        conteudo += `\nPrev. Colheita: ${dataColheita}`;
        return conteudo;
      };

      // Gerar conteúdo completo para modal
      const gerarConteudoCompleto = (): string => {
        let conteudo = `Pedido #${numeroPedido}\n\n`;
        conteudo += `Cliente: ${nomeCliente}\n`;
        conteudo += `Data Prevista de Colheita: ${formatarData(dataPrevistaColheita)}\n`;
        conteudo += `Data de Criação: ${formatarData(pedidoCompleto.dataPedido)}\n\n`;

        conteudo += `Frutas do Pedido:\n`;
        conteudo += `${'='.repeat(50)}\n`;

        pedidoCompleto.frutasPedidos.forEach((frutaPedido, index) => {
          const fruta = frutaPedido.fruta;
          conteudo += `\n${index + 1}. ${fruta.nome}\n`;
          
          if (fruta.cultura) {
            conteudo += `   Cultura: ${fruta.cultura.descricao}\n`;
          }
          
          conteudo += `   Quantidade Prevista: ${formatarQuantidade(frutaPedido.quantidadePrevista, frutaPedido.unidadeMedida1)}`;
          
          if (frutaPedido.unidadeMedida2) {
            conteudo += ` | ${formatarQuantidade(frutaPedido.quantidadePrevista, frutaPedido.unidadeMedida2)}`;
          }
          
          conteudo += `\n`;
        });

        if (pedidoCompleto.observacoes) {
          conteudo += `\nObservações:\n`;
          conteudo += `${pedidoCompleto.observacoes}\n`;
        }

        return conteudo;
      };

      // 5. Criar notificação para cada usuário elegível (exceto o criador)
      console.log(
        `[Notificações] Criando notificações para ${usuariosParaNotificar.length} usuário(s) sobre pedido #${numeroPedido}:`,
        usuariosParaNotificar.map((u) => `${u.nome} (ID: ${u.id}, Nível: ${u.nivel})`).join(', ')
      );

      // Preparar dados de todas as frutas para exibição no menu (ícones)
      const frutasComDados = pedidoCompleto.frutasPedidos.map((frutaPedido) => ({
        nome: frutaPedido.fruta.nome,
        quantidade: formatarQuantidade(frutaPedido.quantidadePrevista, frutaPedido.unidadeMedida1),
      }));

      // Buscar usuário criador do pedido UMA VEZ antes do loop
      type UsuarioCriador = { id: number; nome: string; email: string } | null;
      let usuarioCriador: UsuarioCriador = null;

      // Tentar obter do histórico primeiro
      if (pedidoCompleto.historico && pedidoCompleto.historico.length > 0) {
        const historicoCriacao = pedidoCompleto.historico.find(h => h.acao === 'CRIACAO_PEDIDO');
        
        if (historicoCriacao?.usuario) {
          usuarioCriador = {
            id: historicoCriacao.usuario.id,
            nome: historicoCriacao.usuario.nome,
            email: historicoCriacao.usuario.email,
          };
          console.log(`[Notificações] Usuário criador obtido do histórico: ${usuarioCriador.nome}`);
        }
      }

      // Fallback: buscar usuário diretamente se histórico não estiver disponível
      if (!usuarioCriador && usuarioCriadorId) {
        try {
          const usuario = await this.prisma.usuario.findUnique({
            where: { id: usuarioCriadorId },
            select: {
              id: true,
              nome: true,
              email: true,
            },
          });
          
          if (usuario) {
            usuarioCriador = {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
            };
            console.log(`[Notificações] Usuário criador obtido por busca direta: ${usuarioCriador.nome}`);
          } else {
            console.warn(`[Notificações] Usuário criador ${usuarioCriadorId} não encontrado no banco`);
          }
        } catch (error) {
          console.error(`[Notificações] Erro ao buscar usuário criador ${usuarioCriadorId}:`, error);
        }
      }

      if (!usuarioCriador) {
        console.warn(`[Notificações] Não foi possível obter usuário criador para pedido ${pedidoId}`);
      }

      const notificacoes = await Promise.all(
        usuariosParaNotificar.map((usuario) => {
          const conteudoMenu = gerarConteudoMenu();
          const conteudoCompleto = gerarConteudoCompleto();

          const titulo = 'Novo pedido adicionado';

          const dadosAdicionais = {
            // Informações de exibição
            toast: {
              titulo: titulo,
              conteudo: conteudoMenu,
              tipo: 'info' as const,
            },
            menu: {
              titulo: titulo,
              conteudo: conteudoMenu, // Conteúdo simplificado para o menu
            },
            modal: {
              titulo: titulo,
              conteudo: conteudoCompleto,
            },
            // Dados adicionais do pedido para renderização no frontend
            pedidoId: pedidoCompleto.id,
            numeroPedido: numeroPedido,
            culturasIds: Array.from(culturasDoPedido),
            origem: origem,
            // Dados de todas as frutas para exibir ícones no menu
            frutas: frutasComDados,
            cliente: nomeCliente,
            dataPrevistaColheita: formatarData(dataPrevistaColheita),
            // Usuário criador do pedido
            usuarioCriador: usuarioCriador,
          };

          return this.create(
            {
              titulo: titulo,
              conteudo: conteudoMenu, // Usar conteúdo simplificado no campo principal também
              tipo: TipoNotificacao.SISTEMA,
              prioridade: PrioridadeNotificacao.MEDIA,
              usuarioId: usuario.id,
              dadosAdicionais: dadosAdicionais,
              link: `/pedidos/${pedidoCompleto.id}`,
            },
            usuario.id
          ).catch((error) => {
            // Log erro individual sem interromper outras notificações
            console.error(
              `[Notificações] Erro ao criar notificação para usuário ${usuario.id} (${usuario.nome}):`,
              error
            );
            return null;
          });
        })
      );

      // Filtrar notificações nulas (erros)
      const notificacoesCriadas = notificacoes.filter((n): n is NotificacaoResponseDto => n !== null);

      console.log(
        `[Notificações] Criadas ${notificacoesCriadas.length} notificações para pedido #${numeroPedido} (${origem})`
      );

      // 6. Enviar push notifications para usuários com tokens registrados
      // Formatar body seguindo o modelo do teste: cliente na primeira linha, frutas com emojis abaixo
      const getFruitEmoji = (nomeFruta: string): string => {
        const nome = nomeFruta.toLowerCase().trim();
        if (nome.includes('banana') || nome.includes('prata') || nome.includes('nanica')) {
          return '🍌';
        }
        if (nome.includes('coco')) {
          return '🥥';
        }
        if (nome.includes('melancia')) {
          return '🍉';
        }
        if (nome.includes('limão') || nome.includes('lima')) {
          return '🍋';
        }
        if (nome.includes('mamão')) {
          return '🥭';
        }
        if (nome.includes('melão') || nome.includes('melao')) {
          return '🍈';
        }
        return '🍎'; // Emoji padrão
      };

      // Formatar frutas com emojis (seguindo formato do teste)
      const frutasFormatadas = pedidoCompleto.frutasPedidos.map((frutaPedido) => {
        const nomeFruta = frutaPedido.fruta.nome;
        const quantidade = formatarQuantidade(frutaPedido.quantidadePrevista, frutaPedido.unidadeMedida1);
        const emoji = getFruitEmoji(nomeFruta);
        return `${emoji} ${nomeFruta} - ${quantidade}`;
      }).join('\n');

      // Body formatado: Cliente na primeira linha, depois frutas listadas
      const textoPush = pedidoCompleto.frutasPedidos.length > 0
        ? `${nomeCliente}\n${frutasFormatadas}`
        : `${nomeCliente}\nPedido #${numeroPedido}`;
      
      await this.enviarPushNotificationsParaUsuarios(
        usuariosParaNotificar.map((u) => u.id),
        'Novo pedido adicionado',
        textoPush,
        {
          pedidoId: pedidoCompleto.id,
          numeroPedido: numeroPedido,
          tipo: 'novo_pedido',
        }
      );
    } catch (error) {
      // Log erro mas não interromper o fluxo de criação do pedido
      console.error(`[Notificações] Erro ao criar notificações para pedido ${pedidoId}:`, error);
    }
  }

  /**
   * Envia push notifications para múltiplos usuários
   */
  private async enviarPushNotificationsParaUsuarios(
    userIds: number[],
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      if (userIds.length === 0) {
        console.log('[Push] Nenhum usuário para enviar push');
        return;
      }

      console.log(`[Push] Iniciando envio de push para ${userIds.length} usuário(s):`, userIds);

      // Buscar tokens ativos dos usuários
      const tokensMap = await this.pushTokensService.getActiveTokensByUserIds(userIds);

      console.log(`[Push] Tokens encontrados: ${tokensMap.size} usuário(s) com tokens ativos`);

      if (tokensMap.size === 0) {
        console.log('[Push] Nenhum token ativo encontrado para os usuários');
        return;
      }

      // Coletar todos os tokens e logar por usuário
      const allTokens: string[] = [];
      for (const [userId, tokens] of tokensMap.entries()) {
        console.log(`[Push] Usuário ${userId} tem ${tokens.length} token(s) ativo(s)`);
        allTokens.push(...tokens);
      }

      if (allTokens.length === 0) {
        console.log('[Push] Nenhum token válido coletado');
        return;
      }

      console.log(`[Push] Enviando push para ${allTokens.length} token(s) - Título: "${title}", Body: "${body}"`);

      // Enviar push notifications
      const result = await this.expoPushService.sendPushNotifications(allTokens, title, body, data);

      console.log(
        `[Push] Resultado: ${result.success} notificações enviadas com sucesso, ${result.failed} falharam para ${userIds.length} usuário(s)`
      );

      if (result.failed > 0) {
        console.warn(`[Push] Atenção: ${result.failed} push notification(s) falharam`);
      }
    } catch (error) {
      console.error('[Push] Erro ao enviar push notifications:', error);
      // Não propagar erro para não interromper o fluxo principal
    }
  }

  async limparNotificacoesExpiradas(): Promise<void> {
    await this.prisma.notificacao.deleteMany({
      where: {
        expirarEm: {
          not: null,
          lt: new Date(),
        },
      },
    });
  }

  private mapToResponseDto(notificacao: any): NotificacaoResponseDto {
    return {
      id: notificacao.id,
      titulo: notificacao.titulo,
      conteudo: notificacao.conteudo,
      tipo: notificacao.tipo,
      status: notificacao.status,
      prioridade: notificacao.prioridade,
      usuarioId: notificacao.usuarioId,
      dadosAdicionais: notificacao.dadosAdicionais,
      link: notificacao.link,
      expirarEm: notificacao.expirarEm,
      createdAt: notificacao.createdAt,
      updatedAt: notificacao.updatedAt,
    };
  }

  // Métodos para emitir eventos via Socket.io
  private emitNovaNotificacao(notificacao: any): void {
    if (this.server) {
      this.server.emit('nova_notificacao', {
        notificacao: this.mapToResponseDto(notificacao),
      });
    }
  }

  private emitNotificacaoLida(notificacaoId: number): void {
    if (this.server) {
      this.server.emit('notificacao_lida', {
        notificacaoId,
      });
    }
  }

  private emitTodasNotificacoesLidas(): void {
    if (this.server) {
      this.server.emit('todas_notificacoes_lidas', {});
    }
  }

  private emitNotificacaoDescartada(notificacaoId: number, eraNaoLida: boolean): void {
    if (this.server) {
      this.server.emit('notificacao_descartada', {
        notificacaoId,
        eraNaoLida,
      });
    }
  }
} 