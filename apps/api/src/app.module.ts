import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { ConsultationsModule } from "./consultations/consultations.module";
import { ExamsModule } from "./exams/exams.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PatientsModule } from "./patients/patients.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    ExamsModule,
    ConsultationsModule,
    NotificationsModule
  ]
})
export class AppModule {}
