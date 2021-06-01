import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepositToUserDto } from './dto/wallet-transaction/depositToUserDto.dto';
import { PayToMasterDto } from './dto/wallet-transaction/payToMasterDto.dto';
import { RefundRequestDto } from './dto/wallet-transaction/refundRequestDto.dto';
import { RefundTransactionDto } from './dto/wallet-transaction/refundTransactionDto.dto';
import { UpdatePayToMasterRequestDto } from './dto/wallet-transaction/updatePayToMasterRequestDto.dto';
import { UpdateRefundRequestDto } from './dto/wallet-transaction/updateRefundRequestDto.dto';
import { UpdateWithdrawDto } from './dto/wallet-transaction/updateWithdrawDto.dto';
import { WithdrawFromRegularDto } from './dto/wallet-transaction/withdrawFromRegularDto.dto';
import { WalletCreateDto } from './dto/wallet/wallet.createDto.dto';
import { WalletUpdateDto } from './dto/wallet/wallet.updateDto.dto';
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


    // Wallet Access Token (START) ----------------------------------------------------
    
    // Update Access Token    
    @ApiTags('Wallet-Access')
    @ApiResponse({ status: 204, description: 'Wallet access updated successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @Post('access-key/generate/:id')
    async generateNewAccessToken(@Param('id') id: string) {
        return this.walletService.generateWalletAccessToken(id);
    }

    // Get Access Token
    @ApiTags('Wallet-Access')
    @ApiResponse({ status: 204, description: 'Wallet Access fetched successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @Get('access-key/:id')
    async getAccessToken(@Param('id') id: string) {
        return this.walletService.getWalletAccessToken(id);
    }
    
    // Wallet Access Token (START) ----------------------------------------------------


    // Wallet Transactions ---------------------------------------------------------

    // Deposit Amount to Wallet (REGULAR) from BANK : INFRA-MGMT Access onlt
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Transaction created successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: DepositToUserDto })
    @Post('deposit/neft')
    async depositNEFT(
        @Headers('user-wallet-id') user_wallet_id: string,
        @Body() depositToUserDto: DepositToUserDto) {
        return this.walletService.depositNEFT(user_wallet_id, depositToUserDto);
    }

    // Get Wallet with All Transactions
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 200, description: 'Get Wallet details by ID' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @HttpCode(200)
    @Post('transactions')
    async findOneWalletWithTransactions(@Headers('wallet-id') id: string) {
        return this.walletService.findOneWalletWithTransactions(id);
    }

    // Pay from Wallet (REGULAR) to Wallet (MASTER)
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Amount paid to Master Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: PayToMasterDto })
    @Post('pay')
    async payToMasterWallet(
        @Headers('user-wallet-id') user_wallet_id: string,
        @Body() payToMasterDto: PayToMasterDto) {
        return this.walletService.payToMasterWallet(user_wallet_id, payToMasterDto);
    }

    // Refund Request by Wallet (REGULAR) from Wallet (MASTER) 
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Refund request generated successfully. Awaiting approval !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiResponse({ status: 400, description: 'Failed to generate Refund request !' })
    @ApiBody({ type: RefundRequestDto })
    @Post('refund/request')
    async refundRequest(
        @Headers('user_wallet_id') user_wallet_id: string,
        @Body() refundRequestDto: RefundRequestDto) {
        return this.walletService.refundRequest(user_wallet_id, refundRequestDto);
    }

    // Refund Approval/Rejection by Wallet (MASTER) : INFRA MGMT TEAM
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Refund Request Approved/Rejected successfully !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: UpdateRefundRequestDto })
    @Post('refund/approve')
    async updateRefundRequest(@Body() updateRefundRequestDto: UpdateRefundRequestDto) {
        return this.walletService.updateRefundRequest(updateRefundRequestDto);
    }

    // Withdraw Request from Wallet (REGULAR) to BANK 
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Request for Withdrawal Initiated from User Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: WithdrawFromRegularDto })
    @Post('withdraw/request')
    async withdrawRequest(
        @Headers('user_wallet_id') user_wallet_id: string,
        @Body() withdrawFromRegularDto: WithdrawFromRegularDto) {
        return this.walletService.withdrawRequest(user_wallet_id, withdrawFromRegularDto);
    }

    // Withdraw Approval from Wallet (REGULAR) to BANK 
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Request Approved for Withdrawal & Deposited in User Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: UpdateWithdrawDto })
    @Post('withdraw/approve')
    async updateWithdrawRequest(@Body() updateWithdrawDto: UpdateWithdrawDto) {
        return this.walletService.updateWithdrawRequest(updateWithdrawDto);
    }

    // Pay to Master Request for Wallet (REGULAR) from Wallet (MASTER) : INFRA MGMT TEAM
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Pay to Master request generated successfully. Awaiting approval !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiResponse({ status: 400, description: 'Failed to generate Pay to Master request !' })
    @ApiBody({ type: PayToMasterDto })
    @Post('pay/request')
    async payToMasterRequest(
        @Headers('user_wallet_id') user_wallet_id: string,
        @Body() payToMasterDto: PayToMasterDto) {
        return this.walletService.payToMasterRequest(user_wallet_id, payToMasterDto);
    }

    // Pay to Master Approval/Rejection by Wallet (REGULAR) 
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Refund Request Approved/Rejected successfully !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: UpdatePayToMasterRequestDto })
    @Post('pay/approve')
    async updatePayToMasterRequest(@Body() updatePayToMasterRequestDto: UpdatePayToMasterRequestDto) {
        return this.walletService.updatePayToMasterRequest(updatePayToMasterRequestDto);
    }

    // --
    // Refund from Wallet (MASTER) to Wallet (REGULAR) : INFRA-MGMT Access only
    @ApiTags('Wallet-Transaction-ADMIN : Direct')
    @ApiResponse({ status: 201, description: 'Amount paid to User Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: RefundTransactionDto })
    @Post('refund-direct')
    async refundTransaction(@Body() refundTransaction: RefundTransactionDto) {
        return this.walletService.refundTransaction(refundTransaction);
    }
}
