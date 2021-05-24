import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class PayToMasterDto {

    @ApiProperty()
    @IsNotEmpty()
    source_wallet_id: string;

    @ApiProperty()
    @IsNotEmpty()
    destination_wallet_id: string;

    @ApiProperty()
    @IsNotEmpty()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    txn_type: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_description: string;

}