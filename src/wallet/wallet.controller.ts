import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepositToUserDto } from './dto/depositToUserDto.dto';
import { PayToMasterDto } from './dto/PayToMasterDto.dto';
import { WalletCreateDto } from './dto/wallet.createDto.dto';
import { WalletUpdateDto } from './dto/wallet.updateDto.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {

    constructor(
        private readonly walletService: WalletService,
    ) { }

    // Get all Wallets
    @ApiTags('Wallet')
    @ApiResponse({ status: 200, description: 'Get all Wallets in Array of Object' })
    @Get()
    async findAll() {
        return this.walletService.findAll();
    }

    // Get Wallet by ID
    @ApiTags('Wallet')
    @ApiResponse({ status: 200, description: 'Get Wallet details by ID' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.walletService.findOne(id);
    }

    // Create One Wallet 
    @ApiTags('Wallet')
    @ApiResponse({ status: 201, description: 'Wallet created successfully' })
    @ApiResponse({ status: 409, description: 'Wallet already exist' })
    @ApiBody({ type: WalletCreateDto })
    @Post()
    async create(@Body() walletCreateDto: WalletCreateDto) {
        return this.walletService.create(walletCreateDto);
    }

    // Update Wallet by ID
    @ApiTags('Wallet')
    @ApiResponse({ status: 204, description: 'Wallet updated successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @ApiBody({ type: WalletUpdateDto })
    @Put(':id')
    async update(@Param('id') id: string, @Body() walletUpdateDto: WalletUpdateDto) {
        return this.walletService.update(id, walletUpdateDto);
    }

    // Delete One Wallet by ID
    @ApiTags('Wallet')
    @ApiResponse({ status: 200, description: 'Wallet deleted successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.walletService.delete(id);
    }

    // Wallet Transactions ---------------------------------------------------------

    // Deposit Amount to Wallet (REGULAR) from BANK
    @ApiTags('Wallet-Transaction')
    @ApiResponse({ status: 201, description: 'Transaction created successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: DepositToUserDto })
    @Post('deposit/neft')
    async depositToUserWallet(
        @Headers('user-wallet-id') destination_wallet_id: string,
        @Body() depositToUserDto: DepositToUserDto) {
        return this.walletService.depositNEFT(destination_wallet_id, depositToUserDto);
    }

    // Get Wallet with All Transactions
    @ApiTags('Wallet-Transaction')
    @ApiResponse({ status: 200, description: 'Get Wallet details by ID' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @HttpCode(200)
    @Post('transactions')
    async findOneWalletWithTransactions(@Headers('wallet-id') id: string) {
        return this.walletService.findOneWalletWithTransactions(id);
    }

    // Pay from Wallet (REGULAR) to Wallet (MASTER)
    @ApiTags('Wallet-Transaction')
    @ApiResponse({ status: 201, description: 'Amount paid to Master Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: PayToMasterDto })
    @Post('pay')
    async payToMasterWallet(
        @Headers('user-wallet-id') user_wallet_id: string,
        @Body() payToMasterDto: PayToMasterDto) {
        return this.walletService.payToMasterWallet({ user_wallet_id }, payToMasterDto);
    }


}
