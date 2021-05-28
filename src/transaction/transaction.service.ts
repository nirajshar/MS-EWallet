import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionCreateDto } from './dto/transaction.createDto.dto';
import { TransactionEntity } from './entity/transaction.entity';
import { toTransactionDto } from './mapper/toTransactionDto.dto';
import * as crypto from 'crypto';
import { TransactionDepositCreateDto } from './dto/transactionDeposit.createDto';
import { BankEntity } from './entity/bank.entity';
import { AccountingCreateDto } from './dto/accounting.createDto.dto';



@Injectable()
export class TransactionService {

    constructor(
        @InjectRepository(TransactionEntity) private readonly transactionRepository: Repository<TransactionEntity>,
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

    async depositToRegularTransaction(transactionDepositCreateDto: TransactionDepositCreateDto): Promise<object> {

        const { currency, amount, txn_type, txn_description } = transactionDepositCreateDto;
        const { userWallet } = transactionDepositCreateDto;
        const { bank_name, bank_ifsc, account_holder_name, account_no, utr_no } = transactionDepositCreateDto.bank;

        let uuid, transactionCreated, bankCreated: any;

        if (utr_no === '' || utr_no === undefined || utr_no === null) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `UTR NO required !`
            }, HttpStatus.BAD_REQUEST);
        }

        const utrExists = await this.bankRepository.findOne({ where: { utr_no } });

        if (utrExists) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `UTR already processed !`
            }, HttpStatus.CONFLICT);
        }

        uuid = await uuidv4()

        const { gen_uuid, txn_id } = await this._getUniqueTransaction();

        const bankCreatOne = await this.bankRepository.create({
            uuid: uuid,
            bank_name: bank_name,
            bank_ifsc: bank_ifsc,
            account_holder_name: account_holder_name,
            account_no: account_no,
            utr_no: utr_no
        })

        bankCreated = await this.bankRepository.save(bankCreatOne);

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const transaction: TransactionEntity = await this.transactionRepository.create({
            uuid: gen_uuid,
            txn_id,
            currency,
            amount,
            txn_type,
            txn_description,
            bank: bankCreated,
            wallet: userWallet,
            UTR: UTR
        });

        transactionCreated = await this.transactionRepository.save(transaction);

        return {
            status: 'success',
            message: 'Transaction created successfully',
            data: {
                transaction: transactionCreated,
                UTR
            }
        }
    }

    async updateTransactionStatus(txn_uuid: string, txn_status: string): Promise<void> {

        await this.transactionRepository.update({ uuid: txn_uuid }, { txn_status: txn_status });
    }

    async payToMasterTransaction(transactionCreateDto: TransactionCreateDto): Promise<object> {

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const debitTransaction = await this._createTransaction({
            currency: transactionCreateDto.currency,
            amount: transactionCreateDto.amount,
            txn_description: transactionCreateDto.txn_description,
            wallet: transactionCreateDto.userWallet,
            UTR: UTR,
            txn_type: 'DEBIT'
        });

        const creditTransaction = await this._createTransaction({
            currency: transactionCreateDto.currency,
            amount: transactionCreateDto.amount,
            txn_description: transactionCreateDto.txn_description,
            wallet: transactionCreateDto.masterWallet,
            UTR,
            txn_type: 'CREDIT'
        });

        return {
            status: 'success',
            message: 'Amount paid to master account from user account',
            data: {
                debitTransaction,
                creditTransaction,
                UTR
            }
        }

    }

    // Private methods (START) ---------------------------------------------------------
    private async _createTransaction(accountingCreateDto: AccountingCreateDto): Promise<object> {

        const { currency, amount, txn_description, txn_type, UTR } = accountingCreateDto;
        const { wallet } = accountingCreateDto

        const Txn = await this._getUniqueTransaction();

        const transaction: TransactionEntity = await this.transactionRepository.create({
            uuid: Txn.gen_uuid,
            txn_id: Txn.txn_id,
            currency,
            amount,
            txn_type: txn_type,
            txn_description,
            wallet: wallet,
            UTR: UTR
        });

        const transactionCreated = await this.transactionRepository.save(transaction);
        
        return transactionCreated
    }
    // Private methods (END) -----------------------------------------------------------

    async getTransactionFromUTRWallet(UTR: string, user_wallet_id: string, master_wallet_id: string) {

        if (UTR === '' || UTR === undefined || UTR === null) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `UTR NO required !`
            }, HttpStatus.BAD_REQUEST);
        }

        const debitTransaction = await this.transactionRepository.findOne({
            where: {
                UTR: UTR,
                txn_type: 'DEBIT',
                wallet: user_wallet_id
            }
        });

        if (!debitTransaction) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: `Debit Transaction not found !`
            }, HttpStatus.NOT_FOUND);
        }

        if (debitTransaction.is_refund) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `Transaction already refunded !`
            }, HttpStatus.BAD_REQUEST);
        }

        const creditTransaction = await this.transactionRepository.findOne({
            where: {
                UTR: UTR,
                txn_type: 'CREDIT',
                wallet: master_wallet_id
            }
        });

        if (!debitTransaction) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: `Credit Transaction not found !`
            }, HttpStatus.NOT_FOUND);
        }


        if (debitTransaction.amount !== creditTransaction.amount) {
            if (!debitTransaction) {
                throw new HttpException({
                    status: HttpStatus.CONFLICT,
                    message: `Debit/Credit Transaction amount mismatch !`
                }, HttpStatus.CONFLICT);
            }
        }

        return {
            debitTransaction,
            creditTransaction
        }

    }
    
    async updateUTRRefundStatus(UTR: string, is_refund: boolean): Promise<void> {
        await this.transactionRepository.update({ UTR: UTR }, { is_refund: is_refund });
    }

    async refundTransaction(transactionCreateDto: TransactionCreateDto) {

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const debitTransaction = await this._createTransaction({
            currency: transactionCreateDto.currency,
            amount: transactionCreateDto.amount,
            txn_description: transactionCreateDto.txn_description,
            wallet: transactionCreateDto.masterWallet,
            UTR: UTR,
            txn_type: 'REFUND:DEBIT'
        });

        const creditTransaction = await this._createTransaction({
            currency: transactionCreateDto.currency,
            amount: transactionCreateDto.amount,
            txn_description: transactionCreateDto.txn_description,
            wallet: transactionCreateDto.userWallet,
            UTR,
            txn_type: 'REFUND:CREDIT'
        });

        return {
            status: 'success',
            message: 'Amount paid to user account from master account',
            data: {
                debitTransaction,
                creditTransaction,
                UTR
            }
        }

    }



}
