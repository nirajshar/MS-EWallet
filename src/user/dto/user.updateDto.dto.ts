import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { CreateSystemDto } from "src/system/dto/createSystemDto.dto";


export class UserUpdateDto extends PartialType(CreateSystemDto){

    // @ApiProperty()
    // @IsString()
    // name: string;

    // @ApiProperty()
    // @IsString()
    // mobile: string;

    // @ApiProperty()
    // @IsString()
    // email: string;

    // @ApiProperty()
    // @IsBoolean()
    // status: boolean; 

}