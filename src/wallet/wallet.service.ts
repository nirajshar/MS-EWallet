import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemEntity } from 'src/system/entity/system.entity';
import { UserUpdateDto } from './dto/user.updateDto.dto';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { WalletCreateDto } from './dto/wallet.createDto.dto';
import { WalletUpdateDto } from './dto/wallet.updateDto.dto';
import { WalletEntity } from './entity/wallet.entity';
import { toWalletDto } from './mapper/toWalletDto.dto';

@Injectable()
export class WalletService {

    constructor(
        @InjectRepository(WalletEntity) private readonly walletRepository: Repository<WalletEntity>,
        @InjectRepository(SystemEntity) private readonly systemRepository: Repository<SystemEntity>,
        private readonly userService: UserService
    ) { }

    async findAll(): Promise<Array<object>> {
        const wallets = await this.walletRepository.find({ relations: ['system', 'user'] });
        return wallets.map(wallet => toWalletDto(wallet));
    }

    async findOne(id: string): Promise<object> {

        const wallet = await this.walletRepository.findOne({ where: { id }, relations: ['system', 'user'] });

        if (!wallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found'
            }, HttpStatus.NOT_FOUND)
        }

        return toWalletDto(wallet);
    }

    async create(walletCreateDto: WalletCreateDto): Promise<object> {

        const { currency, wallet_type, status, system_id } = walletCreateDto;
        const { mobile } = walletCreateDto.user;

        let user = await this.userService.findOne({ where: { mobile: mobile } });

        if (!user) {
            user = await this.userService.create({
                name: walletCreateDto.user.name,
                mobile: walletCreateDto.user.mobile,
                email: walletCreateDto.user.email,
                status: walletCreateDto.user.status
            });
        }

        user = await this.userService.findOne({ where: { mobile: mobile } });

        const userWalletExists = await this.walletRepository.findOne({ where: { user: user }, relations: ['system'] });

        if (userWalletExists) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `User wallet already exists !`
            }, HttpStatus.CONFLICT);
        }

        const system = await this.systemRepository.findOne({ where: { id: system_id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: `System not found !`
            }, HttpStatus.NOT_FOUND);
        }

        let lastAccountNo = await this.walletRepository.findOne({
            where: {
                system: system_id
            },
            order: {
                createdAt: 'DESC'
            },
            relations: ['system']
        });

        // console.log(lastAccountNo);
        const account_prefix = system.account_prefix;
        const acc_num = lastAccountNo && lastAccountNo.hasOwnProperty('account_actual') ? lastAccountNo.account_actual : '';
        const account_actual = await (this._zeroPad(Number(acc_num) + 1, 16)).toString();
        const account_no = system.account_prefix + account_actual;

        const wallet: WalletEntity = await this.walletRepository.create({
            user,
            account_prefix,
            account_actual,
            account_no,
            currency,
            wallet_type,
            status,
            system
        });

        let walletCreated = await this.walletRepository.save(wallet);

        return {
            status: 'success',
            message: 'Wallet created successfully',
            data: {
                wallet: toWalletDto(walletCreated)
            }

        };
    }

    async update(id: string, walletUpdateDto: WalletUpdateDto): Promise<object> {

        const { wallet_type, status } = walletUpdateDto

        const walletExists = await this.walletRepository.findOne({ where: { id }, relations: ['system', 'user'] });

        if (!walletExists) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        await this.walletRepository.update({ id }, {
            wallet_type: wallet_type,
            status: status
        });

        if(walletUpdateDto.hasOwnProperty('user')) {
            await this.userService.updateOne( walletExists.user.uuid , walletUpdateDto.user)
        }

        let walletUpdated = await this.walletRepository.findOne({ where: { id }, relations: ['system', 'user'] });

        return {
            status: 'success',
            message: 'Wallet updated successfully',
            data: {
                wallet: toWalletDto(walletUpdated)
            }
        }

    }

    async delete(id: string): Promise<object> {

        const wallet: WalletEntity = await this.walletRepository.findOne({ where: { id }, relations: ['system', 'user'] });

        if (!wallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found !'
            }, HttpStatus.NOT_FOUND);
        }

        await this.walletRepository.delete({ id });

        return {
            status: HttpStatus.NO_CONTENT,
            message: 'Wallet deleted successfully',
            data: {
                wallet: toWalletDto(wallet)
            }
        };
    }

    private _zeroPad(num, numZeros = 16) {
        var n = Math.abs(num);
        var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
        var zeroString = Math.pow(10, zeros).toString().substr(1);
        if (num < 0) {
            zeroString = '-' + zeroString;
        }

        return zeroString + n;
    }
}
