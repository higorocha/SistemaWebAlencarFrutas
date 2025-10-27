import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NivelUsuario } from '../../auth/dto';

/**
 * Guard para validar acesso baseado em cultura vinculada
 * Usado principalmente para GERENTE_CULTURA que deve ver apenas pedidos da sua cultura
 */
@Injectable()
export class CulturaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Administradores e Gerentes Gerais têm acesso total
    if (
      user.nivel === NivelUsuario.ADMINISTRADOR ||
      user.nivel === NivelUsuario.GERENTE_GERAL ||
      user.nivel === NivelUsuario.ESCRITORIO
    ) {
      return true;
    }

    // Gerente de Cultura DEVE ter cultura vinculada
    if (user.nivel === NivelUsuario.GERENTE_CULTURA) {
      if (!user.culturaId) {
        throw new ForbiddenException(
          'Gerente de Cultura deve ter uma cultura vinculada'
        );
      }
      // Cultura será usada nos controllers para filtrar pedidos
      return true;
    }

    // Outros níveis não têm acesso ao mobile
    throw new ForbiddenException('Nível de acesso não autorizado para mobile');
  }
}
