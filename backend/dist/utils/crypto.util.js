"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateSecureKey = generateSecureKey;
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const SECRET_KEY = process.env.CRYPTO_SECRET_KEY;
function validateKey() {
    if (!SECRET_KEY) {
        throw new Error('CRYPTO_SECRET_KEY não definida no .env. ' +
            'Gere uma chave segura com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    try {
        const keyBuffer = Buffer.from(SECRET_KEY, 'hex');
        if (keyBuffer.length !== 32) {
            throw new Error('CRYPTO_SECRET_KEY deve ter exatamente 64 caracteres hex (32 bytes)');
        }
    }
    catch {
        throw new Error('CRYPTO_SECRET_KEY deve estar em formato hexadecimal válido');
    }
}
function encrypt(text) {
    if (!text)
        return '';
    validateKey();
    try {
        const key = CryptoJS.enc.Hex.parse(SECRET_KEY);
        const iv = CryptoJS.lib.WordArray.random(16);
        const encrypted = CryptoJS.AES.encrypt(text, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const combined = iv.concat(encrypted.ciphertext);
        return combined.toString(CryptoJS.enc.Base64);
    }
    catch (error) {
        console.error('Erro ao criptografar:', error);
        throw new Error('Erro na criptografia');
    }
}
function decrypt(encryptedText) {
    if (!encryptedText)
        return '';
    validateKey();
    try {
        const key = CryptoJS.enc.Hex.parse(SECRET_KEY);
        const combined = CryptoJS.enc.Base64.parse(encryptedText);
        const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
        const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) {
            throw new Error('Falha na descriptografia - resultado vazio ou chave incorreta');
        }
        return result;
    }
    catch (error) {
        console.error('Erro ao descriptografar:', error);
        throw new Error('Erro na descriptografia - dados corrompidos ou chave incorreta');
    }
}
function generateSecureKey() {
    return crypto.randomBytes(32).toString('hex');
}
//# sourceMappingURL=crypto.util.js.map