import * as CryptoJS from 'crypto-js';
import * as crypto from 'crypto';

/**
 * Chave secreta para criptografia AES-256
 * DEVE ser uma chave de 32 bytes (256 bits) gerada criptograficamente
 * Execute: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
const SECRET_KEY = process.env.CRYPTO_SECRET_KEY;

/**
 * Valida se a chave de criptografia está configurada corretamente
 */
function validateKey(): void {
  if (!SECRET_KEY) {
    throw new Error(
      'CRYPTO_SECRET_KEY não definida no .env. ' +
      'Gere uma chave segura com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  
  // Converte hex para bytes e verifica se tem 32 bytes
  try {
    const keyBuffer = Buffer.from(SECRET_KEY, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error('CRYPTO_SECRET_KEY deve ter exatamente 64 caracteres hex (32 bytes)');
    }
  } catch {
    throw new Error('CRYPTO_SECRET_KEY deve estar em formato hexadecimal válido');
  }
}

/**
 * Criptografa uma string usando AES-256-CBC
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  validateKey();
  
  try {
    // Converte a chave hex para WordArray do CryptoJS
    const key = CryptoJS.enc.Hex.parse(SECRET_KEY!);
    
    // Gera um IV aleatório para cada criptografia
    const iv = CryptoJS.lib.WordArray.random(16); // 128 bits
    
    // Criptografa usando AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combina IV + dados criptografados
    const combined = iv.concat(encrypted.ciphertext);
    
    return combined.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Erro na criptografia');
  }
}

/**
 * Descriptografa uma string usando AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  validateKey();
  
  try {
    // Converte a chave hex para WordArray do CryptoJS
    const key = CryptoJS.enc.Hex.parse(SECRET_KEY!);
    
    // Decodifica os dados combinados (IV + ciphertext)
    const combined = CryptoJS.enc.Base64.parse(encryptedText);
    
    // Extrai o IV (primeiros 16 bytes)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    
    // Extrai o ciphertext (resto dos dados)
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
    
    // Descriptografa
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as any,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!result) {
      throw new Error('Falha na descriptografia - resultado vazio ou chave incorreta');
    }
    
    return result;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Erro na descriptografia - dados corrompidos ou chave incorreta');
  }
}

/**
 * Gera uma nova chave de criptografia segura (para uso em desenvolvimento/setup)
 */
export function generateSecureKey(): string {
  return crypto.randomBytes(32).toString('hex');
} 