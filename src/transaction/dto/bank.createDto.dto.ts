import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class BankCreateDto {

    @ApiProperty()
    @IsNotEmpty()
    bank_name: string;
   
    @ApiProperty()
    @IsNotEmpty()
    bank_ifsc: string;

    @ApiProperty()
    @IsNotEmpty()
    account_holder_name: string;

    @ApiProperty()
    @IsNotEmpty()
    account_no: string; 

}