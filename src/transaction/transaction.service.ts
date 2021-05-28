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
        const { destinationWallet } = transactionDepositCreateDto;
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
            wallet: destinationWallet,
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

        const debitTransaction = await this._debit(transactionCreateDto, UTR);
        const creditTransaction = await this._credit(transactionCreateDto, UTR);

        return {
            status: 'success',
            message: 'Amount paid to master account from source account',
            data: {
                debitTransaction,
                creditTransaction,
                UTR
            }
        }

    }


    private async _debit(transactionCreateDto: TransactionCreateDto, UTR: string): Promise<object> {

        const { currency, amount, txn_description } = transactionCreateDto;
        const { sourceWallet } = transactionCreateDto

        const debitTxn = await this._getUniqueTransaction();

        const debitTransaction: TransactionEntity = await this.transactionRepository.create({
            uuid: debitTxn.gen_uuid,
            txn_id: debitTxn.txn_id,
            currency,
            amount,
            txn_type: 'DEBIT',
            txn_description,
            wallet: sourceWallet,
            UTR: UTR
        });

        const debitTransactionCreated = await this.transactionRepository.save(debitTransaction);

        return debitTransactionCreated
    }


    private async _credit(transactionCreateDto: TransactionCreateDto, UTR: string): Promise<object> {

        const { currency, amount, txn_description } = transactionCreateDto;
        const { destinationWallet } = transactionCreateDto

        const creditTxn = await this._getUniqueTransaction();

        const creditTransaction: TransactionEntity = await this.transactionRepository.create({
            uuid: creditTxn.gen_uuid,
            txn_id: creditTxn.txn_id,
            currency,
            amount,
            txn_type: 'CREDIT',
            txn_description,
            wallet: destinationWallet,
            UTR: UTR
        });

        const creditTransactionCreated = await this.transactionRepository.save(creditTransaction);

        return creditTransactionCreated;
    }


}
