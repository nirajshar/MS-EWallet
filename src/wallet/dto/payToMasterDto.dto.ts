import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class PayToMasterDto {

    @ApiProperty()
    @IsNotEmpty()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    txn_description: string;

}