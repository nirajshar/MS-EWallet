import { IsNotEmpty, IsOptional } from "class-validator";
import { TransactionEntity } from "src/transaction/entity/transaction.entity";

export class WalletDto {

    @IsNotEmpty()
    id: string;   

    @IsNotEmpty()
    account_no: string;   

    @IsNotEmpty()
    currency: string;   

    @IsNotEmpty()
    balance: number;   

    @IsNotEmpty()
    user_id: string;   

    @IsNotEmpty()
    system_name: string;   

    @IsNotEmpty()
    status: boolean;
    
    @IsNotEmpty()
    wallet_user_type: string;  
 
    @IsOptional()
    token?: string;

}