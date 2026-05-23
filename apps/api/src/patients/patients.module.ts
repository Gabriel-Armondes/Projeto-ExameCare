import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PatientsController } from "./patients.controller";

@Module({ imports: [JwtModule], controllers: [PatientsController] })
export class PatientsModule {}
