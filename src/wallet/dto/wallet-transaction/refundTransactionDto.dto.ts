import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString} from "class-validator";

export class RefundTransactionDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    UTR: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    user_wallet_id: string;

}