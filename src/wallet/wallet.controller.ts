import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WalletCreateDto } from './dto/wallet.createDto.dto';
import { WalletUpdateDto } from './dto/wallet.updateDto.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {

    constructor(
        private readonly walletService: WalletService,
    ) { }

    // Get all Wallets
    @ApiResponse({ status: 200, description: 'Get all Wallets in Array of Object' })
    @Get()
    async findAll() {
        return this.walletService.findAll();
    }

    // Get Wallet by ID
    @ApiResponse({ status: 200, description: 'Get Wallet details by ID' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.walletService.findOne(id);
    }

    // Create One Wallet 
    @ApiResponse({ status: 201, description: 'Wallet created successfully' })
    @ApiResponse({ status: 409, description: 'Wallet already exist' })
    @ApiBody({ type: WalletCreateDto })
    @Post()
    async create(@Body() walletCreateDto: WalletCreateDto) {
        return this.walletService.create(walletCreateDto);
    }

    // Update Wallet by ID
    @ApiResponse({ status: 204, description: 'Wallet updated successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @ApiBody({ type: WalletUpdateDto })
    @Put(':id')
    async update(@Param('id') id: string, @Body() walletUpdateDto: WalletUpdateDto) {
        return this.walletService.update(id, walletUpdateDto);
    }

    // Delete One Wallet by ID
    @ApiResponse({ status: 200, description: 'Wallet deleted successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.walletService.delete(id);
    }

}
