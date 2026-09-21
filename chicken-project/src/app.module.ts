import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChickenModule } from './chicken/chicken.module';

@Module({
  imports: [ChickenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
