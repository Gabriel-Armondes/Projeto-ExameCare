import { Body, Controller, Get, NotFoundException, Param, Post, Put, UseGuards } from "@nestjs/common";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { CurrentUser } from "../common/current-user";
import { JwtGuard } from "../common/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";

class PatientDto {
  @IsString() name!: string;
  @IsDateString() birthDate!: string;
  @IsOptional() @IsString() cpf?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() notes?: string;
}

@UseGuards(JwtGuard)
@Controller("patients")
export class PatientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.prisma.patient.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: PatientDto) {
    return this.prisma.patient.create({ data: { ...dto, userId: user.id, birthDate: new Date(dto.birthDate) } });
  }

  @Put(":id")
  async update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: PatientDto) {
    const patient = await this.prisma.patient.findFirst({ where: { id, userId: user.id } });
    if (!patient) throw new NotFoundException("Idoso nao encontrado.");
    return this.prisma.patient.update({ where: { id }, data: { ...dto, birthDate: new Date(dto.birthDate) } });
  }
}
