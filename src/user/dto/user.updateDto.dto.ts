import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UserUpdateDto {

    @ApiProperty()
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    mobile: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    email: string;

}