import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateWithdrawDto {

    @ApiProperty()
    @IsNotEmpty()
    user_wallet_id: string;

    @ApiProperty()
    @IsNotEmpty()
    UTR: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_status: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_description: string;

    @ApiProperty()
    @IsOptional()
    bank_utr_no?: string;

}