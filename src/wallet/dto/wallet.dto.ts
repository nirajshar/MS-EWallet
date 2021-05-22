import { IsNotEmpty } from "class-validator";

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

}