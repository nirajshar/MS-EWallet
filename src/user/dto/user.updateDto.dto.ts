import { PartialType } from "@nestjs/swagger";
import { CreateSystemDto } from "src/system/dto/createSystemDto.dto";

export class UserUpdateDto extends PartialType(CreateSystemDto) { }