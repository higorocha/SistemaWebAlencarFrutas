#!/usr/bin/env ts-node

/**
 * Script de normalização das frutas de segunda:
 * - consolida vínculos de áreas/fitas nas frutas de primeira
 * - remove vínculos redundantes das frutas de segunda
 *
 * Uso:
 *  Dry-run (padrão):   npx ts-node --project tsconfig.json scripts/normalizar-frutas-segunda.ts
 *  Execução real:      npx ts-node --project tsconfig.json scripts/normalizar-frutas-segunda.ts --execute
 *  Saída JSON:         adicionar --json
 */

import { PrismaClient, Prisma } from "@prisma/client";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

const prisma = new PrismaClient();

type AreaInfo = {
  id: number;
  areaPropriaId: number | null;
  areaFornecedorId: number | null;
  quantidadeColhidaUnidade1: number | null;
  quantidadeColhidaUnidade2: number | null;
};

type FitaInfo = {
  id: number;
  controleBananaId: number;
  quantidadeFita: number | null;
};

type FrutaPedidoDados = {
  id: number;
  frutaId: number;
  frutaNome: string;
  dePrimeira: boolean;
  culturaId: number;
  culturaDescricao: string;
  areas: AreaInfo[];
  fitas: FitaInfo[];
};

type GrupoCultura = {
  pedido: {
    id: number;
    numeroPedido: string;
  };
  cultura: {
    id: number;
    descricao: string;
  };
  primeira: FrutaPedidoDados;
  segundas: FrutaPedidoDados[];
};

function formatarNumero(valor: number | null | undefined): string {
  const numero = valor ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numero);
}

function chaveArea(area: AreaInfo) {
  if (area.areaPropriaId) {
    return `propria:${area.areaPropriaId}`;
  }
  if (area.areaFornecedorId) {
    return `fornecedor:${area.areaFornecedorId}`;
  }
  return `livre:${area.id}`;
}

async function carregarGruposElegiveis(): Promise<GrupoCultura[]> {
  const pedidos = await prisma.pedido.findMany({
    where: {
      frutasPedidos: {
        some: {
          fruta: { dePrimeira: true },
        },
      },
    },
    select: {
      id: true,
      numeroPedido: true,
      frutasPedidos: {
        select: {
          id: true,
          frutaId: true,
          fruta: {
            select: {
              id: true,
              nome: true,
              dePrimeira: true,
              culturaId: true,
              cultura: { select: { id: true, descricao: true } },
            },
          },
          areas: {
            select: {
              id: true,
              areaPropriaId: true,
              areaFornecedorId: true,
              quantidadeColhidaUnidade1: true,
              quantidadeColhidaUnidade2: true,
            },
          },
          fitas: {
            select: {
              id: true,
              controleBananaId: true,
              quantidadeFita: true,
            },
          },
        },
      },
    },
  });

  const grupos: GrupoCultura[] = [];

  for (const pedido of pedidos) {
    const culturas = new Map<
      number,
      {
        primeira?: FrutaPedidoDados;
        segundas: FrutaPedidoDados[];
        culturaDescricao: string;
      }
    >();

    for (const frutaPedido of pedido.frutasPedidos) {
      const culturaId = frutaPedido.fruta.culturaId;
      if (!culturas.has(culturaId)) {
        culturas.set(culturaId, {
          culturaDescricao: frutaPedido.fruta.cultura.descricao,
          primeira: undefined,
          segundas: [],
        });
      }
      const bucket = culturas.get(culturaId)!;

      const dados: FrutaPedidoDados = {
        id: frutaPedido.id,
        frutaId: frutaPedido.frutaId,
        frutaNome: frutaPedido.fruta.nome,
        dePrimeira: frutaPedido.fruta.dePrimeira,
        culturaId,
        culturaDescricao: bucket.culturaDescricao,
        areas: frutaPedido.areas.map((area) => ({
          id: area.id,
          areaPropriaId: area.areaPropriaId,
          areaFornecedorId: area.areaFornecedorId,
          quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1,
          quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2,
        })),
        fitas: frutaPedido.fitas.map((fita) => ({
          id: fita.id,
          controleBananaId: fita.controleBananaId,
          quantidadeFita: fita.quantidadeFita,
        })),
      };

      if (dados.dePrimeira) {
        bucket.primeira = dados;
      } else {
        bucket.segundas.push(dados);
      }
    }

    for (const [, bucket] of culturas.entries()) {
      if (!bucket.primeira) {
        continue;
      }
      const segundasComVinculo = bucket.segundas.filter(
        (seg) => seg.areas.length > 0 || seg.fitas.length > 0,
      );
      if (segundasComVinculo.length === 0) {
        continue;
      }

      grupos.push({
        pedido: { id: pedido.id, numeroPedido: pedido.numeroPedido },
        cultura: {
          id: bucket.primeira.culturaId,
          descricao: bucket.culturaDescricao,
        },
        primeira: bucket.primeira,
        segundas: segundasComVinculo,
      });
    }
  }

  return grupos;
}

type OperacaoArea =
  | {
      tipo: "merge";
      origemId: number;
      destinoId: number;
      novaQuantidade1: number | null;
      novaQuantidade2: number | null;
    }
  | {
      tipo: "mover";
      origemId: number;
      novoFrutaPedidoId: number;
    };

type OperacaoFita =
  | {
      tipo: "merge";
      origemId: number;
      destinoId: number;
      novaQuantidade: number | null;
    }
  | {
      tipo: "mover";
      origemId: number;
      novoFrutaPedidoId: number;
    };

async function consolidarGrupo(
  grupo: GrupoCultura,
  dryRun: boolean,
  tx: Prisma.TransactionClient,
) {
  const primeiraAreas = new Map<string, AreaInfo>();
  for (const area of grupo.primeira.areas) {
    primeiraAreas.set(chaveArea(area), area);
  }

  const primeiraFitas = new Map<number, FitaInfo>();
  for (const fita of grupo.primeira.fitas) {
    primeiraFitas.set(fita.controleBananaId, fita);
  }

  const operacoesAreas: OperacaoArea[] = [];
  const operacoesFitas: OperacaoFita[] = [];

  const totaisAreas = { quantidade1: 0, quantidade2: 0, registros: 0 };
  const totaisFitas = { quantidade: 0, registros: 0 };

  for (const segunda of grupo.segundas) {
    for (const area of segunda.areas) {
      const chave = chaveArea(area);
      const destino = primeiraAreas.get(chave);

      const qtd1 = area.quantidadeColhidaUnidade1 ?? 0;
      const qtd2 = area.quantidadeColhidaUnidade2 ?? 0;

      totaisAreas.quantidade1 += qtd1;
      totaisAreas.quantidade2 += qtd2;
      totaisAreas.registros += 1;

      if (destino) {
        const novaQuantidade1 = (destino.quantidadeColhidaUnidade1 ?? 0) + qtd1;
        const novaQuantidade2 = (destino.quantidadeColhidaUnidade2 ?? 0) + qtd2;
        operacoesAreas.push({
          tipo: "merge",
          origemId: area.id,
          destinoId: destino.id,
          novaQuantidade1,
          novaQuantidade2,
        });

        destino.quantidadeColhidaUnidade1 = novaQuantidade1;
        destino.quantidadeColhidaUnidade2 = novaQuantidade2;
      } else {
        operacoesAreas.push({
          tipo: "mover",
          origemId: area.id,
          novoFrutaPedidoId: grupo.primeira.id,
        });
      }
    }

    for (const fita of segunda.fitas) {
      const destino = primeiraFitas.get(fita.controleBananaId);
      const quantidade = fita.quantidadeFita ?? 0;

      totaisFitas.quantidade += quantidade;
      totaisFitas.registros += 1;

      if (destino) {
        const novaQuantidade = (destino.quantidadeFita ?? 0) + quantidade;
        operacoesFitas.push({
          tipo: "merge",
          origemId: fita.id,
          destinoId: destino.id,
          novaQuantidade,
        });

        destino.quantidadeFita = novaQuantidade;
      } else {
        operacoesFitas.push({
          tipo: "mover",
          origemId: fita.id,
          novoFrutaPedidoId: grupo.primeira.id,
        });
      }
    }
  }

  if (dryRun) {
    return {
      totaisAreas,
      totaisFitas,
      operacoesAreas,
      operacoesFitas,
    };
  }

  // Executar operações de áreas
  for (const op of operacoesAreas) {
    if (op.tipo === "merge") {
      await tx.frutasPedidosAreas.update({
        where: { id: op.destinoId },
        data: {
          quantidadeColhidaUnidade1: op.novaQuantidade1,
          quantidadeColhidaUnidade2: op.novaQuantidade2,
        },
      });
      await tx.frutasPedidosAreas.delete({
        where: { id: op.origemId },
      });
    } else {
      await tx.frutasPedidosAreas.update({
        where: { id: op.origemId },
        data: { frutaPedidoId: op.novoFrutaPedidoId },
      });
    }
  }

  // Executar operações de fitas
  for (const op of operacoesFitas) {
    if (op.tipo === "merge") {
      await tx.frutasPedidosFitas.update({
        where: { id: op.destinoId },
        data: {
          quantidadeFita: op.novaQuantidade,
        },
      });
      await tx.frutasPedidosFitas.delete({
        where: { id: op.origemId },
      });
    } else {
      await tx.frutasPedidosFitas.update({
        where: { id: op.origemId },
        data: { frutaPedidoId: op.novoFrutaPedidoId },
      });
    }
  }

  return {
    totaisAreas,
    totaisFitas,
    operacoesAreas,
    operacoesFitas,
  };
}

async function main() {
  const dryRun = !process.argv.includes("--execute");
  const outputJson = process.argv.includes("--json");

  const grupos = await carregarGruposElegiveis();

  if (grupos.length === 0) {
    console.log("✅ Nenhum vínculo para normalizar.");
    await prisma.$disconnect();
    return;
  }

  const resultados: Array<{
    grupo: GrupoCultura;
    totaisAreas: { quantidade1: number; quantidade2: number; registros: number };
    totaisFitas: { quantidade: number; registros: number };
    operacoesAreas: OperacaoArea[];
    operacoesFitas: OperacaoFita[];
  }> = [];

  for (const grupo of grupos) {
    const resultado = await prisma.$transaction(async (tx) => {
      const dados = await consolidarGrupo(grupo, dryRun, tx);
      return dados;
    });

    resultados.push({
      grupo,
      ...resultado,
    });
  }

  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          dryRun,
          totalGrupos: grupos.length,
          grupos: resultados.map((res) => ({
            pedido: {
              id: res.grupo.pedido.id,
              numeroPedido: res.grupo.pedido.numeroPedido,
            },
            cultura: res.grupo.cultura,
            totaisAreas: res.totaisAreas,
            totaisFitas: res.totaisFitas,
            operacoesAreas: res.operacoesAreas,
            operacoesFitas: res.operacoesFitas,
          })),
        },
        null,
        2,
      ),
    );
    await prisma.$disconnect();
    return;
  }

  console.log(dryRun ? "🧪 DRY-RUN (nenhuma alteração aplicada)" : "✅ EXECUÇÃO REALIZADA");
  console.log(`Total de culturas normalizadas: ${grupos.length}`);
  console.log(
    "------------------------------------------------------------------",
  );

  resultados.forEach((res) => {
    console.log(
      `Pedido ${res.grupo.pedido.numeroPedido} (ID ${res.grupo.pedido.id}) – Cultura ${res.grupo.cultura.descricao} [${res.grupo.cultura.id}]`,
    );
    console.log(
      `  Áreas consolidadas: ${res.totaisAreas.registros} registros | ΔU1=${formatarNumero(res.totaisAreas.quantidade1)} | ΔU2=${formatarNumero(res.totaisAreas.quantidade2)}`,
    );
    console.log(
      `  Fitas consolidadas: ${res.totaisFitas.registros} registros | ΔQtd=${formatarNumero(res.totaisFitas.quantidade)}`,
    );

    if (res.operacoesAreas.length > 0) {
      console.log("  Operações de áreas:");
      res.operacoesAreas.forEach((op) => {
        if (op.tipo === "merge") {
          console.log(
            `    - Merge área ${op.origemId} -> ${op.destinoId} (U1=${formatarNumero(op.novaQuantidade1)} | U2=${formatarNumero(op.novaQuantidade2)})`,
          );
        } else {
          console.log(
            `    - Transferir área ${op.origemId} para fruta_pedido ${op.novoFrutaPedidoId}`,
          );
        }
      });
    }

    if (res.operacoesFitas.length > 0) {
      console.log("  Operações de fitas:");
      res.operacoesFitas.forEach((op) => {
        if (op.tipo === "merge") {
          console.log(
            `    - Merge fita ${op.origemId} -> ${op.destinoId} (Qtd=${formatarNumero(op.novaQuantidade)})`,
          );
        } else {
          console.log(
            `    - Transferir fita ${op.origemId} para fruta_pedido ${op.novoFrutaPedidoId}`,
          );
        }
      });
    }
    console.log(
      "------------------------------------------------------------------",
    );
  });

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("❌ Erro ao normalizar registros:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


