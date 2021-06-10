import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { ApproverSystem } from './guard/approverSystem.guard';
import { SystemGuard } from './guard/system.guard';
import { WalletOfSystem } from './guard/walletOfSystem.guard';
import { WalletGuard } from './guard/wallet.guard';
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


    // Wallet Transactions (ADMIN) ----------------------------------------------------

    // Deposit Amount to Wallet (REGULAR) from BANK : INFRA-MGMT Access only
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Transaction created successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: DepositToUserDto })
    @UseGuards(WalletOfSystem, SystemGuard)
    @Post('deposit/neft')
    async depositNEFT(
        @Headers('user_wallet_id') user_wallet_id: string,
        @Headers('system_key') system_key: string,
        @Headers('system_token') system_token: string,
        @Body() depositToUserDto: DepositToUserDto) {
        return this.walletService.depositNEFT(user_wallet_id, depositToUserDto);
    }

    // Refund Approval/Rejection by Wallet (MASTER) : INFRA MGMT TEAM
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Refund Request Approved/Rejected successfully !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: UpdateRefundRequestDto })
    @UseGuards(SystemGuard, ApproverSystem)
    @Post('refund/approve')
    async updateRefundRequest(
        @Headers('system_key') system_key: string,
        @Headers('system_token') system_token: string,
        @Body() updateRefundRequestDto: UpdateRefundRequestDto) {
        return this.walletService.updateRefundRequest(updateRefundRequestDto);
    }

    // Withdraw Approval from Wallet (REGULAR) to BANK 
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Request Approved for Withdrawal & Deposited in User Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: UpdateWithdrawDto })
    @UseGuards(SystemGuard, ApproverSystem)
    @Post('withdraw/approve')
    async updateWithdrawRequest(       
        @Headers('system_key') system_key: string,
        @Headers('system_token') system_token: string,
        @Body() updateWithdrawDto: UpdateWithdrawDto) {
        return this.walletService.updateWithdrawRequest(updateWithdrawDto);
    }

    // Pay to Master Request for Wallet (REGULAR) from Wallet (MASTER) : INFRA MGMT TEAM
    @ApiTags('Wallet-Transaction-ADMIN')
    @ApiResponse({ status: 201, description: 'Pay to Master request generated successfully. Awaiting approval !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiResponse({ status: 400, description: 'Failed to generate Pay to Master request !' })
    @ApiBody({ type: PayToMasterDto })
    @UseGuards(SystemGuard)
    @Post('pay/request')
    async payToMasterRequest(
        @Headers('user_wallet_id') user_wallet_id: string,
        @Headers('system_key') system_key: string,
        @Headers('system_token') system_token: string,
        @Body() payToMasterDto: PayToMasterDto) {
        return this.walletService.payToMasterRequest(user_wallet_id, payToMasterDto);
    }

    // ADMIN : DIRECT 

    // Refund from Wallet (MASTER) to Wallet (REGULAR) : INFRA-MGMT Access only
    @ApiTags('Wallet-Transaction-ADMIN : Direct')
    @ApiResponse({ status: 201, description: 'Amount paid to User Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: RefundTransactionDto })
    @UseGuards(SystemGuard)
    @Post('refund-direct')
    async refundTransaction(
        @Headers('system_key') system_key: string,
        @Headers('system_token') system_token: string,
        @Body() refundTransaction: RefundTransactionDto) {
        return this.walletService.refundTransaction(refundTransaction);
    }

    // Wallet Transactions (COMMON) ----------------------------------------------------

    // Get Wallet with All Transactions
    @ApiTags('Wallet-Transaction-COMMON')
    @ApiResponse({ status: 200, description: 'Get Wallet details by ID' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @HttpCode(200)
    @UseGuards(WalletGuard)
    @Post('transactions')
    async findOneWalletWithTransactions(
        @Headers('account_no') account_no: string,
        @Headers('token') token: string) {
        return this.walletService.findOneWalletWithTransactions(account_no);
    }

    // Wallet Transactions (USER) ----------------------------------------------------

    // Pay from Wallet (REGULAR) to Wallet (MASTER)
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Amount paid to Master Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: PayToMasterDto })
    @UseGuards(WalletGuard)
    @Post('pay')
    async payToMasterWallet(
        @Headers('account_no') account_no: string,
        @Headers('token') token: string,
        @Body() payToMasterDto: PayToMasterDto) {
        return this.walletService.payToMasterWallet(account_no, payToMasterDto);
    }

    // Refund Request by Wallet (REGULAR) from Wallet (MASTER) 
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Refund request generated successfully. Awaiting approval !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiResponse({ status: 400, description: 'Failed to generate Refund request !' })
    @ApiBody({ type: RefundRequestDto })
    @UseGuards(WalletGuard)
    @Post('refund/request')
    async refundRequest(
        @Headers('account_no') account_no: string,
        @Headers('token') token: string,
        @Body() refundRequestDto: RefundRequestDto) {
        return this.walletService.refundRequest(account_no, refundRequestDto);
    }    

    // Withdraw Request from Wallet (REGULAR) to BANK 
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Request for Withdrawal Initiated from User Account' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: WithdrawFromRegularDto })
    @UseGuards(WalletGuard)
    @Post('withdraw/request')
    async withdrawRequest(
        @Headers('account_no') account_no: string,
        @Headers('token') token: string,
        @Body() withdrawFromRegularDto: WithdrawFromRegularDto) {
        return this.walletService.withdrawRequest(account_no, withdrawFromRegularDto);
    }   

    // Pay to Master Approval/Rejection by Wallet (REGULAR) 
    @ApiTags('Wallet-Transaction-USER')
    @ApiResponse({ status: 201, description: 'Refund Request Approved/Rejected successfully !' })
    @ApiResponse({ status: 404, description: 'Wallet not found !' })
    @ApiBody({ type: UpdatePayToMasterRequestDto })
    @UseGuards(WalletGuard)
    @Post('pay/approve')
    async updatePayToMasterRequest(
        @Headers('account_no') account_no: string,
        @Headers('token') token: string,
        @Body() updatePayToMasterRequestDto: UpdatePayToMasterRequestDto) {
        return this.walletService.updatePayToMasterRequest(account_no, updatePayToMasterRequestDto);
    }

    
}
