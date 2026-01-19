/**
 * Validação de dados mínimos do cliente para emissão/registro de boleto no BB.
 *
 * Regra de negócio:
 * - É obrigatório ter CPF ou CNPJ (um ou outro) para emitir boleto.
 * - É obrigatório ter endereço completo (logradouro, bairro, cidade, estado, cep).
 *
 * Retorna uma lista de campos faltando (keys estáveis) para consumo pelo frontend.
 */
export type ClienteBoletoCampoObrigatorio =
  | 'cpfCnpj'
  | 'logradouro'
  | 'bairro'
  | 'cidade'
  | 'estado'
  | 'cep';

export interface ClienteMinimoParaBoleto {
  cpf?: string | null;
  cnpj?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

export function validarClienteParaBoleto(cliente: ClienteMinimoParaBoleto): {
  ok: boolean;
  missingFields: ClienteBoletoCampoObrigatorio[];
} {
  const missingFields: ClienteBoletoCampoObrigatorio[] = [];

  const hasCpf = Boolean(cliente?.cpf && String(cliente.cpf).trim());
  const hasCnpj = Boolean(cliente?.cnpj && String(cliente.cnpj).trim());
  if (!hasCpf && !hasCnpj) {
    missingFields.push('cpfCnpj');
  }

  const requiredTextFields: Array<[ClienteBoletoCampoObrigatorio, unknown]> = [
    ['logradouro', cliente?.logradouro],
    ['bairro', cliente?.bairro],
    ['cidade', cliente?.cidade],
    ['estado', cliente?.estado],
    ['cep', cliente?.cep],
  ];

  for (const [field, value] of requiredTextFields) {
    if (!value || String(value).trim() === '') {
      missingFields.push(field);
    }
  }

  return {
    ok: missingFields.length === 0,
    missingFields,
  };
}

