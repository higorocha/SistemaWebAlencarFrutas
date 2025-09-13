import { FitasBananaService } from './fitas-banana.service';
import { CreateFitaBananaDto, UpdateFitaBananaDto } from './dto';
export declare class FitasBananaController {
    private readonly fitasBananaService;
    constructor(fitasBananaService: FitasBananaService);
    create(createFitaBananaDto: CreateFitaBananaDto, req: any): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
    } & {
        nome: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: number;
        corHex: string;
        dataCriacao: Date;
    }>;
    findAll(): Promise<{
        _count: {
            controles: number;
        };
        _sum: {
            quantidadeFitas: number;
        };
        controles: undefined;
        usuario: {
            nome: string;
            id: number;
        };
        nome: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: number;
        corHex: string;
        dataCriacao: Date;
    }[]>;
    findByUsuario(req: any): Promise<({
        _count: {
            controles: number;
        };
    } & {
        nome: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: number;
        corHex: string;
        dataCriacao: Date;
    })[]>;
    findOne(id: string): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
        controles: ({
            areaAgricola: {
                nome: string;
                id: number;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            usuarioId: number;
            areaAgricolaId: number;
            observacoes: string | null;
            fitaBananaId: number;
            quantidadeFitas: number;
            dataRegistro: Date;
            quantidadeInicialFitas: number;
        })[];
    } & {
        nome: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: number;
        corHex: string;
        dataCriacao: Date;
    }>;
    getEstoqueFita(id: string): Promise<{
        fitaId: number;
        nome: string;
        corHex: string;
        estoqueTotal: number;
        fitasUtilizadas: number;
        estoqueDisponivel: number;
        status: string;
        lotes: {
            id: number;
            quantidade: number;
            dataRegistro: Date;
            diasDesdeCadastro: number;
            area: string;
        }[];
        ultimaAtualizacao: Date;
    }>;
    update(id: string, updateFitaBananaDto: UpdateFitaBananaDto, req: any): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
    } & {
        nome: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: number;
        corHex: string;
        dataCriacao: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
