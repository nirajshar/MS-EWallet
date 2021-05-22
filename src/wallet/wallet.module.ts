import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from './entity/wallet.entity';
import { SystemEntity } from 'src/system/entity/system.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity, SystemEntity]),
    UserModule
  ],
  providers: [WalletService],
  controllers: [WalletController]
})
export class WalletModule {}
