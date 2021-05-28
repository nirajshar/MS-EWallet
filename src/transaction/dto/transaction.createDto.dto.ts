import { IsDecimal, IsNotEmpty, IsString } from "class-validator";
import { WalletEntity } from "src/wallet/entity/wallet.entity";


export class TransactionCreateDto {  

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsDecimal()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    txn_description: string;

    @IsString()
    @IsNotEmpty()
    userWallet: WalletEntity;

    @IsString()
    @IsNotEmpty()
    masterWallet: WalletEntity;

}