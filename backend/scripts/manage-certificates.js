#!/usr/bin/env node

/**
 * Script CLI para gerenciar certificados do Banco do Brasil
 * 
 * Uso:
 *   node scripts/manage-certificates.js check     - Verifica certificados
 *   node scripts/manage-certificates.js backup    - Cria backup
 *   node scripts/manage-certificates.js info      - Lista informações
 *   node scripts/manage-certificates.js help      - Mostra ajuda
 */

const path = require('path');
const fs = require('fs');

// Importa as funções do certificate-manager
const { 
  validateAllCertificates, 
  backupCertificates, 
  listCertificateInfo,
  checkCertificates,
  checkCertificateExpiry
} = require('../dist/utils/certificate-manager');

/**
 * Função principal
 */
async function main() {
  const command = process.argv[2] || 'help';
  
  console.log('🔐 Gerenciador de Certificados BB\n');
  
  try {
    switch (command.toLowerCase()) {
      case 'check':
        console.log('🔍 Verificando certificados...\n');
        checkCertificates();
        break;
        
      case 'expiry':
        console.log('📅 Verificando vencimentos de certificados...\n');
        const expiryCheck = checkCertificateExpiry();
        
        if (expiryCheck.hasExpired) {
          console.log('🚨 CERTIFICADOS VENCIDOS:');
          expiryCheck.expiredCerts.forEach(cert => console.log(`   - ${cert}`));
          console.log('\n⚠️ AÇÃO NECESSÁRIA: Substitua os certificados vencidos imediatamente!');
        } else {
          console.log('✅ Nenhum certificado vencido encontrado');
        }
        
        if (expiryCheck.hasExpiringSoon) {
          console.log('\n⚠️ CERTIFICADOS VENCENDO EM BREVE (≤30 dias):');
          expiryCheck.expiringSoonCerts.forEach(cert => console.log(`   - ${cert}`));
          console.log('\n💡 RECOMENDAÇÃO: Prepare a substituição dos certificados');
        } else {
          console.log('\n✅ Nenhum certificado vencendo em breve');
        }
        
        if (!expiryCheck.hasExpired && !expiryCheck.hasExpiringSoon) {
          console.log('\n🎉 Todos os certificados estão válidos e dentro do prazo!');
        }
        break;
        
      case 'backup':
        console.log('💾 Criando backup dos certificados...\n');
        const backup = backupCertificates();
        if (backup.success) {
          console.log(`✅ Backup criado com sucesso!`);
          console.log(`📁 Local: ${backup.backupPath}`);
          console.log(`📄 Arquivos: ${backup.files.join(', ')}`);
        } else {
          console.log(`❌ Erro ao criar backup: ${backup.error}`);
          process.exit(1);
        }
        break;
        
      case 'info':
        console.log('📋 Informações dos certificados...\n');
        listCertificateInfo();
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

/**
 * Mostra ajuda do comando
 */
function showHelp() {
  console.log('📖 COMANDOS DISPONÍVEIS:\n');
  
  console.log('  check     Verifica se todos os certificados estão válidos');
  console.log('  expiry    Verifica vencimentos de certificados (≤30 dias)');
  console.log('  backup    Cria backup dos certificados atuais');
  console.log('  info      Lista informações detalhadas dos certificados');
  console.log('  help      Mostra esta ajuda\n');
  
  console.log('📝 EXEMPLOS:\n');
  console.log('  node scripts/manage-certificates.js check');
  console.log('  node scripts/manage-certificates.js expiry');
  console.log('  node scripts/manage-certificates.js backup');
  console.log('  node scripts/manage-certificates.js info\n');
  
  console.log('🔧 TROCA DE CERTIFICADOS:\n');
  console.log('  1. node scripts/manage-certificates.js backup');
  console.log('  2. Substitua os arquivos na pasta certs/');
  console.log('  3. node scripts/manage-certificates.js check');
  console.log('  4. Reinicie a aplicação\n');
  
  console.log('📁 ESTRUTURA DE CERTIFICADOS:\n');
  console.log('  certs/');
  console.log('  ├── bestnet_final.cer            (Certificado cliente)');
  console.log('  ├── bestnet_final_key.pem        (Chave privada)');
  console.log('  ├── GeoTrust_EV_RSA_CA_G2.cer    (CA 1)');
  console.log('  ├── DigiCert_Global_Root_G2.cer  (CA 2)');
  console.log('  └── api-pix_bb_com_br.crt        (CA 3)');
}

// Executa o script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, showHelp };
