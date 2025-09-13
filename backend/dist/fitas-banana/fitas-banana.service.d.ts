import { PrismaService } from '../prisma/prisma.service';
import { CreateFitaBananaDto, UpdateFitaBananaDto } from './dto';
export declare class FitasBananaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createFitaBananaDto: CreateFitaBananaDto, usuarioId: number): Promise<{
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
    findOne(id: number): Promise<{
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
    update(id: number, updateFitaBananaDto: UpdateFitaBananaDto, usuarioId: number): Promise<{
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
    remove(id: number): Promise<{
        message: string;
    }>;
    findByUsuario(usuarioId: number): Promise<({
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
    getEstoqueFita(fitaId: number): Promise<{
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
}
