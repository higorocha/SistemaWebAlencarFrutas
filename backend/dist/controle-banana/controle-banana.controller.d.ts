import { ControleBananaService } from './controle-banana.service';
import { CreateControleBananaDto, UpdateControleBananaDto } from './dto';
export declare class ControleBananaController {
    private readonly controleBananaService;
    constructor(controleBananaService: ControleBananaService);
    create(createControleBananaDto: CreateControleBananaDto, req: any): Promise<{
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
    findAll(page?: string, limit?: string): Promise<{
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
    getDetalhesFita(fitaId: string): Promise<{
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
    findByArea(areaId: string): Promise<({
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
    findOne(id: string): Promise<{
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
    update(id: string, updateControleBananaDto: UpdateControleBananaDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
