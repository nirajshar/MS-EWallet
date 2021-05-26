import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletEntity } from 'src/wallet/entity/wallet.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionCreateDto } from './dto/transaction.createDto.dto';
import { TransactionEntity } from './entity/transaction.entity';
import { toTransactionDto } from './mapper/toTransactionDto.dto';
import * as crypto from 'crypto';
import { TransactionDepositCreateDto } from './dto/transactionDeposit.createDto';
import { BankEntity } from './entity/bank.entity';



@Injectable()
export class TransactionService {

    constructor(
        @InjectRepository(TransactionEntity) private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(WalletEntity) private readonly walletRepository: Repository<WalletEntity>,
        @InjectRepository(BankEntity) private readonly bankRepository: Repository<BankEntity>,
    ) { }

    private readonly logger = new Logger(TransactionService.name);

    async findAll(): Promise<Array<object>> {
        const transactions = await this.transactionRepository.find();
        return transactions.map(transaction => toTransactionDto(transaction));
    }

    async findOne(id: string): Promise<object> {

        const transaction = await this.transactionRepository.findOne({ where: { id } });

        if (!transaction) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Transaction not found'
            }, HttpStatus.NOT_FOUND)
        }

        return toTransactionDto(transaction);
    }

    async payToMasterTransaction(transactionCreateDto: TransactionCreateDto): Promise<object> {

        const { currency, amount, txn_type, txn_description, source_wallet_id, destination_wallet_id } = transactionCreateDto;

        const { gen_uuid, txn_id } = await this._getUniqueTransaction();

        const sourceWallet = await this.walletRepository.findOne({ where: { id: source_wallet_id } });

        if (!sourceWallet) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Source wallet not found !`
            }, HttpStatus.CONFLICT);
        }

        const destinationWallet = await this.walletRepository.findOne({ where: { id: destination_wallet_id } });

        if (!destinationWallet) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Destination wallet not found !`
            }, HttpStatus.CONFLICT);
        }

        const transaction: TransactionEntity = await this.transactionRepository.create({
            uuid: gen_uuid,
            txn_id,
            currency,
            amount,
            txn_type,
            txn_description,
            source_wallet: sourceWallet,
            destination_wallet: destinationWallet
        });

        let transactionCreated = await this.transactionRepository.save(transaction);

        return {
            status: 'success',
            message: 'Transaction created successfully',
            data: {
                transaction: toTransactionDto(transactionCreated)
            }
        }

    }

    private async _getUniqueTransaction(): Promise<{ gen_uuid, txn_id }> {

        let uuid = await uuidv4()
        let txn_id = await crypto.randomBytes(20).toString('hex');

        const transactionExists = await this.transactionRepository.findOne({
            where: [
                { uuid: uuid },
                { txn_id: txn_id }
            ]
        });

        if (transactionExists) {
            await this._getUniqueTransaction()
        }

        return {
            gen_uuid: uuid,
            txn_id: txn_id
        }
    }

    async depositToUserTransaction(transactionDepositCreateDto: TransactionDepositCreateDto): Promise<object> {

        const { currency, amount, txn_type, txn_description, destination_wallet_id } = transactionDepositCreateDto;
        const { bank_name, bank_ifsc, account_holder_name, account_no } = transactionDepositCreateDto.bank;

        let uuid, transactionCreated, bankCreated: any;

        const destinationWallet = await this.walletRepository.findOne({ where: { id: destination_wallet_id, wallet_user_type: 'REGULAR' } });

        if (!destinationWallet) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Destination wallet not found !`
            }, HttpStatus.CONFLICT);
        }

        uuid = await uuidv4()

        const { gen_uuid, txn_id } = await this._getUniqueTransaction();

        try {

            const bankCreatOne = await this.bankRepository.create({
                uuid: uuid,
                bank_name: bank_name,
                bank_ifsc: bank_ifsc,
                account_holder_name: account_holder_name,
                account_no: account_no
            })

            bankCreated = await this.bankRepository.save(bankCreatOne);

            const transaction: TransactionEntity = await this.transactionRepository.create({
                uuid: gen_uuid,
                txn_id,
                currency,
                amount,
                txn_type,
                txn_description,
                bank: bankCreated,
                destination_wallet: destinationWallet,
                wallet: destinationWallet
            });

            transactionCreated = await this.transactionRepository.save(transaction);

        } catch (err) {
            throw new HttpException({
                status: HttpStatus.SERVICE_UNAVAILABLE,
                message: err,
            }, HttpStatus.SERVICE_UNAVAILABLE);

            this.logger.log(err);
        }

        return {
            status: 'success',
            message: 'Transaction created successfully',
            data: {
                transaction: toTransactionDto(transactionCreated)
            }
        }
    }

    async updateTransactionStatus(txn_id: number, txn_status: string): Promise<void>{
        const transaction_status = await this.transactionRepository.update({id: txn_id}, {
            txn_status: txn_status
        });
    }

}
