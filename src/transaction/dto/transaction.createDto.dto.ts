import { ApiProperty } from "@nestjs/swagger";
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
    txn_type: string;

    @IsString()
    @IsNotEmpty()
    txn_description: string;

    @IsString()
    @IsNotEmpty()
    source_wallet_id: WalletEntity;

    @IsString()
    @IsNotEmpty()
    destination_wallet_id: WalletEntity;

}