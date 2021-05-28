import { IsNotEmpty, IsOptional } from "class-validator";
import { WalletTransactionDto } from "./wallet-transaction.dto";

export class WalletTransactionBankDto {

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
    system_id: string;   

    @IsNotEmpty()
    status: boolean;
    
    @IsNotEmpty()
    wallet_user_type: string;  
    
    @IsOptional()
    transactions?: WalletTransactionDto[];

}