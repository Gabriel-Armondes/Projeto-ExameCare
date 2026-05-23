import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { JwtModule } from "@nestjs/jwt";
import { ExamsController } from "./exams.controller";

@Module({
  imports: [JwtModule, MulterModule.register({ dest: process.env.UPLOAD_DIR || "./uploads" })],
  controllers: [ExamsController]
})
export class ExamsModule {}
