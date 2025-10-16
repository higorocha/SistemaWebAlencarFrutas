import * as fs from 'fs';
import * as path from 'path';
import { X509Certificate } from 'crypto';
import { getAvailableBBAPIs, getBBAPIConfig } from '../config/bb-api.config';

/**
 * Gerenciador de Certificados do Banco do Brasil
 * 
 * Este utilitário facilita a gestão de certificados, incluindo:
 * - Validação de certificados
 * - Backup automático
 * - Troca de certificados
 * - Verificação de integridade
 * - Logs detalhados
 */

export interface CertificateInfo {
  path: string;
  exists: boolean;
  size: number;
  lastModified: Date;
  isValid: boolean;
  expiryDate?: Date;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
}

export interface CertificateStatus {
  apiName: string;
  certificates: {
    clientCert: CertificateInfo;
    clientKey: CertificateInfo;
    caCerts: CertificateInfo[];
  };
  overallStatus: 'valid' | 'invalid' | 'partial';
  issues: string[];
}

/**
 * Extrai informações de vencimento de um certificado
 */
function getCertificateExpiryInfo(certPath: string): {
  expiryDate?: Date;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
} {
  try {
    const certBuffer = fs.readFileSync(certPath);
    const cert = new X509Certificate(certBuffer);
    
    const expiryDate = new Date(cert.validTo);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      expiryDate,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry >= 0 // Vence em 30 dias ou menos
    };
  } catch (error) {
    // Se não conseguir ler o certificado, retorna undefined
    return {};
  }
}

/**
 * Obtém informações detalhadas de um certificado
 */
function getCertificateInfo(certPath: string): CertificateInfo {
  const fullPath = path.resolve(process.cwd(), certPath);
  
  try {
    const stats = fs.statSync(fullPath);
    const expiryInfo = getCertificateExpiryInfo(fullPath);
    
    return {
      path: fullPath,
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
      isValid: stats.size > 0, // Certificado válido se tem conteúdo
      ...expiryInfo
    };
  } catch (error) {
    return {
      path: fullPath,
      exists: false,
      size: 0,
      lastModified: new Date(0),
      isValid: false
    };
  }
}

/**
 * Valida todos os certificados de uma API específica
 */
export function validateAPICertificates(apiName: string): CertificateStatus {
  const config = getBBAPIConfig(apiName as any);
  const issues: string[] = [];
  
  const clientCert = getCertificateInfo(config.certificates.clientCertPath);
  const clientKey = getCertificateInfo(config.certificates.clientKeyPath);
  const caCerts = config.certificates.caCertPaths.map(certPath => getCertificateInfo(certPath));

  // Verifica certificado cliente
  if (!clientCert.exists) {
    issues.push(`Certificado cliente não encontrado: ${clientCert.path}`);
  } else if (!clientCert.isValid) {
    issues.push(`Certificado cliente inválido (vazio): ${clientCert.path}`);
  } else if (clientCert.isExpired) {
    issues.push(`🚨 CERTIFICADO CLIENTE VENCIDO: ${clientCert.path} (Venceu em ${clientCert.expiryDate?.toLocaleDateString('pt-BR')})`);
  } else if (clientCert.isExpiringSoon) {
    issues.push(`⚠️ Certificado cliente vence em breve: ${clientCert.path} (Vence em ${clientCert.daysUntilExpiry} dias)`);
  }

  // Verifica chave privada
  if (!clientKey.exists) {
    issues.push(`Chave privada não encontrada: ${clientKey.path}`);
  } else if (!clientKey.isValid) {
    issues.push(`Chave privada inválida (vazia): ${clientKey.path}`);
  }

  // Verifica certificados CA
  caCerts.forEach((caCert, index) => {
    if (!caCert.exists) {
      issues.push(`Certificado CA ${index + 1} não encontrado: ${caCert.path}`);
    } else if (!caCert.isValid) {
      issues.push(`Certificado CA ${index + 1} inválido (vazio): ${caCert.path}`);
    }
  });

  // Determina status geral
  let overallStatus: 'valid' | 'invalid' | 'partial' = 'valid';
  if (issues.length > 0) {
    const criticalIssues = issues.filter(issue => 
      issue.includes('não encontrado') || issue.includes('inválido')
    );
    overallStatus = criticalIssues.length > 0 ? 'invalid' : 'partial';
  }

  return {
    apiName: config.name,
    certificates: {
      clientCert,
      clientKey,
      caCerts
    },
    overallStatus,
    issues
  };
}

/**
 * Valida certificados de todas as APIs configuradas
 */
export function validateAllCertificates(): CertificateStatus[] {
  const apis = getAvailableBBAPIs();
  return apis.map(apiName => validateAPICertificates(apiName));
}

/**
 * Cria backup dos certificados atuais
 */
export function backupCertificates(backupDir: string = 'certs/backup'): {
  success: boolean;
  backupPath: string;
  files: string[];
  error?: string;
} {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(process.cwd(), backupDir, `backup-${timestamp}`);
    
    // Cria diretório de backup
    fs.mkdirSync(backupPath, { recursive: true });

    const config = getBBAPIConfig('PIX'); // Usa PIX como referência (mesmos certificados)
    const filesToBackup = [
      config.certificates.clientCertPath,
      config.certificates.clientKeyPath,
      ...config.certificates.caCertPaths
    ];

    const backedUpFiles: string[] = [];

    filesToBackup.forEach(filePath => {
      const sourcePath = path.resolve(process.cwd(), filePath);
      const fileName = path.basename(filePath);
      const destPath = path.join(backupPath, fileName);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        backedUpFiles.push(fileName);
      }
    });

    console.log(`[Certificate-Manager] ✅ Backup criado em: ${backupPath}`);
    console.log(`[Certificate-Manager] Arquivos copiados: ${backedUpFiles.join(', ')}`);

    return {
      success: true,
      backupPath,
      files: backedUpFiles
    };
  } catch (error) {
    console.error('[Certificate-Manager] ❌ Erro ao criar backup:', error.message);
    return {
      success: false,
      backupPath: '',
      files: [],
      error: error.message
    };
  }
}

/**
 * Lista informações de todos os certificados
 */
export function listCertificateInfo(): void {
  console.log('\n🔐 === INFORMAÇÕES DOS CERTIFICADOS BB ===\n');
  
  const statuses = validateAllCertificates();
  
  statuses.forEach(status => {
    console.log(`📋 API: ${status.apiName}`);
    console.log(`   Status: ${getStatusEmoji(status.overallStatus)} ${status.overallStatus.toUpperCase()}`);
    
    if (status.issues.length > 0) {
      console.log('   ⚠️  Problemas:');
      status.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    console.log(`   📄 Certificado Cliente: ${formatFileInfo(status.certificates.clientCert)}`);
    console.log(`   🔑 Chave Privada: ${formatFileInfo(status.certificates.clientKey)}`);
    
    status.certificates.caCerts.forEach((caCert, index) => {
      console.log(`   🏛️  CA ${index + 1}: ${formatFileInfo(caCert)}`);
    });
    
    console.log('');
  });
}

/**
 * Formata informações de arquivo para exibição
 */
function formatFileInfo(cert: CertificateInfo): string {
  if (!cert.exists) {
    return '❌ NÃO ENCONTRADO';
  }
  
  const sizeKB = (cert.size / 1024).toFixed(1);
  const lastMod = cert.lastModified.toLocaleDateString('pt-BR');
  
  let status = '✅';
  let expiryInfo = '';
  
  if (cert.isExpired) {
    status = '🚨 VENCIDO';
    expiryInfo = ` (Venceu em ${cert.expiryDate?.toLocaleDateString('pt-BR')})`;
  } else if (cert.isExpiringSoon) {
    status = '⚠️ VENCE EM BREVE';
    expiryInfo = ` (Vence em ${cert.daysUntilExpiry} dias - ${cert.expiryDate?.toLocaleDateString('pt-BR')})`;
  } else if (cert.expiryDate) {
    expiryInfo = ` (Vence em ${cert.expiryDate.toLocaleDateString('pt-BR')})`;
  }
  
  return `${status} ${sizeKB}KB (${lastMod})${expiryInfo}`;
}

/**
 * Retorna emoji baseado no status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'valid': return '✅';
    case 'partial': return '⚠️';
    case 'invalid': return '❌';
    default: return '❓';
  }
}

/**
 * Verifica especificamente vencimentos de certificados
 */
export function checkCertificateExpiry(): {
  hasExpired: boolean;
  hasExpiringSoon: boolean;
  expiredCerts: string[];
  expiringSoonCerts: string[];
} {
  const statuses = validateAllCertificates();
  const expiredCerts: string[] = [];
  const expiringSoonCerts: string[] = [];
  
  statuses.forEach(status => {
    const clientCert = status.certificates.clientCert;
    if (clientCert.isExpired) {
      expiredCerts.push(`${status.apiName}: ${clientCert.path} (Venceu em ${clientCert.expiryDate?.toLocaleDateString('pt-BR')})`);
    } else if (clientCert.isExpiringSoon) {
      expiringSoonCerts.push(`${status.apiName}: ${clientCert.path} (Vence em ${clientCert.daysUntilExpiry} dias)`);
    }
  });
  
  return {
    hasExpired: expiredCerts.length > 0,
    hasExpiringSoon: expiringSoonCerts.length > 0,
    expiredCerts,
    expiringSoonCerts
  };
}

/**
 * Comando para verificar certificados (pode ser chamado via CLI)
 */
export function checkCertificates(): void {
  console.log('🔍 Verificando certificados do Banco do Brasil...\n');
  
  const statuses = validateAllCertificates();
  const hasIssues = statuses.some(status => status.issues.length > 0);
  
  // Verificar vencimentos especificamente
  const expiryCheck = checkCertificateExpiry();
  
  if (expiryCheck.hasExpired) {
    console.log('🚨 CERTIFICADOS VENCIDOS:');
    expiryCheck.expiredCerts.forEach(cert => console.log(`   - ${cert}`));
    console.log('');
  }
  
  if (expiryCheck.hasExpiringSoon) {
    console.log('⚠️ CERTIFICADOS VENCENDO EM BREVE (≤30 dias):');
    expiryCheck.expiringSoonCerts.forEach(cert => console.log(`   - ${cert}`));
    console.log('');
  }
  
  if (hasIssues) {
    console.log('❌ OUTROS PROBLEMAS ENCONTRADOS:');
    statuses.forEach(status => {
      if (status.issues.length > 0) {
        console.log(`\n📋 ${status.apiName}:`);
        status.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    });
    
    console.log('\n💡 SOLUÇÕES:');
    console.log('   1. Verifique se os arquivos de certificado existem na pasta certs/');
    console.log('   2. Confirme se os nomes dos arquivos estão corretos');
    console.log('   3. Verifique se os certificados não estão corrompidos');
    console.log('   4. Para trocar certificados, use backupCertificates() primeiro');
  } else if (!expiryCheck.hasExpired && !expiryCheck.hasExpiringSoon) {
    console.log('✅ TODOS OS CERTIFICADOS ESTÃO VÁLIDOS E DENTRO DO PRAZO!');
  }
}
