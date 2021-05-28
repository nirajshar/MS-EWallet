import { IsDecimal, IsNotEmpty, IsObject, IsString } from "class-validator";
import { WalletEntity } from "src/wallet/entity/wallet.entity";


export class AccountingCreateDto {    
    
    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsDecimal()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    txn_description: string;

    @IsObject()
    @IsNotEmpty()
    wallet: WalletEntity;

    @IsString()
    @IsNotEmpty()
    UTR: string;

    @IsString()
    @IsNotEmpty()
    txn_type: string;

}