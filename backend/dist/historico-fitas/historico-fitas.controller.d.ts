import { HistoricoFitasService } from './historico-fitas.service';
export declare class HistoricoFitasController {
    private readonly historicoFitasService;
    constructor(historicoFitasService: HistoricoFitasService);
    findAll(page?: string, limit?: string): Promise<{
        data: ({
            usuario: {
                nome: string;
                id: number;
            };
            controleBanana: {
                areaAgricola: {
                    nome: string;
                    id: number;
                };
                fitaBanana: {
                    nome: string;
                    id: number;
                    corHex: string;
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getEstatisticas(): Promise<{
        totalHistorico: number;
        acoesPorTipo: Record<string, number>;
        ultimasAcoes: ({
            usuario: {
                nome: string;
                id: number;
            };
            controleBanana: {
                areaAgricola: {
                    nome: string;
                    id: number;
                };
                fitaBanana: {
                    nome: string;
                    id: number;
                    corHex: string;
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
    }>;
    findByUsuario(req: any, page?: string, limit?: string): Promise<{
        data: ({
            controleBanana: {
                areaAgricola: {
                    nome: string;
                    id: number;
                };
                fitaBanana: {
                    nome: string;
                    id: number;
                    corHex: string;
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByControle(controleId: string): Promise<({
        usuario: {
            nome: string;
            id: number;
        };
        controleBanana: {
            areaAgricola: {
                nome: string;
                id: number;
            };
            fitaBanana: {
                nome: string;
                id: number;
                corHex: string;
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
        };
    } & {
        id: number;
        createdAt: Date;
        usuarioId: number;
        controleBananaId: number;
        acao: string;
        dadosAnteriores: import("@prisma/client/runtime/library").JsonValue | null;
        dadosNovos: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string): Promise<{
        usuario: {
            nome: string;
            id: number;
        };
        controleBanana: {
            areaAgricola: {
                nome: string;
                id: number;
            };
            fitaBanana: {
                nome: string;
                id: number;
                corHex: string;
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
        };
    } & {
        id: number;
        createdAt: Date;
        usuarioId: number;
        controleBananaId: number;
        acao: string;
        dadosAnteriores: import("@prisma/client/runtime/library").JsonValue | null;
        dadosNovos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
