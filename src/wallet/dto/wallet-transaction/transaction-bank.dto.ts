import { IsNotEmpty } from "class-validator";

export class TransactionBankDto {

    @IsNotEmpty()
    uuid: string;   

    @IsNotEmpty()
    bank_name: string;   

    @IsNotEmpty()
    bank_ifsc: string;   

    @IsNotEmpty()
    account_holder_name: string;   

    @IsNotEmpty()
    account_no: string;   

}