import { TurmaColheitaService } from './turma-colheita.service';
import { CreateTurmaColheitaDto } from './dto/create-turma-colheita.dto';
import { UpdateTurmaColheitaDto } from './dto/update-turma-colheita.dto';
import { TurmaColheitaResponseDto } from './dto/turma-colheita-response.dto';
import { CreateTurmaColheitaPedidoCustoDto } from './dto/create-colheita-pedido.dto';
import { UpdateTurmaColheitaPedidoCustoDto } from './dto/update-colheita-pedido.dto';
import { TurmaColheitaPedidoCustoResponseDto } from './dto/colheita-pedido-response.dto';
export declare class TurmaColheitaController {
    private readonly turmaColheitaService;
    constructor(turmaColheitaService: TurmaColheitaService);
    create(createTurmaColheitaDto: CreateTurmaColheitaDto): Promise<TurmaColheitaResponseDto>;
    findAll(): Promise<TurmaColheitaResponseDto[]>;
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
    createColheitaPedido(createCustoDto: CreateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto>;
    findAllColheitasPedidos(): Promise<TurmaColheitaPedidoCustoResponseDto[]>;
    findOneColheitaPedido(id: string): Promise<TurmaColheitaPedidoCustoResponseDto>;
    updateColheitaPedido(id: string, updateColheitaPedidoDto: UpdateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto>;
    removeColheitaPedido(id: string): Promise<void>;
    findColheitasByPedido(pedidoId: string): Promise<TurmaColheitaPedidoCustoResponseDto[]>;
    findColheitasByTurma(turmaId: string): Promise<TurmaColheitaPedidoCustoResponseDto[]>;
    findByPedido(pedidoId: string): Promise<TurmaColheitaResponseDto[]>;
    findByFruta(frutaId: string): Promise<TurmaColheitaResponseDto[]>;
    getEstatisticas(id: string): Promise<{
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
    findOne(id: string): Promise<TurmaColheitaResponseDto>;
    update(id: string, updateTurmaColheitaDto: UpdateTurmaColheitaDto): Promise<TurmaColheitaResponseDto>;
    remove(id: string): Promise<void>;
}
