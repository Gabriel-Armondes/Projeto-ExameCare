import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { CurrentUser } from "../common/current-user";
import { JwtGuard } from "../common/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";

class ConsultationDto {
  @IsString() patientId!: string;
  @IsString() doctor!: string;
  @IsString() specialty!: string;
  @IsDateString() date!: string;
  @IsOptional() @IsString() time?: string;
  @IsString() mode!: string;
  @IsString() location!: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

@UseGuards(JwtGuard)
@Controller("consultations")
export class ConsultationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.prisma.consultation.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } });
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: ConsultationDto) {
    return this.prisma.consultation.create({ data: { ...dto, userId: user.id, date: new Date(dto.date) } });
  }
}
