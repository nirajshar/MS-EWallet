import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UserCreateDto {
  
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
    status: boolean; 
    
}