import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TLSSocket } from 'tls';

interface BbWebhookCertInfo {
  subject?: Record<string, any>;
  issuer?: Record<string, any>;
  validFrom?: string;
  validTo?: string;
  fingerprint?: string;
  serialNumber?: string;
}

@Injectable()
export class BbWebhookMtlsGuard implements CanActivate {
  private readonly logger = new Logger(BbWebhookMtlsGuard.name);
  private readonly allowedSubjects: string[];

  constructor() {
    const allowedSubjectEnv = process.env.BB_WEBHOOK_ALLOWED_SUBJECTS || '';
    this.allowedSubjects = allowedSubjectEnv
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (this.allowedSubjects.length === 0) {
      this.logger.warn(
        '[WEBHOOK-MTLS] Nenhum subject permitido configurado em BB_WEBHOOK_ALLOWED_SUBJECTS. Permitindo qualquer certificado válido emitido pelo BB.',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const socket = req.socket as TLSSocket;

    if (!socket || typeof socket.authorized === 'undefined') {
      this.logger.error(
        '[WEBHOOK-MTLS] Requisição não possui informações de TLS. Configure o servidor / proxy para exigir mTLS.',
      );
      throw new ForbiddenException(
        'Webhook precisa ser acessado através de conexão mTLS válida.',
      );
    }

    if (!socket.authorized) {
      this.logger.error(
        `[WEBHOOK-MTLS] Conexão TLS não autorizada. Motivo: ${socket.authorizationError}`,
      );
      throw new ForbiddenException(
        `Certificado do cliente não autorizado (motivo: ${socket.authorizationError || 'desconhecido'})`,
      );
    }

    const peerCertificate = socket.getPeerCertificate(true);
    if (!peerCertificate || Object.keys(peerCertificate).length === 0) {
      this.logger.error(
        '[WEBHOOK-MTLS] Nenhum certificado de cliente foi apresentado pelo Banco do Brasil.',
      );
      throw new ForbiddenException(
        'Certificado de cliente mTLS não informado pelo Banco do Brasil.',
      );
    }

    // Acessar subject de forma segura
    // No Node.js, getPeerCertificate().subject pode ser string ou objeto
    const subject = peerCertificate.subject;
    let subjectCN = '';
    
    // Converter para string se necessário (subject pode ser string ou objeto)
    const subjectStr = typeof subject === 'string' 
      ? subject 
      : (subject ? JSON.stringify(subject) : '');
    
    if (subjectStr) {
      // Normalizar formato: substituir barras por vírgulas para facilitar parsing
      const normalizedSubject = subjectStr.replace(/\//g, ',');
      
      // Extrair CN (Common Name) - tenta com vírgula e barra
      const cnMatch = normalizedSubject.match(/CN=([^,]+)/);
      if (cnMatch) {
        subjectCN = cnMatch[1].trim();
      }
      
      // Se não encontrou, tentar acessar como objeto
      if (!subjectCN && typeof subject === 'object' && subject !== null) {
        const subjectData = subject as unknown as Record<string, any>;
        subjectCN =
          subjectData.CN ||
          subjectData['CN'] ||
          subjectData['commonName'] ||
          subjectData['Common Name'] ||
          '';
      }
    }

    if (
      this.allowedSubjects.length > 0 &&
      subjectCN &&
      !this.allowedSubjects.includes(subjectCN)
    ) {
      this.logger.error(
        `[WEBHOOK-MTLS] Subject CN "${subjectCN}" não está na lista permitida (${this.allowedSubjects.join(
          ', ',
        )}).`,
      );
      throw new ForbiddenException(
        `Certificado do cliente não autorizado (CN: ${subjectCN}).`,
      );
    }

    const certInfo: BbWebhookCertInfo = {
      subject: peerCertificate.subject,
      issuer: peerCertificate.issuer,
      validFrom: peerCertificate.valid_from,
      validTo: peerCertificate.valid_to,
      fingerprint: peerCertificate.fingerprint256 || peerCertificate.fingerprint,
      serialNumber: peerCertificate.serialNumber,
    };

    req.bbWebhookClientCert = certInfo;

    this.logger.log(
      `[WEBHOOK-MTLS] Certificado válido recebido. Subject CN: ${subjectCN}, Serial: ${certInfo.serialNumber}`,
    );

    return true;
  }
}

