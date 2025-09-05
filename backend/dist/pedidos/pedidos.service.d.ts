import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto, UpdatePedidoDto, UpdateColheitaDto, UpdatePrecificacaoDto, UpdatePagamentoDto, PedidoResponseDto, UpdatePedidoCompletoDto, CreatePagamentoDto } from './dto';
export declare class PedidosService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(paginaFinalizados?: number, limitFinalizados?: number): Promise<any>;
    private convertNullToUndefined;
    private gerarNumeroPedido;
    private calcularValoresConsolidados;
    private calcularValoresFruta;
    private calcularValorRecebidoConsolidado;
    private atualizarStatusPagamento;
    create(createPedidoDto: CreatePedidoDto): Promise<PedidoResponseDto>;
    findAll(page?: number, limit?: number, search?: string, status?: string, clienteId?: number, dataInicio?: Date, dataFim?: Date): Promise<{
        data: PedidoResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<PedidoResponseDto>;
    update(id: number, updatePedidoDto: UpdatePedidoDto): Promise<PedidoResponseDto>;
    updateColheita(id: number, updateColheitaDto: UpdateColheitaDto): Promise<PedidoResponseDto>;
    updatePrecificacao(id: number, updatePrecificacaoDto: UpdatePrecificacaoDto): Promise<PedidoResponseDto>;
    findPagamentosByPedido(pedidoId: number): Promise<any[]>;
    createPagamento(createPagamentoDto: CreatePagamentoDto): Promise<any>;
    updatePagamentoIndividual(id: number, updatePagamentoDto: UpdatePagamentoDto): Promise<any>;
    removePagamento(id: number): Promise<void>;
    updatePagamento(id: number, updatePagamentoDto: UpdatePagamentoDto): Promise<PedidoResponseDto>;
    updateCompleto(id: number, updatePedidoCompletoDto: UpdatePedidoCompletoDto): Promise<PedidoResponseDto>;
    finalizar(id: number): Promise<PedidoResponseDto>;
    cancelar(id: number): Promise<PedidoResponseDto>;
    remove(id: number): Promise<void>;
}
