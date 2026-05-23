import { Body, Controller, Get, NotFoundException, Param, Post, Put, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { CurrentUser } from "../common/current-user";
import { JwtGuard } from "../common/jwt.guard";
import { PrismaService } from "../prisma/prisma.service";

class ExamDto {
  @IsString() patientId!: string;
  @IsDateString() date!: string;
  @IsOptional() @IsString() time?: string;
  @IsString() type!: string;
  @IsString() specialty!: string;
  @IsString() location!: string;
  @IsOptional() @IsString() notes?: string;
}

@UseGuards(JwtGuard)
@Controller("exams")
export class ExamsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.prisma.exam.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } });
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: ExamDto) {
    return this.prisma.exam.create({ data: { ...dto, userId: user.id, date: new Date(dto.date) } });
  }

  @Put(":id")
  async update(@CurrentUser() user: { id: string }, @Param("id") id: string, @Body() dto: Partial<ExamDto>) {
    const exam = await this.prisma.exam.findFirst({ where: { id, userId: user.id } });
    if (!exam) throw new NotFoundException("Exame nao encontrado.");
    return this.prisma.exam.update({ where: { id }, data: { ...dto, date: dto.date ? new Date(dto.date) : undefined } });
  }

  @Post(":id/result")
  @UseInterceptors(FileInterceptor("file"))
  async uploadResult(@CurrentUser() user: { id: string }, @Param("id") id: string, @UploadedFile() file: Express.Multer.File, @Body("notes") notes?: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, userId: user.id } });
    if (!exam) throw new NotFoundException("Exame nao encontrado.");
    return this.prisma.exam.update({
      where: { id },
      data: {
        resultTitle: file?.originalname,
        resultUrl: file ? `/uploads/${file.filename}` : undefined,
        resultNotes: notes,
        resultUploadedAt: new Date()
      }
    });
  }
}
