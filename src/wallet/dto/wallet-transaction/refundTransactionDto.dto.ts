import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString} from "class-validator";

export class RefundTransactionDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    UTR: string;

    // @ApiProperty()
    // @IsNotEmpty()
    // @IsString()
    // user_wallet_id: string;

    @ApiProperty()
    @IsNotEmpty()
    txn_status: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    txn_description?: string;

}