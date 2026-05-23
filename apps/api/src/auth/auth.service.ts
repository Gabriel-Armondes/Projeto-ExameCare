import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthTokenType } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import * as nodemailer from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async register(dto: { name: string; email: string; password: string; consent: boolean }) {
    if (!dto.consent) throw new BadRequestException("Consentimento LGPD e obrigatorio.");
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email.toLowerCase(), passwordHash, consentAt: new Date() },
      select: { id: true, name: true, email: true }
    });
    await this.sendVerificationEmail(user.id, user.email, user.name);
    return { message: "Conta criada. Verifique seu e-mail antes de entrar." };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException("Credenciais invalidas.");
    if (!user.emailVerifiedAt) throw new UnauthorizedException("Verifique seu e-mail antes de entrar.");
    return this.sign({ id: user.id, name: user.name, email: user.email });
  }

  async verifyEmail(token: string) {
    const authToken = await this.findValidToken(AuthTokenType.EMAIL_VERIFICATION, token);
    if (!authToken) throw new BadRequestException("Token de verificacao invalido ou expirado.");

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: authToken.userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } })
    ]);

    return { message: "E-mail verificado. Voce ja pode entrar." };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && !user.emailVerifiedAt) {
      await this.sendVerificationEmail(user.id, user.email, user.name);
    }
    return { message: "Se a conta existir e ainda nao estiver verificada, enviaremos um novo e-mail." };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && user.emailVerifiedAt) {
      const token = await this.createToken(user.id, AuthTokenType.PASSWORD_RESET, 1000 * 60 * 30);
      const link = `${this.config.get("WEB_ORIGIN") || "http://localhost:5173"}?resetToken=${encodeURIComponent(token)}`;
      await this.sendEmail(user.email, "Recuperacao de senha ExameCare", [
        `Ola, ${user.name}.`,
        "Recebemos uma solicitacao para redefinir sua senha.",
        `Acesse: ${link}`,
        "Este link expira em 30 minutos."
      ].join("\n\n"));
    }
    return { message: "Se o e-mail existir e estiver verificado, enviaremos instrucoes de recuperacao." };
  }

  async resetPassword(token: string, password: string) {
    const authToken = await this.findValidToken(AuthTokenType.PASSWORD_RESET, token);
    if (!authToken) throw new BadRequestException("Token de recuperacao invalido ou expirado.");

    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: authToken.userId }, data: { passwordHash } }),
      this.prisma.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } })
    ]);

    return { message: "Senha redefinida. Voce ja pode entrar." };
  }

  sign(user: { id: string; name: string; email: string }) {
    return { user, accessToken: this.jwt.sign({ sub: user.id, email: user.email }) };
  }

  private async sendVerificationEmail(userId: string, email: string, name: string) {
    const token = await this.createToken(userId, AuthTokenType.EMAIL_VERIFICATION, 1000 * 60 * 60 * 24);
    const link = `${this.config.get("WEB_ORIGIN") || "http://localhost:5173"}?verifyToken=${encodeURIComponent(token)}`;
    await this.sendEmail(email, "Verifique sua conta ExameCare", [
      `Ola, ${name}.`,
      "Clique no link abaixo para verificar sua conta:",
      link,
      "Este link expira em 24 horas."
    ].join("\n\n"));
  }

  private async createToken(userId: string, type: AuthTokenType, ttlMs: number) {
    const token = randomBytes(32).toString("hex");
    await this.prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + ttlMs)
      }
    });
    return token;
  }

  private async findValidToken(type: AuthTokenType, token: string) {
    return this.prisma.authToken.findFirst({
      where: {
        type,
        tokenHash: this.hashToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async sendEmail(to: string, subject: string, text: string) {
    const host = this.config.get<string>("MAIL_HOST");
    const user = this.config.get<string>("MAIL_USER");
    const pass = this.config.get<string>("MAIL_PASS");

    if (!host || !user || !pass) {
      console.log(`[email nao configurado] Para: ${to}\nAssunto: ${subject}\n${text}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get("MAIL_PORT") || 587),
      secure: Number(this.config.get("MAIL_PORT") || 587) === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: this.config.get("MAIL_FROM") || "ExameCare <nao-responda@examecare.com>",
      to,
      subject,
      text
    });
  }
}
