import { PrismaService } from '../../prisma/prisma.service';
import { isProduction } from '../../config/bb-api.config';

/**
 * Gerador de numeroTituloCliente (Nosso Número)
 * 
 * Lógica:
 * - Convênio Tipo 3 (Banco numera): BB gera automaticamente em produção, só gerar em dev
 * - Convênio Tipo 4 (Cliente numera): SEMPRE gerar e enviar (produção e desenvolvimento)
 * - Formato: 000{convenio7digitos}{sequencial10digitos}
 */

/**
 * Gera o numeroTituloCliente (Nosso Número)
 * 
 * @param prisma Instância do PrismaService
 * @param contaCorrenteId ID da conta corrente
 * @param convenio Número do convênio (7 dígitos)
 * @param tipoConvenio Tipo do convênio: 3 (Banco numera) ou 4 (Cliente numera)
 * @returns numeroTituloCliente formatado ou null se tipo 3 em produção
 */
export async function gerarNumeroTituloCliente(
  prisma: PrismaService,
  contaCorrenteId: number,
  convenio: string,
  tipoConvenio: number = 3
): Promise<string | null> {
  // Convênio Tipo 4: SEMPRE gerar (obrigatório)
  // Convênio Tipo 3: Só gerar em desenvolvimento (BB gera em produção)
  if (tipoConvenio === 3 && isProduction()) {
    return null;
  }

  // Validar formato do convênio (7 dígitos)
  const convenioLimpo = convenio.replace(/[^\d]/g, '');
  if (convenioLimpo.length !== 7) {
    throw new Error(`Convênio deve ter 7 dígitos. Recebido: ${convenio}`);
  }

  // Sequencial inicial
  // Produção: iniciar em 1 (tipo 4)
  // Desenvolvimento/Homologação: comportamento antigo (random) para evitar conflitos
  const SEQUENCIAL_INICIAL = isProduction()
    ? 1
    : Math.floor(Math.random() * (2000000000 - 1500000000) + 1500000000);

  // Buscar ou criar registro de controle sequencial
  const controle = await prisma.controleSequencialBoleto.upsert({
    where: {
      contaCorrenteId_convenio: {
        contaCorrenteId,
        convenio: convenioLimpo
      }
    },
    update: {
      ultimoSequencial: { increment: 1 },
      updatedAt: new Date()
    },
    create: {
      contaCorrenteId,
      convenio: convenioLimpo,
      ultimoSequencial: SEQUENCIAL_INICIAL
    },
    select: {
      ultimoSequencial: true
    }
  });

  const sequencial = controle.ultimoSequencial;

  // Validar limite máximo (10 dígitos = 9999999999)
  const MAX_SEQUENCIAL = 9999999999;
  if (sequencial > MAX_SEQUENCIAL) {
    throw new Error(`Limite de sequencial atingido para o convênio ${convenio}`);
  }

  // Formatar: 000 + convênio (7 dígitos) + sequencial (10 dígitos)
  const sequencialStr = String(sequencial).padStart(10, '0');
  const nossoNumero = `000${convenioLimpo}${sequencialStr}`;

  // Validar que tem exatamente 20 dígitos
  if (nossoNumero.length !== 20) {
    throw new Error(`Nosso número inválido: deve ter 20 dígitos. Gerado: ${nossoNumero} (${nossoNumero.length} dígitos)`);
  }

  return nossoNumero;
}
