import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class UpdateAccessDto {
   
    @ApiProperty()
    @IsNotEmpty()
    key?: string;

}