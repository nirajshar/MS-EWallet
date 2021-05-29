import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { WithdrawBankDto } from "./withdrawBankDto.dto";


export class WithdrawFromRegularDto {

    @ApiProperty()
    @IsNotEmpty()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    txn_description: string;

    @ApiProperty()
    @IsNotEmpty()
    bank: WithdrawBankDto;

}