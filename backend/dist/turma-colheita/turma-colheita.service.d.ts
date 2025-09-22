import { CreateTurmaColheitaDto } from './dto/create-turma-colheita.dto';
import { UpdateTurmaColheitaDto } from './dto/update-turma-colheita.dto';
import { CreateTurmaColheitaPedidoCustoDto } from './dto/create-colheita-pedido.dto';
import { UpdateTurmaColheitaPedidoCustoDto } from './dto/update-colheita-pedido.dto';
import { TurmaColheitaResponseDto } from './dto/turma-colheita-response.dto';
import { TurmaColheitaPedidoCustoResponseDto } from './dto/colheita-pedido-response.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class TurmaColheitaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTurmaColheitaDto: CreateTurmaColheitaDto): Promise<TurmaColheitaResponseDto>;
    findAll(): Promise<TurmaColheitaResponseDto[]>;
    findOne(id: number): Promise<TurmaColheitaResponseDto>;
    update(id: number, updateTurmaColheitaDto: UpdateTurmaColheitaDto): Promise<TurmaColheitaResponseDto>;
    remove(id: number): Promise<void>;
    createCustoColheita(createCustoDto: CreateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto>;
    findAllColheitasPedidos(): Promise<TurmaColheitaPedidoCustoResponseDto[]>;
    findOneColheitaPedido(id: number): Promise<TurmaColheitaPedidoCustoResponseDto>;
    updateColheitaPedido(id: number, updateColheitaPedidoDto: UpdateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto>;
    removeColheitaPedido(id: number): Promise<void>;
    findColheitasByPedido(pedidoId: number): Promise<TurmaColheitaPedidoCustoResponseDto[]>;
    findColheitasByTurma(turmaColheitaId: number): Promise<TurmaColheitaPedidoCustoResponseDto[]>;
    findByPedido(pedidoId: number): Promise<TurmaColheitaResponseDto[]>;
    findByFruta(frutaId: number): Promise<TurmaColheitaResponseDto[]>;
    getEstatisticasPorTurma(turmaId: number): Promise<{
        totaisPorUnidade: Record<string, {
            quantidade: number;
            valor: number;
            valorPago: number;
        }>;
        totalGeral: {
            quantidade: number;
            valor: number;
            valorPago: number;
            totalPedidos: number;
            totalFrutas: number;
        };
        detalhes: {
            id: number;
            pedido: string;
            fruta: string;
            quantidade: number;
            unidade: import(".prisma/client").$Enums.UnidadeMedida;
            valor: number | null;
            pagamentoEfetuado: boolean;
            dataColheita: Date | null;
            observacoes: string | null;
        }[];
    }>;
    getRelatorio(): Promise<{
        totalTurmas: number;
        totalColheitas: number;
        colheitasPorTurma: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.TurmaColheitaPedidoCustoGroupByOutputType, "turmaColheitaId"[]> & {
            _count: {
                id: number;
            };
            _sum: {
                quantidadeColhida: number | null;
                valorColheita: number | null;
            };
        })[];
        colheitasPorFruta: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.TurmaColheitaPedidoCustoGroupByOutputType, "frutaId"[]> & {
            _count: {
                id: number;
            };
            _sum: {
                quantidadeColhida: number | null;
                valorColheita: number | null;
            };
        })[];
        pagamentosEfetuados: number;
        pagamentosPendentes: number;
    }>;
    getPagamentosPendentesDetalhado(turmaId: number): Promise<{
        turma: {
            id: number;
            nomeColhedor: string;
            chavePix: string | null;
            dataCadastro: Date;
            observacoes: string | null;
        };
        resumo: {
            totalPendente: number;
            quantidadePedidos: number;
            quantidadeFrutas: number;
            quantidadeColheitas: number;
        };
        colheitas: {
            id: number;
            pedidoId: number;
            pedidoNumero: string;
            cliente: {
                id: number;
                nome: string;
            };
            fruta: {
                id: number;
                nome: string;
            };
            quantidadeColhida: number;
            unidadeMedida: import(".prisma/client").$Enums.UnidadeMedida;
            valorColheita: number;
            dataColheita: Date | null;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    processarPagamentosSeletivos(turmaId: number, dadosPagamento: {
        colheitaIds: number[];
        observacoes?: string;
    }): Promise<{
        sucesso: boolean;
        message: string;
        totalPago: number;
        quantidadePagamentos: number;
        pagamentosProcessados: {
            id: number;
            pedidoNumero: string;
            cliente: string;
            fruta: string;
            valorPago: number;
        }[];
    }>;
    private gerarDataComHorarioFixo;
    getPagamentosEfetuadosAgrupados(): Promise<any[]>;
}
