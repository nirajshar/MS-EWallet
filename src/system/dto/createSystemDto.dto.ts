import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class CreateSystemDto {

    @ApiProperty()
    @IsNotEmpty()
    app_name: string;

    @ApiProperty()
    @IsNotEmpty()
    app_description: string;

    @ApiProperty()
    @IsNotEmpty()
    key: string;  

    @ApiProperty()
    @IsNotEmpty()
    whitelist_ip: string;

    @ApiProperty()
    @IsNotEmpty()
    status: boolean;  

    @ApiProperty()
    @IsNotEmpty()
    account_prefix: string;  


}