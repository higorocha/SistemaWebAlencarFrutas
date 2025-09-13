import { ControleBananaService } from './controle-banana.service';
import { CreateControleBananaDto, UpdateControleBananaDto } from './dto';
export declare class ControleBananaController {
    private readonly controleBananaService;
    constructor(controleBananaService: ControleBananaService);
    create(createControleBananaDto: CreateControleBananaDto, req: any): Promise<{
        fitaBanana: {
            id: number;
            usuarioId: number;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            corHex: string;
            dataCriacao: Date;
        };
        areaAgricola: {
            id: number;
            nome: string;
        };
        usuario: {
            id: number;
            nome: string;
        };
    } & {
        id: number;
        fitaBananaId: number;
        areaAgricolaId: number;
        quantidadeFitas: number;
        quantidadeInicialFitas: number;
        dataRegistro: Date;
        usuarioId: number;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: string, limit?: string): Promise<{
        data: ({
            fitaBanana: {
                id: number;
                usuarioId: number;
                createdAt: Date;
                updatedAt: Date;
                nome: string;
                corHex: string;
                dataCriacao: Date;
            };
            areaAgricola: {
                id: number;
                nome: string;
            };
            usuario: {
                id: number;
                nome: string;
            };
        } & {
            id: number;
            fitaBananaId: number;
            areaAgricolaId: number;
            quantidadeFitas: number;
            quantidadeInicialFitas: number;
            dataRegistro: Date;
            usuarioId: number;
            observacoes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
                fitaBanana: {
                    id: number;
                    usuarioId: number;
                    createdAt: Date;
                    updatedAt: Date;
                    nome: string;
                    corHex: string;
                    dataCriacao: Date;
                };
                areaAgricola: {
                    id: number;
                    nome: string;
                    categoria: import(".prisma/client").$Enums.CategoriaArea;
                    areaTotal: number;
                };
            } & {
                id: number;
                fitaBananaId: number;
                areaAgricolaId: number;
                quantidadeFitas: number;
                quantidadeInicialFitas: number;
                dataRegistro: Date;
                usuarioId: number;
                observacoes: string | null;
                createdAt: Date;
                updatedAt: Date;
            })[];
            id: number;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            categoria: import(".prisma/client").$Enums.CategoriaArea;
            areaTotal: number;
            coordenadas: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
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
    subtrairEstoque(data: {
        detalhesAreas: Array<{
            fitaBananaId: number;
            areaId: number;
            quantidade: number;
            controleBananaId: number;
        }>;
    }, req: any): Promise<void>;
    getDetalhesArea(areaId: string): Promise<{
        id: number;
        nome: string;
        categoria: import(".prisma/client").$Enums.CategoriaArea;
        areaTotal: number;
        coordenadas: import("@prisma/client/runtime/library").JsonValue;
        controles: {
            id: number;
            fita: {
                id: number;
                nome: string;
                corHex: string;
            };
            quantidadeFitas: number;
            dataRegistro: Date;
            usuario: {
                id: number;
                nome: string;
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
    getDetalhesFita(fitaId: string): Promise<{
        id: number;
        nome: string;
        corHex: string;
        controles: {
            id: number;
            area: {
                id: number;
                nome: string;
                categoria: import(".prisma/client").$Enums.CategoriaArea;
                areaTotal: number;
                coordenadas: import("@prisma/client/runtime/library").JsonValue;
            };
            quantidadeFitas: number;
            dataRegistro: Date;
            usuario: {
                id: number;
                nome: string;
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
    findByArea(areaId: string): Promise<({
        fitaBanana: {
            id: number;
            usuarioId: number;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            corHex: string;
            dataCriacao: Date;
        };
        usuario: {
            id: number;
            nome: string;
        };
    } & {
        id: number;
        fitaBananaId: number;
        areaAgricolaId: number;
        quantidadeFitas: number;
        quantidadeInicialFitas: number;
        dataRegistro: Date;
        usuarioId: number;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        fitaBanana: {
            id: number;
            usuarioId: number;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            corHex: string;
            dataCriacao: Date;
        };
        areaAgricola: {
            id: number;
            nome: string;
            coordenadas: import("@prisma/client/runtime/library").JsonValue;
        };
        usuario: {
            id: number;
            nome: string;
        };
        historicos: ({
            usuario: {
                id: number;
                nome: string;
            };
        } & {
            id: number;
            usuarioId: number;
            createdAt: Date;
            controleBananaId: number;
            acao: string;
            dadosAnteriores: import("@prisma/client/runtime/library").JsonValue | null;
            dadosNovos: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: number;
        fitaBananaId: number;
        areaAgricolaId: number;
        quantidadeFitas: number;
        quantidadeInicialFitas: number;
        dataRegistro: Date;
        usuarioId: number;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateControleBananaDto: UpdateControleBananaDto, req: any): Promise<{
        fitaBanana: {
            id: number;
            usuarioId: number;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            corHex: string;
            dataCriacao: Date;
        };
        areaAgricola: {
            id: number;
            nome: string;
        };
        usuario: {
            id: number;
            nome: string;
        };
    } & {
        id: number;
        fitaBananaId: number;
        areaAgricolaId: number;
        quantidadeFitas: number;
        quantidadeInicialFitas: number;
        dataRegistro: Date;
        usuarioId: number;
        observacoes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
