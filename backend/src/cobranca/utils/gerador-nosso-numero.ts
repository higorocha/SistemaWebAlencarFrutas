import { PrismaService } from '../../prisma/prisma.service';
import { isProduction } from '../../config/bb-api.config';

/**
 * Gerador de numeroTituloCliente (Nosso Número)
 * 
 * Lógica:
 * - Desenvolvimento: Gerar localmente usando ControleSequencialBoleto
 * - Produção: Omitir (BB gera automaticamente para convênio tipo 3)
 * - Formato: 000{convenio7digitos}{sequencial10digitos}
 */

/**
 * Gera o numeroTituloCliente (Nosso Número) para desenvolvimento
 * Em produção, este campo deve ser omitido (BB gera automaticamente)
 * 
 * @param prisma Instância do PrismaService
 * @param contaCorrenteId ID da conta corrente
 * @param convenio Número do convênio (7 dígitos)
 * @returns numeroTituloCliente formatado ou null se em produção
 */
export async function gerarNumeroTituloCliente(
  prisma: PrismaService,
  contaCorrenteId: number,
  convenio: string
): Promise<string | null> {
  // Em produção, não gerar (BB gera automaticamente para convênio tipo 3)
  if (isProduction()) {
    return null;
  }

  // Validar formato do convênio (7 dígitos)
  const convenioLimpo = convenio.replace(/[^\d]/g, '');
  if (convenioLimpo.length !== 7) {
    throw new Error(`Convênio deve ter 7 dígitos. Recebido: ${convenio}`);
  }

  // Sequencial inicial aleatório para evitar conflitos em homologação
  // Usamos um número aleatório entre 1500000000 e 2000000000
  // Isso reduz drasticamente a chance de conflitos com outros desenvolvedores/testes
  // NOTA: Limite máximo do campo Int (32 bits) é 2.147.483.647
  const MIN_SEQUENCIAL = 1500000000; // 1.5 bilhões
  const MAX_SEQUENCIAL_INICIAL = 2000000000; // 2 bilhões
  const SEQUENCIAL_INICIAL_HOMOLOGACAO = Math.floor(
    Math.random() * (MAX_SEQUENCIAL_INICIAL - MIN_SEQUENCIAL) + MIN_SEQUENCIAL
  );

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
      ultimoSequencial: SEQUENCIAL_INICIAL_HOMOLOGACAO
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
