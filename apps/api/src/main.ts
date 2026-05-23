import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { readFileSync } from "node:fs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const config = new ConfigService();
  const keyPath = config.get<string>("HTTPS_KEY_PATH");
  const certPath = config.get<string>("HTTPS_CERT_PATH");
  const httpsOptions = keyPath && certPath ? { key: readFileSync(keyPath), cert: readFileSync(certPath) } : undefined;
  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});

  app.setGlobalPrefix("api");
  app.enableCors({ origin: config.get("WEB_ORIGIN") || "http://localhost:5173", credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(Number(config.get("API_PORT") || 3000));
}

bootstrap();
