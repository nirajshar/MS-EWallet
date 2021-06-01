import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty  } from "class-validator";

export class UpdatePayToMasterRequestDto {

    @ApiProperty()
    @IsNotEmpty()
    UTR: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_status: string;   

}