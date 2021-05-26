import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSystemDto } from './dto/createSystemDto.dto';
import { UpdateSystemDto } from './dto/updateSystemDto.dto';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {

    constructor(
        private readonly systemService: SystemService
    ) { }

    // Get all Systems
    @ApiTags('System')
    @ApiResponse({ status: 200, description: 'Get all Systems in Array of Object' })
    @Get()
    async findAll() {
        return this.systemService.findAll();
    }

    // Get System by ID
    @ApiTags('System')
    @ApiResponse({ status: 200, description: 'Get System details by ID' })
    @ApiResponse({ status: 404, description: 'System not found' })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.systemService.findOne(id);
    }

    // Create One System 
    @ApiTags('System')
    @ApiResponse({ status: 201, description: 'System created successfully' })
    @ApiResponse({ status: 409, description: 'System already exist' })
    @Post()
    async create(@Body() createSystemDto: CreateSystemDto) {
        return this.systemService.create(createSystemDto);
    }

    // Update System by ID
    @ApiTags('System')
    @ApiBody({ type: UpdateSystemDto })
    @ApiResponse({ status: 204, description: 'System updated successfully' })
    @ApiResponse({ status: 404, description: 'System not found' })
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateSystemDto: UpdateSystemDto) {
        return this.systemService.update(id, updateSystemDto);
    }

    // Delete One System by ID
    @ApiTags('System')
    @ApiResponse({ status: 200, description: 'System deleted successfully' })
    @ApiResponse({ status: 404, description: 'System not found' })
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.systemService.delete(id);
    }

    
    // Update Access Token    
    @ApiTags('System-Access')
    @ApiResponse({ status: 204, description: 'System Access updated successfully' })
    @ApiResponse({ status: 404, description: 'System not found' })
    @Post('access-key/generate/:id')
    async generateNewAccessToken(@Param('id') id: string) {
        return this.systemService.generateNewAccessToken(id);
    }

    // Get Access Token
    @ApiTags('System-Access')
    @ApiResponse({ status: 204, description: 'System Access updated successfully' })
    @ApiResponse({ status: 404, description: 'System not found' })
    @Get('access-key/:id')
    async getAccessToken(@Param('id') id: string) {
        return this.systemService.getAccessToken(id);
    }

}
