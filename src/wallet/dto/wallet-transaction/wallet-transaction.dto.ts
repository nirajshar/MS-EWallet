import { IsNotEmpty, IsOptional } from "class-validator";
import { TransactionBankDto } from "./transaction-bank.dto";

export class WalletTransactionDto {

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
    txn_status: string;
    
    @IsNotEmpty()
    createdAt: Date;  
 
    @IsOptional()
    bank?: TransactionBankDto;
}