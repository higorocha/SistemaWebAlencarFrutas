export declare enum NivelUsuario {
    ADMINISTRADOR = "ADMINISTRADOR",
    USUARIO = "USUARIO",
    CONVIDADO = "CONVIDADO"
}
export declare class RegisterDto {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    nivel?: NivelUsuario;
}
