#!/usr/bin/env ts-node

import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

const prisma = new PrismaClient();

type AreaTotals = {
  quantidadeUnidade1: number;
  quantidadeUnidade2: number;
};

type FrutaResumo = {
  frutaPedidoId: number;
  frutaId: number;
  frutaNome: string;
  dePrimeira: boolean;
  areas: {
    registros: number;
    ids: number[];
    totais: AreaTotals;
  };
  fitas: {
    registros: number;
    ids: number[];
    quantidadeTotal: number;
  };
};

type Inconsistencia = {
  pedido: {
    id: number;
    numeroPedido: string;
  };
  cultura: {
    id: number;
    descricao: string;
  };
  frutaDePrimeira?: FrutaResumo;
  frutasDeSegundaComVinculo: FrutaResumo[];
};

function somarAreas(
  areas: {
    quantidadeColhidaUnidade1: number | null;
    quantidadeColhidaUnidade2: number | null;
  }[],
): AreaTotals {
  return areas.reduce<AreaTotals>(
    (acc, area) => ({
      quantidadeUnidade1:
        acc.quantidadeUnidade1 + (area.quantidadeColhidaUnidade1 ?? 0),
      quantidadeUnidade2:
        acc.quantidadeUnidade2 + (area.quantidadeColhidaUnidade2 ?? 0),
    }),
    { quantidadeUnidade1: 0, quantidadeUnidade2: 0 },
  );
}

function somarFitas(
  fitas: {
    quantidadeFita: number | null;
  }[],
): number {
  return fitas.reduce(
    (acc, fita) => acc + (fita.quantidadeFita ?? 0),
    0,
  );
}

function formatarNumero(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

async function main() {
  const outputJson = process.argv.includes("--json");

  const pedidos = await prisma.pedido.findMany({
    where: {
      frutasPedidos: {
        some: {
          fruta: { dePrimeira: false },
          OR: [{ areas: { some: {} } }, { fitas: { some: {} } }],
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
          quantidadeReal: true,
          quantidadeReal2: true,
          fruta: {
            select: {
              id: true,
              nome: true,
              dePrimeira: true,
              culturaId: true,
              cultura: {
                select: {
                  id: true,
                  descricao: true,
                },
              },
            },
          },
          areas: {
            select: {
              id: true,
              quantidadeColhidaUnidade1: true,
              quantidadeColhidaUnidade2: true,
            },
          },
          fitas: {
            select: {
              id: true,
              quantidadeFita: true,
            },
          },
        },
      },
    },
    orderBy: {
      numeroPedido: "asc",
    },
  });

  const inconsistencias: Inconsistencia[] = [];

  for (const pedido of pedidos) {
    const gruposPorCultura = new Map<
      number,
      {
        culturaDescricao: string;
        primeira?: typeof pedido.frutasPedidos[number];
        segundas: typeof pedido.frutasPedidos[number][];
      }
    >();

    for (const frutaPedido of pedido.frutasPedidos) {
      const culturaId = frutaPedido.fruta.culturaId;
      const grupo =
        gruposPorCultura.get(culturaId) ??
        gruposPorCultura
          .set(culturaId, {
            culturaDescricao: frutaPedido.fruta.cultura.descricao,
            primeira: undefined,
            segundas: [],
          })
          .get(culturaId)!;

      if (frutaPedido.fruta.dePrimeira) {
        grupo.primeira = frutaPedido;
      } else {
        grupo.segundas.push(frutaPedido);
      }
    }

    for (const [culturaId, grupo] of gruposPorCultura.entries()) {
      const segundasComVinculos = grupo.segundas.filter(
        (seg) => seg.areas.length > 0 || seg.fitas.length > 0,
      );

      if (segundasComVinculos.length === 0) {
        continue;
      }

      const registro: Inconsistencia = {
        pedido: {
          id: pedido.id,
          numeroPedido: pedido.numeroPedido,
        },
        cultura: {
          id: culturaId,
          descricao: grupo.culturaDescricao,
        },
        frutaDePrimeira: grupo.primeira
          ? {
              frutaPedidoId: grupo.primeira.id,
              frutaId: grupo.primeira.frutaId,
              frutaNome: grupo.primeira.fruta.nome,
              dePrimeira: true,
              areas: {
                registros: grupo.primeira.areas.length,
                ids: grupo.primeira.areas.map((area) => area.id),
                totais: somarAreas(grupo.primeira.areas),
              },
              fitas: {
                registros: grupo.primeira.fitas.length,
                ids: grupo.primeira.fitas.map((fita) => fita.id),
                quantidadeTotal: somarFitas(grupo.primeira.fitas),
              },
            }
          : undefined,
        frutasDeSegundaComVinculo: segundasComVinculos.map((seg) => ({
          frutaPedidoId: seg.id,
          frutaId: seg.frutaId,
          frutaNome: seg.fruta.nome,
          dePrimeira: false,
          areas: {
            registros: seg.areas.length,
            ids: seg.areas.map((area) => area.id),
            totais: somarAreas(seg.areas),
          },
          fitas: {
            registros: seg.fitas.length,
            ids: seg.fitas.map((fita) => fita.id),
            quantidadeTotal: somarFitas(seg.fitas),
          },
        })),
      };

      inconsistencias.push(registro);
    }
  }

  const inconsistenciasComPrimeira = inconsistencias.filter(
    (item) => item.frutaDePrimeira,
  );
  const inconsistenciasSemPrimeira = inconsistencias.filter(
    (item) => !item.frutaDePrimeira,
  );

  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          totais: {
            totalCulturas: inconsistencias.length,
            comPrimeira: inconsistenciasComPrimeira.length,
            semPrimeira: inconsistenciasSemPrimeira.length,
          },
          comPrimeira: inconsistenciasComPrimeira,
          semPrimeira: inconsistenciasSemPrimeira,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (inconsistencias.length === 0) {
    console.log("✅ Nenhuma fruta de segunda com vínculos indevidos encontrada.");
    return;
  }

  const arredondar = (valor: number) =>
    Math.round((valor + Number.EPSILON) * 100) / 100;

  const totalCulturas = inconsistencias.length;
  const totalComPrimeira = inconsistenciasComPrimeira.length;
  const totalSemPrimeira = inconsistenciasSemPrimeira.length;

  console.log("📊 Resumo geral");
  console.log(
    `  • Culturas com fruta de segunda vinculada: ${totalCulturas}`,
  );
  console.log(
    `  • Com fruta de primeira cadastrada: ${totalComPrimeira}`,
  );
  console.log(
    `  • Sem fruta de primeira (culturas em que não se aplica): ${totalSemPrimeira}`,
  );
  console.log("------------------------------------------------------------------");

  if (totalComPrimeira > 0) {
    console.log("🔁 Casos elegíveis à consolidação automática");
    inconsistenciasComPrimeira.forEach((registro) => {
      const primeira = registro.frutaDePrimeira!;
      const totaisSegundas = registro.frutasDeSegundaComVinculo.reduce(
        (acc, segunda) => ({
          areas: {
            quantidadeUnidade1:
              acc.areas.quantidadeUnidade1 +
              segunda.areas.totais.quantidadeUnidade1,
            quantidadeUnidade2:
              acc.areas.quantidadeUnidade2 +
              segunda.areas.totais.quantidadeUnidade2,
            registros: acc.areas.registros + segunda.areas.registros,
          },
          fitas: {
            quantidade: acc.fitas.quantidade + segunda.fitas.quantidadeTotal,
            registros: acc.fitas.registros + segunda.fitas.registros,
          },
        }),
        {
          areas: {
            quantidadeUnidade1: 0,
            quantidadeUnidade2: 0,
            registros: 0,
          },
          fitas: {
            quantidade: 0,
            registros: 0,
          },
        },
      );

      console.log(
        `Pedido ${registro.pedido.numeroPedido} (ID ${registro.pedido.id}) – Cultura ${registro.cultura.descricao} [${registro.cultura.id}]`,
      );
      console.log(
        `  Fruta de primeira: ${primeira.frutaNome} (frutas_pedidos.id=${primeira.frutaPedidoId})`,
      );
      console.log(
        `    Áreas atuais: ${primeira.areas.registros} registros | U1=${formatarNumero(primeira.areas.totais.quantidadeUnidade1)} | U2=${formatarNumero(primeira.areas.totais.quantidadeUnidade2)}`,
      );
      console.log(
        `    Fitas atuais: ${primeira.fitas.registros} registros | Quantidade=${formatarNumero(primeira.fitas.quantidadeTotal)}`,
      );
      console.log(
        `    ➕ Totais das frutas de segunda para consolidar: ${totaisSegundas.areas.registros} áreas (U1=${formatarNumero(arredondar(totaisSegundas.areas.quantidadeUnidade1))} | U2=${formatarNumero(arredondar(totaisSegundas.areas.quantidadeUnidade2))}) e ${totaisSegundas.fitas.registros} fitas (Quantidade=${formatarNumero(arredondar(totaisSegundas.fitas.quantidade))})`,
      );
      registro.frutasDeSegundaComVinculo.forEach((segunda) => {
        console.log(
          `    ◽ Fruta de segunda: ${segunda.frutaNome} (frutas_pedidos.id=${segunda.frutaPedidoId})`,
        );
        if (segunda.areas.registros > 0) {
          console.log(
            `       - Áreas: ${segunda.areas.registros} registros | ids: ${segunda.areas.ids.join(", ")} | U1=${formatarNumero(segunda.areas.totais.quantidadeUnidade1)} | U2=${formatarNumero(segunda.areas.totais.quantidadeUnidade2)}`,
          );
        }
        if (segunda.fitas.registros > 0) {
          console.log(
            `       - Fitas: ${segunda.fitas.registros} registros | ids: ${segunda.fitas.ids.join(", ")} | Quantidade=${formatarNumero(segunda.fitas.quantidadeTotal)}`,
          );
        }
      });
      console.log(
        "------------------------------------------------------------------",
      );
    });
  } else {
    console.log(
      "🔁 Nenhuma cultura com fruta de primeira encontrada – nada para consolidar automaticamente.",
    );
    console.log(
      "------------------------------------------------------------------",
    );
  }

  if (totalSemPrimeira > 0) {
    console.log(
      "ℹ️ Culturas sem fruta de primeira (deixar como está – classificação não se aplica)",
    );
    inconsistenciasSemPrimeira.forEach((registro) => {
      console.log(
        `Pedido ${registro.pedido.numeroPedido} (ID ${registro.pedido.id}) – Cultura ${registro.cultura.descricao} [${registro.cultura.id}]`,
      );
      registro.frutasDeSegundaComVinculo.forEach((segunda) => {
        console.log(
          `  • ${segunda.frutaNome} (frutas_pedidos.id=${segunda.frutaPedidoId}) – Áreas=${segunda.areas.registros}, Fitas=${segunda.fitas.registros}`,
        );
      });
    });
    console.log(
      "------------------------------------------------------------------",
    );
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("❌ Erro ao identificar inconsistências:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
