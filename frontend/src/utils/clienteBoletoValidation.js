// src/utils/clienteBoletoValidation.js

/**
 * Campos mínimos do cliente para emissão de boleto.
 * Mantém um "contrato" estável com o backend (missingFields).
 */
export const CLIENTE_BOLETO_FIELD_LABELS = {
  cpfCnpj: "CPF/CNPJ",
  logradouro: "Logradouro",
  bairro: "Bairro",
  cidade: "Cidade",
  estado: "Estado (UF)",
  cep: "CEP",
};

export function getMissingClienteBoletoFields(cliente) {
  const missing = [];

  const hasCpf = Boolean(cliente?.cpf && String(cliente.cpf).trim());
  const hasCnpj = Boolean(cliente?.cnpj && String(cliente.cnpj).trim());
  const hasDocumento = hasCpf || hasCnpj;

  if (!hasDocumento) {
    missing.push("cpfCnpj");
  }

  const required = [
    ["logradouro", cliente?.logradouro],
    ["bairro", cliente?.bairro],
    ["cidade", cliente?.cidade],
    ["estado", cliente?.estado],
    ["cep", cliente?.cep],
  ];

  required.forEach(([field, value]) => {
    if (!value || String(value).trim() === "") {
      missing.push(field);
    }
  });

  return missing;
}

export function formatMissingClienteBoletoFields(missingFields = []) {
  const labels = missingFields
    .map((f) => CLIENTE_BOLETO_FIELD_LABELS[f] || f)
    .filter(Boolean);

  // Remover duplicados preservando ordem
  return [...new Set(labels)];
}

