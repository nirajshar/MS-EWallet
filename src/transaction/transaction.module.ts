import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from 'src/wallet/entity/wallet.entity';
import { BankEntity } from './entity/bank.entity';
import { TransactionEntity } from './entity/transaction.entity';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity, WalletEntity, BankEntity])
  ],
  providers: [TransactionService],
  exports: [TransactionService]
})
export class TransactionModule { }
