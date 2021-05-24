import { IsNotEmpty } from "class-validator";
import { WalletEntity } from "src/wallet/entity/wallet.entity";


export class TransactionDto {

    @IsNotEmpty()
    uuid: string;

    @IsNotEmpty()
    txn_id: string;

    @IsNotEmpty()
    currency: string;

    @IsNotEmpty()
    amount: number;

    @IsNotEmpty()
    txn_type: string;

    @IsNotEmpty()
    txn_description: string;

    @IsNotEmpty()
    source_wallet: WalletEntity;

    @IsNotEmpty()
    destination_wallet: WalletEntity;

    @IsNotEmpty()
    txn_status: string;

}