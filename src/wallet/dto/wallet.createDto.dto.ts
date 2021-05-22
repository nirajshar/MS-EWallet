import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class WalletCreateDto {

    // User Details 
    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    mobile: string;

    @ApiProperty()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    userStatus: boolean;

    // System ID 
    @ApiProperty()
    @IsNotEmpty()
    system_id: string;
  
    // Wallet Details
    @ApiProperty()
    @IsNotEmpty()
    currency: string;
   
    @ApiProperty()
    @IsNotEmpty()
    wallet_type: string;  

    @ApiProperty()
    @IsNotEmpty()
    status: boolean;  

}