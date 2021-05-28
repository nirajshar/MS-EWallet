import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemEntity } from 'src/system/entity/system.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { WalletCreateDto } from './dto/wallet.createDto.dto';
import { WalletUpdateDto } from './dto/wallet.updateDto.dto';
import { WalletEntity } from './entity/wallet.entity';
import { toWalletDto } from './mapper/toWalletDto.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { DepositToUserDto } from './dto/depositToUserDto.dto';
import { toWalletTransactionBankDto } from './mapper/toWalletTransactionBankDto.dto';
import { PayToMasterDto } from './dto/PayToMasterDto.dto';


@Injectable()
export class WalletService {

    constructor(
        @InjectRepository(WalletEntity) private readonly walletRepository: Repository<WalletEntity>,
        @InjectRepository(SystemEntity) private readonly systemRepository: Repository<SystemEntity>,
        private readonly userService: UserService,
        private readonly transactionService: TransactionService
    ) { }

    private readonly logger = new Logger(WalletService.name);

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

    async create(walletCreateDto: WalletCreateDto, wallet_user_type: string = 'REGULAR'): Promise<object> {

        const { currency, status, system_id } = walletCreateDto;
        const { mobile } = walletCreateDto.user;
        const wallet_type = 'closed';

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
            system,
            wallet_user_type
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
            wallet_type: wallet_type != '' ? wallet_type : walletExists.wallet_type,
            status: status != walletExists.status && status !== undefined ? status : walletExists.status
        });

        if (walletUpdateDto.hasOwnProperty('user')) {
            await this.userService.updateOne(walletExists.user.uuid, walletUpdateDto.user)
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

    // Private function
    private _zeroPad(num, numZeros = 16) {
        var n = Math.abs(num);
        var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
        var zeroString = Math.pow(10, zeros).toString().substr(1);
        if (num < 0) {
            zeroString = '-' + zeroString;
        }

        return zeroString + n;
    }


    // Deposit from Bank (USER) to Wallet (REGULAR) 
    async depositToUserWallet(destination_wallet_id: string, depositToUserDto: DepositToUserDto) {

        const { amount, txn_description } = depositToUserDto;
        const { bank_name, bank_ifsc, account_holder_name, account_no, utr_no } = depositToUserDto.bank;

        if (Math.sign(amount) !== 1) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `Amount Invalid !`
            }, HttpStatus.BAD_REQUEST);
        }

        let transaction: any;

        const destinationWallet = await this.walletRepository.findOne({ where: { id: destination_wallet_id, wallet_user_type: 'REGULAR' } });

        if (!destinationWallet) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Wallet not found !`
            }, HttpStatus.CONFLICT);
        }

        transaction = await this.transactionService.depositToRegularTransaction({
            currency: destinationWallet.currency,
            amount: Math.abs(amount),
            txn_type: 'CREDIT',
            txn_description: txn_description,
            destinationWallet: destinationWallet,
            bank: {
                bank_name,
                bank_ifsc,
                account_holder_name,
                account_no,
                utr_no
            }
        });

        destinationWallet.balance = parseFloat(destinationWallet.balance.toFixed(2)) + parseFloat(amount.toFixed(2));
        await this.walletRepository.save(destinationWallet);

        await this.transactionService.updateTransactionStatus(transaction.data.transaction.uuid, 'SUCCESS');

        let walletUpdated = await this.walletRepository.findOne({
            where: {
                id: destination_wallet_id,
                wallet_user_type: 'REGULAR'
            },
            relations: ['user', 'system', 'transactions', 'transactions.bank']
        });

        return {
            status: 'success',
            message: 'Amount deposited in wallet successfully',
            data: {
                UTR: transaction.data.UTR
            }
        }

    }

    // FindOne Wallet with All Transactions
    async findOneWalletWithTransactions(id: string) {

        const walletTransactionBank = await this.walletRepository.findOne({
            where: { id },
            relations: ['user', 'system', 'transactions', 'transactions.bank']
        })

        if (!walletTransactionBank) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found'
            }, HttpStatus.NOT_FOUND)
        }

        return toWalletTransactionBankDto(walletTransactionBank);
    }

    // Pay from Wallet (REGULAR) to Wallet (MASTER)   
    async payToMasterWallet(accounts, payToMasterDto: PayToMasterDto) {

        const { source_wallet_id, destination_wallet_id } = accounts;
        const { amount, txn_description } = payToMasterDto;

        let transaction: any;

        const sourceWallet = await this.walletRepository.findOne({
            where: {
                id: source_wallet_id,
                wallet_user_type: 'REGULAR'
            },
            relations: ['system']
        });

        if (!sourceWallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Source wallet not found !'
            }, HttpStatus.NOT_FOUND);
        }

        const systemSourceWallet = await this.systemRepository.findOne({ where: { id: sourceWallet.system.id } });

        if (!systemSourceWallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System for Source wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const masterWalletSystem = await this.walletRepository.findOne({
            where: {
                system: systemSourceWallet.id,
                wallet_user_type: 'MASTER'
            }
        })

        if (masterWalletSystem.id !== destination_wallet_id) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Master wallet not associated with Source wallet !`
            }, HttpStatus.CONFLICT);
        }

        const destinationWallet = await this.walletRepository.findOne({
            where: {
                id: destination_wallet_id,
                wallet_user_type: 'MASTER'
            }
        });

        if (!destinationWallet) {
            throw new HttpException({
                status: HttpStatus.NOT_ACCEPTABLE,
                message: `Master wallet not found !`
            }, HttpStatus.NOT_ACCEPTABLE);
        }

        if (sourceWallet.balance < amount) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Wallet balance insufficient !`
            }, HttpStatus.CONFLICT);
        }

        transaction = await this.transactionService.payToMasterTransaction({
            currency: sourceWallet.currency,
            amount: amount,
            txn_description: txn_description,
            sourceWallet: sourceWallet,
            destinationWallet: destinationWallet
        });

        sourceWallet.balance = parseFloat(sourceWallet.balance.toFixed(2)) - parseFloat(amount.toFixed(2));
        destinationWallet.balance = parseFloat(destinationWallet.balance.toFixed(2)) + parseFloat(amount.toFixed(2));
        await this.walletRepository.save(sourceWallet);
        await this.walletRepository.save(destinationWallet);
        await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'SUCCESS');
        await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'SUCCESS');

        return {
            status: 'success',
            message: 'Amount paid to master account from source account',
            data: {
                UTR: transaction.data.UTR
            }
        }
    }





}
