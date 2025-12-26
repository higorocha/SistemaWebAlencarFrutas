/* eslint-disable no-console */
import * as fs from 'fs/promises';
import * as path from 'path';
import { PdfService } from '../src/pdf/pdf.service';

type LinhaTabela = {
  pedido: string;
  area: string;
  dataColheita: string;
  quantidade: string;
  unidade: string;
  valorUnitarioCompra: string;
  valorTotalCompra: string;
  statusCompra: string;
  valorVenda: string;
};

function pad(n: number, len = 4) {
  return String(n).padStart(len, '0');
}

function fmtQtd(n: number) {
  // formato pt-BR com milhar (sem depender do frontend)
  return n.toLocaleString('pt-BR');
}

function money(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

async function main() {
  const pdfService = new PdfService();

  const culturas = ['Banana', 'Coco Verde', 'Melancia', 'Manga', 'Abacaxi', 'Goiaba'];
  const frutas = [
    'Banana Prata',
    'Banana Nanica',
    'Coco Verde',
    'Melancia Tipo A',
    'Manga Palmer',
    'Abacaxi Pérola',
    'Goiaba Vermelha',
  ];

  // Cria um "stress" com muitos itens no resumo e muitas linhas nas tabelas
  const resumo = Array.from({ length: 28 }).map((_, i) => {
    const cultura = culturas[i % culturas.length];
    const fruta = frutas[i % frutas.length] + ` (${i + 1})`;
    const totalColheitas = 10 + (i % 6) * 4;
    const colheitasPrecificadas = i % 3 === 0 ? totalColheitas : Math.floor(totalColheitas / 2);
    const colheitasNaoPrecificadas = Math.max(0, totalColheitas - colheitasPrecificadas);

    const unidade = i % 2 === 0 ? 'KG' : 'UND';
    const qtdTotal = 15000 + i * 1234;
    const qtdPrec = Math.floor(qtdTotal * (colheitasPrecificadas / Math.max(1, totalColheitas)));
    const qtdNao = Math.max(0, qtdTotal - qtdPrec);

    return {
      cultura,
      fruta,
      totalColheitas,
      colheitasPrecificadas,
      colheitasNaoPrecificadas,
      // arrays como strings (no template atual)
      quantidadesPorUnidade: [{ unidade, quantidade: fmtQtd(qtdTotal) }],
      quantidadesPorUnidadePrecificada: colheitasPrecificadas > 0 ? [{ unidade, quantidade: fmtQtd(qtdPrec) }] : [],
      quantidadesPorUnidadeNaoPrecificada: colheitasNaoPrecificadas > 0 ? [{ unidade, quantidade: fmtQtd(qtdNao) }] : [],
      valorUnitarioMedioCompra: money(0.85 + (i % 7) * 0.1),
      compraPago: money(1000 + i * 50),
      compraPrecificado: money(2000 + i * 75),
      vendaTotal: '-',
      // força casos "sem venda" quando há compra precificada
      temFaltaVenda: colheitasPrecificadas > 0 && i % 2 === 0,
    };
  });

  const makeGrupo = (cultura: string, fruta: string, basePedido: number, linhasCount: number, precificada: boolean) => {
    const unidade = fruta.includes('Coco') ? 'UND' : 'KG';
    const linhas: LinhaTabela[] = Array.from({ length: linhasCount }).map((__, j) => {
      const qtd = 500 + (j % 12) * 250;
      const vu = 0.85 + (j % 7) * 0.1;
      const totalCompra = qtd * vu;
      return {
        pedido: pad(basePedido + j, 4),
        area: `Área Teste ${((basePedido + j) % 5) + 1}`,
        dataColheita: '26/12/2025',
        quantidade: fmtQtd(qtd),
        unidade,
        valorUnitarioCompra: precificada ? money(vu) : '-',
        valorTotalCompra: precificada ? money(totalCompra) : '-',
        statusCompra: precificada ? (j % 3 === 0 ? 'PENDENTE' : 'PAGO') : '-',
        valorVenda: '-',
      };
    });

    const totalQtd = linhas.reduce((acc, l) => acc + Number(l.quantidade.replace(/\./g, '').replace(',', '.')) || 0, 0);
    return {
      cultura,
      fruta,
      linhas,
      totaisPorUnidade: [{ unidade, quantidade: fmtQtd(totalQtd) }],
    };
  };

  const tabelas = {
    precificadas: Array.from({ length: 10 }).map((_, i) =>
      makeGrupo(
        culturas[i % culturas.length],
        frutas[i % frutas.length] + ` (Prec ${i + 1})`,
        1000 + i * 30,
        26 + (i % 4) * 8,
        true,
      ),
    ),
    naoPrecificadas: Array.from({ length: 12 }).map((_, i) =>
      makeGrupo(
        culturas[i % culturas.length],
        frutas[i % frutas.length] + ` (NP ${i + 1})`,
        2000 + i * 35,
        22 + (i % 5) * 10,
        false,
      ),
    ),
  };

  const data = {
    empresa: {
      nome_fantasia: 'Alencar Frutas',
      razao_social: 'Alencar Frutas LTDA',
      cnpj: '00.000.000/0000-00',
      telefone: '(00) 00000-0000',
      logradouro: 'Rua Teste',
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'CE',
      cep: '60000-000',
    },
    logoPath: null,
    dataGeracaoFormatada: '26/12/2025',
    tituloDocumento: 'Relatório de Colheitas do Fornecedor',
    fornecedor: { id: 1, nome: 'Fornecedor de Teste' },
    aplicarFiltros: false,
    filtros: null,
    periodo: { dataInicio: '01/11/2025', dataFim: '26/12/2025' },
    estatisticasGerais: { totalColheitas: 999, totalCulturas: 6, totalFrutas: 28, totalAreas: 12 },
    areas: Array.from({ length: 12 }).map((_, i) => ({
      nome: `Área Teste ${i + 1}`,
      ha: (2.5 + i * 0.25).toFixed(2),
    })),
    resumo,
    tabelas,
  };

  const buffer = await pdfService.gerarPdf('fornecedor-colheitas', data);

  const outDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'fornecedor-colheitas-stress.pdf');
  await fs.writeFile(outFile, buffer);

  // eslint-disable-next-line no-console
  console.log(`[OK] PDF gerado em: ${outFile}`);
  console.log(`[INFO] Logs NDJSON: ${path.join(outDir, 'pdf-pagination.ndjson')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


