import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";


export class WalletUpdateDto {

    @ApiProperty()
    @IsString()
    @IsOptional()
    wallet_type: string;  

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    status: boolean;  

}