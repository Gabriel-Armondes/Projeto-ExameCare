import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as webpush from "web-push";
import { CurrentUser } from "../common/current-user";
import { JwtGuard } from "../common/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";

@UseGuards(JwtGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    const publicKey = config.get<string>("VAPID_PUBLIC_KEY");
    const privateKey = config.get<string>("VAPID_PRIVATE_KEY");
    if (publicKey && privateKey) {
      webpush.setVapidDetails(config.get<string>("VAPID_SUBJECT") || "mailto:suporte@examecare.com", publicKey, privateKey);
    }
  }

  @Post("subscribe")
  subscribe(@CurrentUser() user: { id: string }, @Body() dto: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { p256dh: dto.keys.p256dh, auth: dto.keys.auth },
      create: { userId: user.id, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth }
    });
  }

  @Post("test")
  async test(@CurrentUser() user: { id: string }) {
    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId: user.id } });
    await Promise.all(subscriptions.map((item: { endpoint: string; p256dh: string; auth: string }) => webpush.sendNotification({
      endpoint: item.endpoint,
      keys: { p256dh: item.p256dh, auth: item.auth }
    }, JSON.stringify({ title: "ExameCare", body: "Notificacao push real configurada." }))));
    return { sent: subscriptions.length };
  }
}
