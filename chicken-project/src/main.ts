import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 프론트엔드(브라우저)에서 이 서버의 API를 호출할 수 있도록 CORS 허용
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
