import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SystemEntity } from './entity/system.entity';
import { toSystemDto } from './mapper/toSystemDto.dto';
import { CreateSystemDto } from './dto/createSystemDto.dto';
import { UpdateSystemDto } from './dto/updateSystemDto.dto';
import * as crypto from 'crypto';

@Injectable()
export class SystemService {

    constructor(
        @InjectRepository(SystemEntity) private readonly systemRepository: Repository<SystemEntity>,
    ) { }

    async findAll(): Promise<Array<object>> {
        const systems = await this.systemRepository.find();
        return systems;
    }

    async findOne(id: string): Promise<object> {
        const system = await this.systemRepository.findOne({ where: { id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System not found'
            }, HttpStatus.NOT_FOUND)
        }

        return toSystemDto(system);
    }

    async create(createSystemDto: CreateSystemDto): Promise<object> {

        const { app_name, app_description, key, whitelist_ip, status, account_prefix } = createSystemDto;

        const systemName = await this.systemRepository.findOne({ where: { app_name } });

        if (systemName) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `System with name : ${app_name} already exist`
            }, HttpStatus.CONFLICT);
        }

        const systemKey = await this.systemRepository.findOne({ where: { key } });

        if (systemKey) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `System with key : ${key} already exist`
            }, HttpStatus.CONFLICT);
        }

        const secret = crypto.randomBytes(20).toString('hex');
        // console.log(secret);

        const token = crypto.createHmac('sha256', secret).digest('hex');

        const system: SystemEntity = await this.systemRepository.create({
            app_name,
            app_description,
            key,
            token,
            whitelist_ip,
            status,
            account_prefix
        });

        let systemCreated = await this.systemRepository.save(system);

        return {
            status: 'success',
            message: 'System created successfully',
            system: toSystemDto(systemCreated)
        };
    }

    async update(id: string, updateSystemDto: UpdateSystemDto): Promise<object> {

        const { app_name, key } = updateSystemDto;

        const system = await this.systemRepository.findOne({ where: { id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System not found'
            }, HttpStatus.NOT_FOUND)
        }

        const systemName = await this.systemRepository.findOne({ where: { app_name: app_name, id : Not(id) } });

        if (systemName) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `System with name : ${app_name} already exists !`
            }, HttpStatus.CONFLICT);
        }

        const systemKey = await this.systemRepository.findOne({ where: { key: key, id: Not(id) } });

        if (systemKey) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `System with key : ${key} already exists !`
            }, HttpStatus.CONFLICT);
        }

        await this.systemRepository.update({ id }, updateSystemDto );
        
        let systemUpdated = await this.systemRepository.findOne({ where: { id } });

        return {
            status: 'success',
            message: 'System updated successfully',
            system: toSystemDto(systemUpdated)
        }

    }

    async delete(id: string): Promise<object> {

        const system: SystemEntity = await this.systemRepository.findOne({ where: { id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System not found'
            }, HttpStatus.NOT_FOUND);
        }

        await this.systemRepository.delete({ id });

        return {
            status: HttpStatus.OK,
            message: 'System deleted successfully',
            system: toSystemDto(system)
        };
    }

    // Update Access Token
    async generateNewAccessToken(id: string): Promise<object> {

        const system = await this.systemRepository.findOne({ where: { id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System not found'
            }, HttpStatus.NOT_FOUND)
        }

        const secret = crypto.randomBytes(20).toString('hex');
        // console.log(secret);

        const newToken = crypto.createHmac('sha256', secret).digest('hex');

        await this.systemRepository.update({ id }, { token: newToken });

        let systemUpdated = await this.systemRepository.findOne({ where: { id } });

        return {
            status: 'success',
            message: 'Access token updated successfully',
            system: toSystemDto(systemUpdated)
        }

    }

    // Get Access Token
    async getAccessToken(id: string): Promise<object> {

        const system = await this.systemRepository.findOne({ where: { id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System not found'
            }, HttpStatus.NOT_FOUND)
        }
       
        return {
            status: 'success',
            message: 'Access token fetched successfully',
            token: system.token
        }

    }

}
