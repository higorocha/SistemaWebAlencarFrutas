import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NivelUsuario } from '../dto/register.dto';

@Injectable()
export class PermissoesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Buscar níveis permitidos definidos pelo decorator @Niveis()
    const niveisPermitidos = this.reflector.get<NivelUsuario[]>('niveis', context.getHandler());

    // Se não há decorator @Niveis(), permite acesso
    if (!niveisPermitidos || niveisPermitidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    // Usuário deve estar autenticado (JwtAuthGuard já validou)
    if (!usuario) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar se o nível do usuário está na lista de permitidos
    if (!niveisPermitidos.includes(usuario.nivel)) {
      throw new ForbiddenException(
        `Acesso negado. Esta operação requer um dos seguintes níveis: ${niveisPermitidos.join(', ')}`
      );
    }

    return true;
  }
}
