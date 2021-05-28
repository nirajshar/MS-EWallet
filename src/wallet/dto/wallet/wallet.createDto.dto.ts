import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { UserCreateDto } from "../user/user.createDto.dto";


export class WalletCreateDto {

    // User Details
    @ApiProperty()
    @IsNotEmpty()
    user: UserCreateDto;
  
    // Wallet Details
    @ApiProperty()
    @IsNotEmpty()
    currency: string;
   
    @ApiProperty()
    @IsNotEmpty()
    status: boolean;
    
    // System ID 
    @ApiProperty()
    @IsNotEmpty()
    system_id: string;

}