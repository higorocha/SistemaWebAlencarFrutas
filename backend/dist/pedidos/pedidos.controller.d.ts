import { PedidosService } from './pedidos.service';
import { CreatePedidoDto, UpdatePedidoDto, UpdateColheitaDto, UpdatePrecificacaoDto, UpdatePagamentoDto, PedidoResponseDto, UpdatePedidoCompletoDto, CreatePagamentoDto, PagamentoPedidoResponseDto } from './dto';
export declare class PedidosController {
    private readonly pedidosService;
    constructor(pedidosService: PedidosService);
    getDashboardStats(paginaFinalizados?: string, limitFinalizados?: string): Promise<any>;
    buscaInteligente(term: string): Promise<any[]>;
    create(createPedidoDto: CreatePedidoDto): Promise<PedidoResponseDto>;
    createPagamento(createPagamentoDto: CreatePagamentoDto): Promise<PagamentoPedidoResponseDto>;
    findPagamentosByPedido(id: string): Promise<PagamentoPedidoResponseDto[]>;
    updatePagamentoIndividual(id: string, updatePagamentoDto: UpdatePagamentoDto): Promise<PagamentoPedidoResponseDto>;
    removePagamento(id: string): Promise<void>;
    findAll(page?: number, limit?: number, search?: string, searchType?: string, status?: string, clienteId?: number, dataInicio?: string, dataFim?: string): Promise<{
        data: PedidoResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByCliente(clienteId: string): Promise<PedidoResponseDto[]>;
    findOne(id: string): Promise<PedidoResponseDto>;
    update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<PedidoResponseDto>;
    updateColheita(id: string, updateColheitaDto: UpdateColheitaDto, req: any): Promise<PedidoResponseDto>;
    updatePrecificacao(id: string, updatePrecificacaoDto: UpdatePrecificacaoDto): Promise<PedidoResponseDto>;
    updatePagamento(id: string, updatePagamentoDto: UpdatePagamentoDto): Promise<PedidoResponseDto>;
    updateCompleto(id: string, updatePedidoCompletoDto: UpdatePedidoCompletoDto, req: any): Promise<PedidoResponseDto>;
    finalizar(id: string): Promise<PedidoResponseDto>;
    cancelar(id: string): Promise<PedidoResponseDto>;
    remove(id: string): Promise<void>;
}
