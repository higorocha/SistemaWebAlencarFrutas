import { PrismaService } from '../prisma/prisma.service';
import { CreateControleBananaDto, UpdateControleBananaDto } from './dto';
import { HistoricoFitasService } from '../historico-fitas/historico-fitas.service';
export declare class ControleBananaService {
    private readonly prisma;
    private readonly historicoFitasService;
    constructor(prisma: PrismaService, historicoFitasService: HistoricoFitasService);
    private calcularTempoDesdeData;
    create(createControleBananaDto: CreateControleBananaDto, usuarioId: number): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
        areaAgricola: {
            nome: string;
            id: number;
        };
        fitaBanana: {
            nome: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            usuarioId: number;
            corHex: string;
            dataCriacao: Date;
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
    }>;
    findAll(page?: number, limit?: number): Promise<{
        data: ({
            usuario: {
                nome: string;
                id: number;
            };
            areaAgricola: {
                nome: string;
                id: number;
            };
            fitaBanana: {
                nome: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                usuarioId: number;
                corHex: string;
                dataCriacao: Date;
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
        areaAgricola: {
            nome: string;
            id: number;
            coordenadas: import("@prisma/client/runtime/library").JsonValue;
        };
        fitaBanana: {
            nome: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            usuarioId: number;
            corHex: string;
            dataCriacao: Date;
        };
        historicos: ({
            usuario: {
                nome: string;
                id: number;
            };
        } & {
            id: number;
            createdAt: Date;
            usuarioId: number;
            controleBananaId: number;
            acao: string;
            dadosAnteriores: import("@prisma/client/runtime/library").JsonValue | null;
            dadosNovos: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
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
    }>;
    update(id: number, updateControleBananaDto: UpdateControleBananaDto, usuarioId: number): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
        areaAgricola: {
            nome: string;
            id: number;
        };
        fitaBanana: {
            nome: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            usuarioId: number;
            corHex: string;
            dataCriacao: Date;
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
    }>;
    remove(id: number, usuarioId: number): Promise<{
        message: string;
    }>;
    findByArea(areaId: number): Promise<({
        usuario: {
            nome: string;
            id: number;
        };
        fitaBanana: {
            nome: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            usuarioId: number;
            corHex: string;
            dataCriacao: Date;
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
    })[]>;
    getDashboardData(): Promise<{
        estatisticas: {
            totalControles: number;
            totalFitas: number;
            totalAreas: number;
            mediaFitasPorArea: number;
        };
        areasComFitas: {
            totalFitas: number;
            totalRegistros: number;
            fitas: {
                id: number;
                nome: string;
                corHex: string;
                quantidadeFitas: number;
                dataMaisAntiga: Date;
                tempoDesdeData: {
                    dias: number;
                    semanas: number;
                };
            }[];
            controlesBanana: ({
                areaAgricola: {
                    nome: string;
                    id: number;
                    categoria: import(".prisma/client").$Enums.CategoriaArea;
                    areaTotal: number;
                };
                fitaBanana: {
                    nome: string;
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    usuarioId: number;
                    corHex: string;
                    dataCriacao: Date;
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
            nome: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            categoria: import(".prisma/client").$Enums.CategoriaArea;
            areaTotal: number;
            coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    }>;
    getDetalhesArea(areaId: number): Promise<{
        id: number;
        nome: string;
        categoria: import(".prisma/client").$Enums.CategoriaArea;
        areaTotal: number;
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        controles: {
            id: number;
            fita: {
                nome: string;
                id: number;
                corHex: string;
            };
            quantidadeFitas: number;
            dataRegistro: Date;
            usuario: {
                nome: string;
                id: number;
            };
            observacoes: string | null;
            tempoDesdeData: {
                dias: number;
                semanas: number;
            };
        }[];
        totalControles: number;
        totalFitas: number;
    }>;
    getDetalhesFita(fitaId: number): Promise<{
        id: number;
        nome: string;
        corHex: string;
        controles: {
            id: number;
            area: {
                nome: string;
                id: number;
                categoria: import(".prisma/client").$Enums.CategoriaArea;
                areaTotal: number;
                coordenadas: import("@prisma/client/runtime/library").JsonValue;
            };
            quantidadeFitas: number;
            dataRegistro: Date;
            usuario: {
                nome: string;
                id: number;
            };
            observacoes: string | null;
            tempoDesdeData: {
                dias: number;
                semanas: number;
            };
        }[];
        totalControles: number;
        totalFitas: number;
        totalAreas: number;
    }>;
    getAreasComFitas(): Promise<{
        id: number;
        nome: string;
        categoria: import(".prisma/client").$Enums.CategoriaArea;
        areaTotal: number;
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        fitas: {
            id: number;
            nome: string;
            corHex: string;
            quantidadeFitas: number;
            dataMaisAntiga: Date;
            tempoDesdeData: {
                dias: number;
                semanas: number;
            };
        }[];
        totalFitas: number;
        totalRegistros: number;
    }[]>;
    getFitasComAreas(): Promise<any[]>;
    subtrairEstoquePorControle(controleBananaId: number, quantidade: number, usuarioId: number): Promise<void>;
    adicionarEstoquePorControle(controleBananaId: number, quantidade: number, usuarioId: number): Promise<void>;
    processarSubtracaoFitas(detalhesAreas: Array<{
        fitaBananaId: number;
        areaId: number;
        quantidade: number;
        controleBananaId: number;
    }>, usuarioId: number): Promise<void>;
    processarAjusteEstoqueParaEdicao(fitasAntigas: Array<{
        fitaBananaId: number;
        areaId: number;
        quantidade: number;
        controleBananaId: number;
    }>, fitasNovas: Array<{
        fitaBananaId: number;
        areaId: number;
        quantidade: number;
        controleBananaId: number;
    }>, usuarioId: number): Promise<void>;
}
