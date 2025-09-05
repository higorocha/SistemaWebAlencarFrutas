import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdatePasswordDto, CreateUserDto, UpdateUserDto } from './dto';
import { LoginResponseDto, RegisterResponseDto, UpdatePasswordResponseDto } from './responses/auth.responses';
import { UserResponseDto } from './dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    register(registerDto: RegisterDto): Promise<RegisterResponseDto>;
    updatePassword(updatePasswordDto: UpdatePasswordDto): Promise<UpdatePasswordResponseDto>;
    findAllUsers(): Promise<UserResponseDto[]>;
    findUserById(id: number): Promise<UserResponseDto>;
    createUser(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    deleteUser(id: number): Promise<{
        message: string;
    }>;
}
