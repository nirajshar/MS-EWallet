import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionCreateDto } from './dto/transaction.createDto.dto';
import { TransactionEntity } from './entity/transaction.entity';
import { toTransactionDto } from './mapper/toTransactionDto.dto';
import * as crypto from 'crypto';
import { TransactionDepositCreateDto } from './dto/transactionDeposit.createDto';
import { BankEntity } from './entity/bank.entity';
import { AccountingCreateDto } from './dto/accounting.createDto.dto';
import { WithdrawCreateTransactionDto } from './dto/withdraw.createDto.dto';
import { BankCreateDto } from './dto/bank.createDto.dto';
import { UpdateWithdrawDto } from 'src/wallet/dto/wallet-transaction/updateWithdrawDto.dto';
import { WalletEntity } from 'src/wallet/entity/wallet.entity';



@Injectable()
export class TransactionService {

    constructor(
        @InjectRepository(TransactionEntity) private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(BankEntity) private readonly bankRepository: Repository<BankEntity>,
        private readonly connection: Connection
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
        const { utr_no } = transactionDepositCreateDto.bank;

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

        const bankCreated: BankEntity = await this._createBank(transactionDepositCreateDto.bank)

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const transactionCreated = await this._createTransaction({
            currency,
            amount,
            txn_type,
            txn_description,
            bank: bankCreated,
            wallet: userWallet,
            UTR: UTR
        });

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
        const { bank } = accountingCreateDto

        const Txn = await this._getUniqueTransaction();

        const transaction: TransactionEntity = await this.transactionRepository.create({
            uuid: Txn.gen_uuid,
            txn_id: Txn.txn_id,
            currency,
            amount,
            txn_type: txn_type,
            txn_description,
            bank: bank ? bank : null,
            wallet: wallet,
            UTR: UTR,
            previous_balance: wallet.balance
        });

        const transactionCreated = await this.transactionRepository.save(transaction);

        return transactionCreated
    }

    private async _createBank(bankCreateDto: BankCreateDto) {

        const { bank_name, bank_ifsc, account_holder_name, account_no, utr_no } = bankCreateDto;

        const uuid = await uuidv4()
        const bankCreatOne = await this.bankRepository.create({
            uuid: uuid,
            bank_name: bank_name,
            bank_ifsc: bank_ifsc,
            account_holder_name: account_holder_name,
            account_no: account_no,
            utr_no: utr_no !== '' ? utr_no : null
        })
        const bankCreated = await this.bankRepository.save(bankCreatOne);

        return bankCreated;
    }
    // Private methods (END) -----------------------------------------------------------

    // Functions to be strictly used in Wallet Service (START) -------------------------
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

        return {
            debitTransaction,
            creditTransaction
        }

    }

    async updateUTRRefundStatus(UTR: string, is_settled: boolean): Promise<void> {
        await this.transactionRepository.update({ UTR: UTR }, { is_settled: is_settled });
    }
    // Functions to be strictly used in Wallet Service (END) ---------------------------

    async refundRequest(transactionCreateDto: TransactionCreateDto) {

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const debitTransaction = await this._createTransaction({
            currency: transactionCreateDto.currency,
            amount: transactionCreateDto.amount,
            txn_description: transactionCreateDto.txn_description,
            wallet: transactionCreateDto.masterWallet,
            UTR: UTR,
            txn_type: 'REFUND:DEBIT'
        });

        return {
            status: 'success',
            message: 'Refund request Transaction generated successfully !',
            data: {
                debitTransaction,
                UTR
            }
        }

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

    async withdrawTransaction(withdrawCreateTransactionDto: WithdrawCreateTransactionDto) {

        const { currency, amount, txn_description } = withdrawCreateTransactionDto;
        const { userWallet } = withdrawCreateTransactionDto;

        const bankCreated: BankEntity = await this._createBank(withdrawCreateTransactionDto.bank)

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const transactionCreated = await this._createTransaction({
            currency,
            amount,
            txn_type: 'WITHDRAW:DEBIT',
            txn_description,
            bank: bankCreated,
            wallet: userWallet,
            UTR: UTR
        });

        return {
            status: 'success',
            message: 'Transaction created successfully',
            data: {
                transaction: transactionCreated
            }
        }
    }

    async getTransactionForApproval(UTR: string, txn_status: string, txn_type: string) {

        if (UTR === '' || UTR === undefined || UTR === null) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `UTR NO required !`
            }, HttpStatus.BAD_REQUEST);
        }

        const transaction = await this.transactionRepository.findOne({
            where: {
                UTR: UTR,
                txn_type: txn_type
            },
            relations: ['bank', 'wallet']
        })

        if (!transaction) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Transaction not found !'
            }, HttpStatus.NOT_FOUND)
        }
        
        return {
            status: 'success',
            message: 'Transaction fetched successfully',
            data: {
                transaction: transaction,
                UTR
            }
        }

    }

    async rejectTransaction(transaction: TransactionEntity, txn_status: string, txn_description: string, txn_type: string) {

        const transactionUpdate = await this.transactionRepository.update(
            { UTR: transaction.UTR },
            { txn_status: txn_status }
        )

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const transactionCreated = await this._createTransaction({
            currency: transaction.currency,
            amount: transaction.amount,
            txn_type: txn_type,
            txn_description: txn_type + ' : ' + txn_description,
            wallet: transaction.wallet,
            UTR: UTR
        });

        return {
            status: 'success',
            message: 'Transaction rejected successfully !',
            data: {
                transaction: transactionCreated
            }
        }

    }

    async approveTransaction(transaction: TransactionEntity, bank_id: number, txn_status: string, bank_utr_no: string, 
        transaction_type: string, userDebitTransaction: TransactionEntity = null, masterWallet: WalletEntity = null) {

        enum transactionTYPE {
            WITHDRAW = 'WITHDRAW',
            REFUND = 'REFUND',
            PAYTOMASTER = 'PAYTOMASTER'
        }

        if (!Object.values(transactionTYPE).includes(transaction_type as transactionTYPE)) {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Transaction Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        if (transaction_type === transactionTYPE.WITHDRAW) {

            const utr_Exist = await this.bankRepository.findOne({ utr_no: bank_utr_no });

            if (utr_Exist) {
                throw new HttpException({
                    status: HttpStatus.CONFLICT,
                    message: 'UTR NO already exists !'
                }, HttpStatus.CONFLICT);
            }

            const bankUTRUpdate = await this.bankRepository.update(
                { id: bank_id },
                { utr_no: bank_utr_no }
            );

            const transactionUpdate = await this.transactionRepository.update(
                { UTR: transaction.UTR },
                { txn_status: txn_status }
            )

            
            return {
                transactionUpdate,
                bankUTRUpdate
            }

        } else if (transaction_type === transactionTYPE.REFUND) {

            const creditTransactionCreated = await this._createTransaction({
                currency: userDebitTransaction.currency,
                amount: userDebitTransaction.amount,
                txn_type: 'REFUND:CREDIT',
                txn_description: 'REFUND:CREDIT' + ' : ' + transaction.txn_description,
                wallet: userDebitTransaction.wallet,
                UTR: transaction.UTR
            });

            const transactionUpdate = await this.transactionRepository.update(
                { UTR: transaction.UTR },
                { txn_status: txn_status }
            )            

            return {
                transactionUpdate,
                data: {
                    creditTransactionCreated
                }
            }

        } else if(transaction_type === transactionTYPE.PAYTOMASTER) {

            const creditTransaction = await this._createTransaction({
                currency: transaction.currency,
                amount: transaction.amount,
                txn_description: transaction.txn_description,
                wallet: masterWallet,
                UTR: transaction.UTR,
                txn_type: 'CREDIT'
            });

            const transactionUpdate = await this.transactionRepository.update(
                { UTR: transaction.UTR },
                { txn_status: txn_status }
            )            

            return {
                transactionUpdate,
                data: {
                    creditTransaction
                }
            }
    

        } else {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Transaction Type Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

    }

    async payToMasterRequestTransaction(transactionCreateDto: TransactionCreateDto): Promise<object> {

        const UTR = crypto.randomBytes(20).toString('hex').toUpperCase();

        const debitTransaction = await this._createTransaction({
            currency: transactionCreateDto.currency,
            amount: transactionCreateDto.amount,
            txn_description: transactionCreateDto.txn_description,
            wallet: transactionCreateDto.userWallet,
            UTR: UTR,
            txn_type: 'DEBIT'
        });

        return {
            status: 'success',
            message: 'Pay request generated successfully',
            data: {
                debitTransaction,
                UTR
            }
        }

    }

}
