import { ApiProperty } from "@nestjs/swagger";
import {  IsBoolean, IsOptional, IsString } from "class-validator";


export class UpdateSystemDto {

    @ApiProperty() 
    @IsString() 
    @IsOptional()
    app_name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    app_description: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    key: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    whitelist_ip: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    status: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    account_prefix: string;

    // Required details for Wallet  
    @ApiProperty()
    @IsString()
    @IsOptional()
    email: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    mobile: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    currency: string;
}