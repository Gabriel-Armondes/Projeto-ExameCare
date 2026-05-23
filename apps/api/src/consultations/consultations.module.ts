import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConsultationsController } from "./consultations.controller";

@Module({ imports: [JwtModule], controllers: [ConsultationsController] })
export class ConsultationsModule {}
