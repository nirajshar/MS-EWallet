import { IsNotEmpty, IsOptional } from "class-validator";

export class WalletDepositOutDto {

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

    @IsNotEmpty()
    transaction_id: string;  
 

}