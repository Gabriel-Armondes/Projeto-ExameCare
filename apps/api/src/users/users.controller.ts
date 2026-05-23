import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user";
import { JwtGuard } from "../common/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";

@UseGuards(JwtGuard)
@Controller("me")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  get(@CurrentUser() user: { id: string }) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        avatarUrl: true,
        theme: true,
        accentColor: true,
        fontScale: true,
        notificationChannel: true
      }
    });
  }

  @Put()
  update(@CurrentUser() user: { id: string }, @Body() dto: Record<string, string | number>) {
    const { name, phone, city, avatarUrl, theme, accentColor, fontScale, notificationChannel } = dto;
    return this.prisma.user.update({
      where: { id: user.id },
      data: { name, phone, city, avatarUrl, theme, accentColor, fontScale, notificationChannel } as any,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        avatarUrl: true,
        theme: true,
        accentColor: true,
        fontScale: true,
        notificationChannel: true
      }
    });
  }
}
