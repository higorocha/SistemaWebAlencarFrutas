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

    // Extrair IP de origem (como no exemplo)
    const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const ip = (realIP || forwardedFor || clientIP).replace(/^::ffff:/, '').split(',')[0].trim();
    
    // Verificar se está nos ranges do BB
    const isProdRange = ip.startsWith('170.66.');
    const isSandboxRange = ip.startsWith('201.33.144.');
    const isBBIP = isProdRange || isSandboxRange;

    // Tentar validar mTLS se disponível
    if (socket && typeof socket.authorized !== 'undefined') {
      if (!socket.authorized) {
        this.logger.warn(
          `[WEBHOOK-MTLS] Conexão TLS não autorizada. Motivo: ${socket.authorizationError}. IP: ${ip}`,
        );
        // Se não é IP do BB, bloquear
        if (!isBBIP) {
          throw new ForbiddenException(
            `Certificado do cliente não autorizado (motivo: ${socket.authorizationError || 'desconhecido'})`,
          );
        }
        // Se é IP do BB mas não autorizado, permitir mas logar (pode ser problema de configuração)
        this.logger.warn(
          `[WEBHOOK-MTLS] IP do BB detectado mas TLS não autorizado. Permitindo mas investigar configuração.`,
        );
        return true;
      }

      // Se autorizado, validar certificado
      const peerCertificate = socket.getPeerCertificate(true);
      if (peerCertificate && Object.keys(peerCertificate).length > 0) {
        // Validar subject se configurado
        const subject = peerCertificate.subject;
        let subjectCN = '';
        
        const subjectStr = typeof subject === 'string' 
          ? subject 
          : (subject ? JSON.stringify(subject) : '');
        
        if (subjectStr) {
          const normalizedSubject = subjectStr.replace(/\//g, ',');
          const cnMatch = normalizedSubject.match(/CN=([^,]+)/);
          if (cnMatch) {
            subjectCN = cnMatch[1].trim();
          }
          
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
          `[WEBHOOK-MTLS] Certificado válido recebido. Subject CN: ${subjectCN}, Serial: ${certInfo.serialNumber}, IP: ${ip}`,
        );
        return true;
      }
    }

    // Se não tem informações de TLS (proxy não configurado para mTLS)
    // Permitir apenas se for IP do BB (como no exemplo)
    if (isBBIP) {
      this.logger.warn(
        `[WEBHOOK-MTLS] Requisição sem informações de TLS, mas IP do BB detectado (${ip}). Permitindo. Configure o proxy para mTLS em produção.`,
      );
      return true;
    }

    // Se não tem TLS e não é IP do BB, bloquear
    this.logger.error(
      `[WEBHOOK-MTLS] Requisição sem informações de TLS e IP não é do BB (${ip}). Bloqueando.`,
    );
    throw new ForbiddenException(
      'Webhook precisa ser acessado através de conexão mTLS válida ou de IP autorizado do Banco do Brasil.',
    );
  }
}

