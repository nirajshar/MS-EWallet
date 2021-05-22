import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemEntity } from './entity/system.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemEntity])
  ],
  providers: [SystemService],
  controllers: [SystemController]
})
export class SystemModule {}
