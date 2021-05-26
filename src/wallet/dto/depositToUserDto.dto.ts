import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Min } from "class-validator";
import { BankCreateDto } from "src/transaction/dto/bank.createDto.dto";


export class DepositToUserDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    txn_description: string;

    @ApiProperty()
    @IsNotEmpty()
    bank: BankCreateDto;

    // @ApiProperty()
    // @IsNotEmpty()
    // destination_wallet_id: string;

}