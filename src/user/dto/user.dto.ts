import { IsNotEmpty, IsOptional } from "class-validator";

export class UserDto {

    @IsNotEmpty()
    uuid: string;    
    
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    mobile: string;

    @IsOptional()
    email?: string;

    @IsNotEmpty()
    status: boolean;

}