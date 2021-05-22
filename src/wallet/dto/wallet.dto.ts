import { IsNotEmpty } from "class-validator";
import { SystemEntity } from "src/system/entity/system.entity";


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