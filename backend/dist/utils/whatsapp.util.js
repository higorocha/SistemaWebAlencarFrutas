"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatarNumeroTelefone = formatarNumeroTelefone;
exports.validarNumeroWhatsApp = validarNumeroWhatsApp;
exports.exibirNumeroFormatado = exibirNumeroFormatado;
function formatarNumeroTelefone(numero) {
    if (!numero)
        return '';
    let numeroLimpo = numero.replace(/\D/g, '');
    if (numeroLimpo.startsWith('55')) {
        numeroLimpo = numeroLimpo.substring(2);
    }
    if (numeroLimpo.length === 10) {
        numeroLimpo = numeroLimpo.substring(0, 2) + '9' + numeroLimpo.substring(2);
    }
    if (numeroLimpo.length !== 11) {
        throw new Error(`Número de telefone inválido: ${numero}. Deve ter 11 dígitos (DDD + 9 dígitos)`);
    }
    return `55${numeroLimpo}`;
}
function validarNumeroWhatsApp(numero) {
    try {
        const numeroFormatado = formatarNumeroTelefone(numero);
        return numeroFormatado.length === 13 && numeroFormatado.startsWith('55');
    }
    catch {
        return false;
    }
}
function exibirNumeroFormatado(numero) {
    try {
        const numeroLimpo = numero.replace(/\D/g, '');
        if (numeroLimpo.length === 13 && numeroLimpo.startsWith('55')) {
            const numeroSem55 = numeroLimpo.substring(2);
            const ddd = numeroSem55.substring(0, 2);
            const primeiraParte = numeroSem55.substring(2, 7);
            const segundaParte = numeroSem55.substring(7);
            return `+55 (${ddd}) ${primeiraParte}-${segundaParte}`;
        }
        return numero;
    }
    catch {
        return numero;
    }
}
//# sourceMappingURL=whatsapp.util.js.map