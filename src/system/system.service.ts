import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Not, Repository } from 'typeorm';
import { SystemEntity } from './entity/system.entity';
import { toSystemDto } from './mapper/toSystemDto.dto';
import { CreateSystemDto } from './dto/createSystemDto.dto';
import { UpdateSystemDto } from './dto/updateSystemDto.dto';
import * as crypto from 'crypto';
import { WalletService } from 'src/wallet/wallet.service';
import { WalletEntity } from 'src/wallet/entity/wallet.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { WalletUpdateDto } from 'src/wallet/dto/wallet.updateDto.dto';

@Injectable()
export class SystemService {

    constructor(
        @InjectRepository(SystemEntity) private readonly systemRepository: Repository<SystemEntity>,
        private readonly walletService: WalletService,
        private readonly userService: UserService,
    ) { }

    private readonly logger = new Logger(SystemService.name);

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
        const { mobile, email, currency } = createSystemDto;

        let systemCreated, walletCreated: any;

        const systemName = await this.systemRepository.findOne({ where: { app_name } });

        if (systemName) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `System with name : ${app_name} already exist`
            }, HttpStatus.CONFLICT);
        }

        const systemKey = await this.systemRepository.findOne({ where: { key: key.trim() } });

        if (systemKey) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `System with key : ${key} already exist`
            }, HttpStatus.CONFLICT);
        }



        try {

            const secret = crypto.randomBytes(20).toString('hex');
            // console.log(secret);

            const token = crypto.createHmac('sha256', secret).digest('hex');

            const system: SystemEntity = await this.systemRepository.create({
                app_name,
                app_description,
                key: key.trim(),
                token,
                whitelist_ip,
                status,
                account_prefix: account_prefix.trim()
            });

            systemCreated = await this.systemRepository.save(system);

            walletCreated = await this.walletService.create({
                user: {
                    name: app_name,
                    mobile: mobile,
                    email: email,
                    status: status
                },
                currency: currency,
                wallet_type: 'closed',
                status: status,
                system_id: system.id
            }, 'MASTER');

        } catch (err) {

            throw new HttpException({
                status: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Something went wrong',
            }, HttpStatus.SERVICE_UNAVAILABLE);

            this.logger.log(err);
        }

        return {
            status: 'success',
            message: 'System created successfully',
            data: {
                system: toSystemDto(systemCreated)
            }
        }
    }

    async update(id: string, updateSystemDto: UpdateSystemDto): Promise<object> {

        const { app_name, key } = updateSystemDto;
        const { mobile, email, currency, status } = updateSystemDto;


        // const system = await this.systemRepository.findOne({ where: { id } });
        const system = await getManager()
            .createQueryBuilder(SystemEntity, 'S')
            .leftJoin(WalletEntity, 'W', 'S.id = W.system_id')
            .leftJoin(UserEntity, 'U', 'U.id = W.user_id')
            .addSelect("U.uuid")
            .addSelect("U.name")
            .addSelect("W.id")
            .where('S.id = :id', { id })
            .andWhere('W.wallet_user_type = :wallet_user_type', { wallet_user_type: 'MASTER' })
            .getRawOne();

        // console.log(system);

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System not found'
            }, HttpStatus.NOT_FOUND)
        }

        const systemName = await this.systemRepository.findOne({ where: { app_name: app_name, id: Not(id) } });

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

        try {

            let data = {
                user: {
                    name: app_name ? app_name : undefined,
                    mobile: mobile ? mobile : undefined,
                    email: email ? email : undefined,
                    status: [true,false].includes(status) ? status : undefined,
                },
                wallet_type: 'closed',
                status: [true,false].includes(status) ? status : undefined
            };

            data = JSON.parse(JSON.stringify(data));
            // Object.keys(data.user).forEach((k) => data.user[k] == null && delete data.user[k]);
            console.log(data);
            

            delete updateSystemDto.mobile;
            delete updateSystemDto.email;
            delete updateSystemDto.currency;


            await this.systemRepository.update({ id }, updateSystemDto);
            // console.log(system);

            await this.walletService.update(system.W_id, data);

        } catch (err) {
            throw new HttpException({
                status: HttpStatus.SERVICE_UNAVAILABLE,
                message: err,
            }, HttpStatus.SERVICE_UNAVAILABLE);

            this.logger.log(err);
        }

        let systemUpdated = await this.systemRepository.findOne({ where: { id } });

        return {
            status: 'success',
            message: 'System updated successfully',
            data: {
                system: toSystemDto(systemUpdated)
            }
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
            data: {
                system: toSystemDto(system)
            }
        }
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
