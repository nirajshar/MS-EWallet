import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemEntity } from './entity/system.entity';
import { UserModule } from 'src/user/user.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemEntity]),
    WalletModule,
    UserModule
  ],
  providers: [SystemService],
  controllers: [SystemController]
})
export class SystemModule {}
