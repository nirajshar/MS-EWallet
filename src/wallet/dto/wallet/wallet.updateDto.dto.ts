import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";
import { UserUpdateDto } from "../user/user.updateDto.dto";


export class WalletUpdateDto {

    // User Details
    @ApiProperty()
    @IsOptional()
    @IsObject()
    user: UserUpdateDto;    

    @ApiProperty()
    @IsString()
    @IsOptional()
    wallet_type: string;  

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    status: boolean;  

}