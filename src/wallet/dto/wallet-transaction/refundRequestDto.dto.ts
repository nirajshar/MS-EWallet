import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString} from "class-validator";

export class RefundRequestDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    UTR: string;   

    @ApiProperty()
    @IsOptional()
    @IsString()
    txn_description?: string;

}