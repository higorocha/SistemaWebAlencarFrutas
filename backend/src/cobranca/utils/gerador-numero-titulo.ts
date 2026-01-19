import { PrismaService } from '../../prisma/prisma.service';

/**
 * Gerador de numeroTituloBeneficiario (Seu Número)
 * 
 * Lógica:
 * - Baseado em numeroPedido (formato: PED-{ANO}-{SEQUENCIAL})
 * - Primeiro boleto do pedido: usar numeroPedido diretamente
 * - Boletos subsequentes: {numeroPedido}-{sequencial} (ex: PED-2026-0001-1)
 * - Máximo 15 caracteres (limite do BB)
 */

/**
 * Gera o numeroTituloBeneficiario baseado no pedido
 * @param prisma Instância do PrismaService
 * @param pedidoId ID do pedido
 * @returns numeroTituloBeneficiario formatado
 */
export async function gerarNumeroTituloBeneficiario(
  prisma: PrismaService,
  pedidoId: number
): Promise<string> {
  // Buscar o pedido para obter o numeroPedido
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { numeroPedido: true }
  });

  if (!pedido) {
    throw new Error(`Pedido ${pedidoId} não encontrado`);
  }

  const numeroPedido = pedido.numeroPedido;

  // Padronizar: remover todos os hífens do numeroPedido
  // Formato final: PED20250005 (sem hífens)
  const numeroPedidoFormatado = numeroPedido.replace(/-/g, '');

  // Buscar todos os boletos existentes para este pedido (ordenados por data de criação)
  const boletosExistentes = await prisma.boleto.findMany({
    where: { pedidoId },
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  });

  // Se não existir boleto para o pedido, usar numeroPedido formatado diretamente
  if (boletosExistentes.length === 0) {
    // Validar que não excede 15 caracteres
    if (numeroPedidoFormatado.length > 15) {
      throw new Error(`numeroPedido formatado "${numeroPedidoFormatado}" (original: "${numeroPedido}") excede o limite de 15 caracteres`);
    }
    return numeroPedidoFormatado;
  }

  // Se já existir boleto, usar formato padronizado: {numeroPedido_sem_hifen}-{sequencial}
  // Exemplo: PED20250005-11
  const sequencial = boletosExistentes.length;
  const numeroTitulo = `${numeroPedidoFormatado}-${sequencial}`;

  // Validar que não excede 15 caracteres
  if (numeroTitulo.length > 15) {
    throw new Error(
      `numeroTituloBeneficiario "${numeroTitulo}" excede o limite de 15 caracteres. ` +
      `numeroPedido formatado: ${numeroPedidoFormatado}, sequencial: ${sequencial}`
    );
  }

  return numeroTitulo;
}
