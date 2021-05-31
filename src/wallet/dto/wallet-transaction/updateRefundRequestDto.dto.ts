import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty  } from "class-validator";

export class UpdateRefundRequestDto {

    @ApiProperty()
    @IsNotEmpty()
    UTR: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_status: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_description: string;

}