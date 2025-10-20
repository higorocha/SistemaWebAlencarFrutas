import { SetMetadata } from '@nestjs/common';
import { NivelUsuario } from '../dto/register.dto';

/**
 * Decorator para definir quais níveis de usuário podem acessar um endpoint
 *
 * @example
 * // Apenas ADMINISTRADOR pode acessar
 * @Niveis(NivelUsuario.ADMINISTRADOR)
 *
 * @example
 * // ADMINISTRADOR e GERENTE_GERAL podem acessar
 * @Niveis(NivelUsuario.ADMINISTRADOR, NivelUsuario.GERENTE_GERAL)
 *
 * @example
 * // Todos exceto GERENTE_CULTURA
 * @Niveis(NivelUsuario.ADMINISTRADOR, NivelUsuario.GERENTE_GERAL, NivelUsuario.ESCRITORIO)
 */
export const Niveis = (...niveis: NivelUsuario[]) => SetMetadata('niveis', niveis);
