import { IsDecimal, IsNotEmpty, IsString } from "class-validator";
import { WalletEntity } from "src/wallet/entity/wallet.entity";
import { BankEntity } from "../entity/bank.entity";
import { BankCreateDto } from "./bank.createDto.dto";


export class TransactionDepositCreateDto {  

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsDecimal()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    txn_type: string;

    @IsString()
    @IsNotEmpty()
    txn_description: string;

    @IsString()
    @IsNotEmpty()
    bank: BankCreateDto;

    @IsString()
    @IsNotEmpty()
    destinationWallet: WalletEntity;

}