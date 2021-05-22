import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class WalletCreateDto {

    @ApiProperty()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty()
    @IsNotEmpty()
    system_id: string;
  
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