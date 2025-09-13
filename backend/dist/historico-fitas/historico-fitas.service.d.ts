import { PrismaService } from '../prisma/prisma.service';
export declare class HistoricoFitasService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    registrarAcao(controleBananaId: number, usuarioId: number, acao: string, dadosAnteriores?: any, dadosNovos?: any): Promise<{
        id: number;
        createdAt: Date;
        usuarioId: number;
        controleBananaId: number;
        acao: string;
        dadosAnteriores: import("@prisma/client/runtime/library").JsonValue | null;
        dadosNovos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findByControle(controleBananaId: number): Promise<({
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
    findAll(page?: number, limit?: number): Promise<{
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
    findOne(id: number): Promise<{
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
    findByUsuario(usuarioId: number, page?: number, limit?: number): Promise<{
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
}
