export declare enum TipoLogin {
    WEB = "web",
    MOBILE = "mobile"
}
export declare class LoginDto {
    email: string;
    senha: string;
    tipoLogin?: TipoLogin;
}
