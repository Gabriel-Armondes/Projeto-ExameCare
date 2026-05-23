import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersController } from "./users.controller";

@Module({ imports: [JwtModule], controllers: [UsersController] })
export class UsersModule {}
