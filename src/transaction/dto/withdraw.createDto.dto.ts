
import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNotEmpty, IsString } from "class-validator";
import { WithdrawBankDto } from "src/wallet/dto/wallet-transaction/withdrawBankDto.dto";
import { WalletEntity } from "src/wallet/entity/wallet.entity";


export class WithdrawCreateTransactionDto {

    @ApiProperty()
    @IsNotEmpty()
    currency: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDecimal()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    txn_description: string;

    @ApiProperty()
    @IsNotEmpty()
    userWallet: WalletEntity;

    @ApiProperty()
    @IsNotEmpty()
    bank: WithdrawBankDto;
}
