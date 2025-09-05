import { NotificacoesService } from './notificacoes.service';
import { CreateNotificacaoDto, UpdateNotificacaoDto, NotificacaoResponseDto } from './dto';
export declare class NotificacoesController {
    private readonly notificacoesService;
    constructor(notificacoesService: NotificacoesService);
    create(createNotificacaoDto: CreateNotificacaoDto, req: any): Promise<NotificacaoResponseDto>;
    findAll(req: any): Promise<{
        notificacoes: NotificacaoResponseDto[];
        nao_lidas: number;
    }>;
    findOne(id: string, req: any): Promise<NotificacaoResponseDto>;
    update(id: string, updateNotificacaoDto: UpdateNotificacaoDto, req: any): Promise<NotificacaoResponseDto>;
    remove(id: string, req: any): Promise<void>;
    marcarComoLida(id: string, req: any): Promise<NotificacaoResponseDto>;
    marcarTodasComoLidas(req: any): Promise<void>;
    descartarNotificacao(id: string, req: any): Promise<void>;
    criarNotificacaoSistema(body: {
        titulo: string;
        conteudo: string;
        dadosAdicionais?: Record<string, any>;
    }, req: any): Promise<NotificacaoResponseDto>;
    criarNotificacaoPagamento(body: {
        nomeCliente: string;
        valor: number;
        tipo: 'PIX' | 'BOLETO';
    }, req: any): Promise<NotificacaoResponseDto>;
}
