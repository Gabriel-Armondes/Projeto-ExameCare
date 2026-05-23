import { Body, Controller, Post } from "@nestjs/common";
import { IsBoolean, IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class RegisterDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
  @IsBoolean() consent!: boolean;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

class EmailDto {
  @IsEmail() email!: string;
}

class ResetPasswordDto {
  @IsString() token!: string;
  @MinLength(8) password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}
