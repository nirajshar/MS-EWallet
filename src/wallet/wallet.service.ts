import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemEntity } from 'src/system/entity/system.entity';
import { UserService } from 'src/user/user.service';
import { Connection, Repository } from 'typeorm';
import { WalletCreateDto } from './dto/wallet/wallet.createDto.dto';
import { WalletUpdateDto } from './dto/wallet/wallet.updateDto.dto';
import { WalletEntity } from './entity/wallet.entity';
import { toWalletDto } from './mapper/toWalletDto.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { DepositToUserDto } from './dto/wallet-transaction/depositToUserDto.dto';
import { toWalletTransactionBankDto } from './mapper/toWalletTransactionBankDto.dto';
import { PayToMasterDto } from './dto/wallet-transaction/payToMasterDto.dto';
import { RefundTransactionDto } from './dto/wallet-transaction/refundTransactionDto.dto';
import { WithdrawFromRegularDto } from './dto/wallet-transaction/withdrawFromRegularDto.dto';
import { UpdateWithdrawDto } from './dto/wallet-transaction/updateWithdrawDto.dto';
import { RefundRequestDto } from './dto/wallet-transaction/refundRequestDto.dto';
import { UpdateRefundRequestDto } from './dto/wallet-transaction/updateRefundRequestDto.dto';
import * as crypto from 'crypto';
import { UpdatePayToMasterRequestDto } from './dto/wallet-transaction/updatePayToMasterRequestDto.dto';



@Injectable()
export class WalletService {

    constructor(
        @InjectRepository(WalletEntity) private readonly walletRepository: Repository<WalletEntity>,
        @InjectRepository(SystemEntity) private readonly systemRepository: Repository<SystemEntity>,
        private readonly userService: UserService,
        private readonly transactionService: TransactionService,
        private readonly connection: Connection
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

        const secret = crypto.randomBytes(20).toString('hex');

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
            wallet_user_type,
            token: secret
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

    // Private functions (START) ----------------------------------------------------------
    private _zeroPad(num, numZeros = 16) {
        var n = Math.abs(num);
        var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
        var zeroString = Math.pow(10, zeros).toString().substr(1);
        if (num < 0) {
            zeroString = '-' + zeroString;
        }

        return zeroString + n;
    }

    private async _getWalletOrFail(wallet_id: string, wallet_user_type: string, from_system_id: string = null) {

        let wallet: WalletEntity;

        if (from_system_id) {

            wallet = await this.walletRepository.findOne({
                where: {
                    system: from_system_id,
                    wallet_user_type: wallet_user_type
                },
                relations: ['system']
            });

        } else {

            wallet = await this.walletRepository.findOne({
                where: {
                    id: wallet_id,
                    wallet_user_type: wallet_user_type
                },
                relations: ['system']
            });

        }

        if (!wallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found !'
            }, HttpStatus.NOT_FOUND);
        }

        if (!wallet.status) {
            throw new HttpException({
                status: HttpStatus.FORBIDDEN,
                message: 'Wallet disabled !'
            }, HttpStatus.FORBIDDEN);
        }

        return wallet;
    }
    // Private functions (END) ------------------------------------------------------------

    // Deposit [NEFT] from Bank (USER) to Wallet (REGULAR) 
    async depositNEFT(user_wallet_id: string, depositToUserDto: DepositToUserDto) {

        const { amount, txn_description } = depositToUserDto;
        const { bank_name, bank_ifsc, account_holder_name, account_no, utr_no } = depositToUserDto.bank;

        if (Math.sign(amount) !== 1) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `Amount Invalid !`
            }, HttpStatus.BAD_REQUEST);
        }

        let transaction: any;

        const userWallet = await this.walletRepository.findOne({ where: { id: user_wallet_id, wallet_user_type: 'REGULAR' } });

        if (!userWallet) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Wallet not found !`
            }, HttpStatus.CONFLICT);
        }

        transaction = await this.transactionService.depositToRegularTransaction({
            currency: userWallet.currency,
            amount: Math.abs(amount),
            txn_type: 'CREDIT',
            txn_description: 'NEFT : ' + txn_description,
            userWallet: userWallet,
            bank: {
                bank_name,
                bank_ifsc,
                account_holder_name,
                account_no,
                utr_no
            }
        });

        userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) + parseFloat(amount.toFixed(2));
        await this.walletRepository.save(userWallet);
        await this.transactionService.updateTransactionStatus(transaction.data.transaction.uuid, 'SUCCESS');

        return {
            status: 'success',
            message: 'Amount deposited in wallet successfully',
            data: {
                UTR: transaction.data.UTR
            }
        }

    }

    // FindOne Wallet with All Transactions
    async findOneWalletWithTransactions(account_no: string) {

        const walletTransactionBank = await this.walletRepository.findOne({
            where: { account_no },
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
    async payToMasterWallet(user_account_no: string, payToMasterDto: PayToMasterDto) {

        const userAccount = await this.walletRepository.findOne({ where: { account_no: user_account_no } })

        if (!userAccount) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'User account not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const { amount, txn_description } = payToMasterDto;

        let transaction: any;

        const userWallet = await this._getWalletOrFail(userAccount.id, 'REGULAR');

        const system = await this.systemRepository.findOne({ where: { id: userWallet.system.id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System for User wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const masterWallet = await this._getWalletOrFail(userAccount.id, 'MASTER', system.id);

        if (userWallet.balance < amount) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Wallet balance insufficient !`
            }, HttpStatus.CONFLICT);
        }

        transaction = await this.transactionService.payToMasterTransaction({
            currency: userWallet.currency,
            amount: amount,
            txn_description: 'Pay-Master-Account : ' + txn_description,
            userWallet: userWallet,
            masterWallet: masterWallet
        });

        userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) - parseFloat(amount.toFixed(2));
        masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) + parseFloat(amount.toFixed(2));

        const paymentStatus = await this.connection.transaction(async manager => {
            await this.walletRepository.manager.save(userWallet);
            await this.walletRepository.manager.save(masterWallet);
        }).then(async () => {
            await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'SUCCESS');
            await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'SUCCESS');
            return true;
        }).catch(async (err) => {
            await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'FAILED');
            await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'FAILED');
            return false;
        });

        const response = {
            status: paymentStatus ? 'success' : 'failure',
            message: paymentStatus ? 'Amount paid to Master account successfully !' : 'Failed to Pay !',
            data: {
                UTR: transaction.data.UTR
            }
        }

        if (response.status !== 'success') {
            throw new HttpException(response, HttpStatus.CONFLICT);
        } else {
            return response;
        }

    }

    // Generate Refund Request by Wallet (REGULAR) from Wallet (MASTER)
    async refundRequest(user_account_no: string, refundRequestDto: RefundRequestDto) {

        const userAccount = await this.walletRepository.findOne({ where: { account_no: user_account_no } })

        if (!userAccount) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'User account not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const { UTR, txn_description } = refundRequestDto;

        let transaction: any;

        const userWallet = await this._getWalletOrFail(userAccount.id, 'REGULAR');

        const system = await this.systemRepository.findOne({ where: { id: userWallet.system.id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System for User wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const masterWallet = await this._getWalletOrFail(null, 'MASTER', system.id);

        const transactionsToRefund = await this.transactionService.getTransactionFromUTRWallet(UTR, userWallet.id, masterWallet.id);

        if (transactionsToRefund.debitTransaction.is_settled) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `Transaction already settled !`
            }, HttpStatus.BAD_REQUEST);
        }

        transaction = await this.transactionService.refundRequest({
            currency: userWallet.currency,
            amount: transactionsToRefund.debitTransaction.amount,
            txn_description: 'Refund-Wallet : ' + txn_description + '|' + UTR,
            userWallet: userWallet,
            masterWallet: masterWallet
        });


        const response = {
            status: 'success',
            message: 'Refund request generated successfully. Awaiting approval !',
            data: {
                UTR: transaction.data.UTR
            }
        }

        if (response.status !== 'success') {
            throw new HttpException(response, HttpStatus.CONFLICT);
        } else {
            return response;
        }

    }

    // Approve / Reject Refund Request : Infra MGMT Team
    async updateRefundRequest(updateRefundRequestDto: UpdateRefundRequestDto) {

        enum approvalStatus {
            APPROVED = "APPROVED",
            REJECTED = "REJECTED"
        }

        let transactionState: any;
        let paymentStatus: boolean;

        const { UTR, txn_status } = updateRefundRequestDto;

        if (!Object.values(approvalStatus).includes(txn_status as approvalStatus)) {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Status Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const refundDebitTransaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'REFUND:DEBIT');
        const masterWallet = await this._getWalletOrFail(refundDebitTransaction.data.transaction.wallet.id, 'MASTER');

        if (refundDebitTransaction.data.transaction.txn_status !== 'PENDING') {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: 'Transaction status already updated !',
                data: {
                    UTR: UTR,
                    status: txn_status,
                    bank: refundDebitTransaction.data.transaction.bank
                }
            }, HttpStatus.CONFLICT)
        }


        const splitDescription = refundDebitTransaction.data.transaction.txn_description.split('|')
        const refund_against_utr = splitDescription[splitDescription.length - 1];

        const userDebitTransaction = await this.transactionService.getTransactionForApproval(refund_against_utr, txn_status, 'DEBIT');
        const userWallet = await this._getWalletOrFail(userDebitTransaction.data.transaction.wallet.id, 'REGULAR');

        if (masterWallet.balance < refundDebitTransaction.data.transaction.amount) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Master Wallet balance insufficient !`
            }, HttpStatus.CONFLICT);
        }

        if (txn_status === approvalStatus.REJECTED) {
            await this.transactionService.updateTransactionStatus(refundDebitTransaction.data.transaction.uuid, 'REJECTED');
            await this.transactionService.updateUTRRefundStatus(UTR, true);
            paymentStatus = true;
        } else if (txn_status === approvalStatus.APPROVED) {
            transactionState = await this.transactionService.approveTransaction(refundDebitTransaction.data.transaction,
                null,
                updateRefundRequestDto.txn_status,
                null,
                'REFUND',
                userDebitTransaction.data.transaction
            );

            paymentStatus = await this.connection.transaction(async manager => {
                masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) - parseFloat(Number(refundDebitTransaction.data.transaction.amount).toFixed(2));
                userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) + parseFloat(Number(userDebitTransaction.data.transaction.amount).toFixed(2));
                await this.walletRepository.manager.save(userWallet);
                await this.walletRepository.manager.save(masterWallet);
            }).then(async () => {
                await this.transactionService.updateTransactionStatus(refundDebitTransaction.data.transaction.uuid, 'APPROVED');
                await this.transactionService.updateTransactionStatus(transactionState.data.creditTransactionCreated.uuid, 'SUCCESS');
                await this.transactionService.updateUTRRefundStatus(refund_against_utr, true);
                await this.transactionService.updateUTRRefundStatus(UTR, true);
                return true;
            }).catch(async (err) => {
                return false;
            });

        } else {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: 'Failed to Update request !'
            }, HttpStatus.BAD_REQUEST)
        }

        return {
            status: paymentStatus ? 'success' : 'failure',
            message: paymentStatus ? `Refund request ${txn_status} successfully !` : 'Something went wrong. Please try again !',
            data: {
                UTR: refundDebitTransaction.data.UTR
            }
        }



    }

    // Generate Refund from Wallet (MASTER) to Wallet (REGULAR)
    async refundTransaction(refundTransactionDto: RefundTransactionDto) {

        const { UTR, txn_status } = refundTransactionDto;

        const refundTransaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'DEBIT');

        let transaction: any;

        const userWallet = await this._getWalletOrFail(refundTransaction.data.wallet_id , 'REGULAR');

        const system = await this.systemRepository.findOne({ where: { id: userWallet.system.id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System for User wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const masterWallet = await this._getWalletOrFail(refundTransaction.data.wallet_id, 'MASTER', system.id);

        const transactionsToRefund = await this.transactionService.getTransactionFromUTRWallet(UTR, userWallet.id, masterWallet.id);

        if (transactionsToRefund.debitTransaction.is_settled) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: `Transaction already refunded !`
            }, HttpStatus.BAD_REQUEST);
        }

        if (transactionsToRefund.debitTransaction.amount !== transactionsToRefund.creditTransaction.amount) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Debit/Credit Transaction amount mismatch !`
            }, HttpStatus.CONFLICT);
        }

        if (masterWallet.balance < transactionsToRefund.debitTransaction.amount) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Master Wallet balance insufficient !`
            }, HttpStatus.CONFLICT);
        }

        transaction = await this.transactionService.refundTransaction({
            currency: userWallet.currency,
            amount: transactionsToRefund.debitTransaction.amount,
            txn_description: 'Refund-Wallet-Direct : ' + UTR,
            userWallet: userWallet,
            masterWallet: masterWallet
        });

        masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) - parseFloat(Number(transactionsToRefund.debitTransaction.amount).toFixed(2));
        userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) + parseFloat(Number(transactionsToRefund.debitTransaction.amount).toFixed(2));

        const paymentStatus = await this.connection.transaction(async manager => {
            await this.walletRepository.manager.save(masterWallet);
            await this.walletRepository.manager.save(userWallet);
        }).then(async () => {
            await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'APPROVED');
            await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'SUCCESS');
            await this.transactionService.updateUTRRefundStatus(UTR, true);
            return true;
        }).catch(async (err) => {
            await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'FAILURE');
            await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'FAILURE');
            return false;
        });

        const response = {
            status: paymentStatus ? 'success' : 'failure',
            message: paymentStatus ? 'Amount Refund to User account successfully !' : 'Failed to Refund !',
            data: {
                UTR: transaction.data.UTR
            }
        }

        if (response.status !== 'success') {
            throw new HttpException(response, HttpStatus.CONFLICT);
        } else {
            return response;
        }


    }

    // Withdraw Request Initiate from Walllet (REGULAR)
    async withdrawRequest(user_account_no: string, withdrawFromRegularDto: WithdrawFromRegularDto) {

        const userAccount = await this.walletRepository.findOne({ where: { account_no: user_account_no } })

        if (!userAccount) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'User account not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const { amount, txn_description, bank } = withdrawFromRegularDto;

        let transaction: any;

        const userWallet = await this._getWalletOrFail(userAccount.id, 'REGULAR');

        if (userWallet.balance < amount) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `Wallet balance insufficient !`
            }, HttpStatus.CONFLICT);
        }

        transaction = await this.transactionService.withdrawTransaction({
            currency: userWallet.currency,
            amount: amount,
            txn_description: 'Withdraw : ' + txn_description,
            userWallet: userWallet,
            bank: bank
        });


        const withdrawalStatus = await this.connection.transaction(async manager => {
            userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) - parseFloat(amount.toFixed(2));
            await this.walletRepository.manager.save(userWallet);
        }).then(async () => {
            await this.transactionService.updateTransactionStatus(transaction.data.transaction.uuid, 'PENDING');
            return true;
        }).catch(async (err) => {
            await this.transactionService.updateTransactionStatus(transaction.data.transaction.uuid, 'FAILED');
            return false;
        });

        const response = {
            status: withdrawalStatus ? 'success' : 'failure',
            message: withdrawalStatus ? 'Withdrawal request initiated successfully !' : 'Failed to iniate request for Withdrawal. Please try again !',
            data: {
                UTR: transaction.data.transaction.UTR
            }
        }

        if (response.status !== 'success') {
            throw new HttpException(response, HttpStatus.CONFLICT);
        } else {
            return response;
        }


    }

    // Approve Withdrawal request & Update utr_no from Bank : [ Only for Infra Management Team ] 
    async updateWithdrawRequest(updateWithdrawDto: UpdateWithdrawDto) {

        enum approvalStatus {
            APPROVED = "APPROVED",
            REJECTED = "REJECTED"
        }

        let transactionState: any;

        const { UTR, bank_utr_no, txn_status } = updateWithdrawDto;

        if (!Object.values(approvalStatus).includes(txn_status as approvalStatus)) {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Status Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const transaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'WITHDRAW:DEBIT');
        const userWallet = await this._getWalletOrFail(transaction.data.wallet_id, 'REGULAR');

        if (txn_status === approvalStatus.REJECTED) {
            transactionState = await this.transactionService.rejectTransaction(transaction.data.transaction, updateWithdrawDto.txn_status, updateWithdrawDto.txn_description, 'WITHDRAW:CREDIT');
            userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) + parseFloat(Number(transaction.data.transaction.amount).toFixed(2));
            await this.walletRepository.save(userWallet);
            await this.transactionService.updateTransactionStatus(transactionState.data.transaction.uuid, 'SUCCESS');
        } else if (txn_status === approvalStatus.APPROVED) {
            transactionState = await this.transactionService.approveTransaction(transaction.data.transaction,
                transaction.data.transaction.bank.id,
                updateWithdrawDto.txn_status,
                bank_utr_no,
                'WITHDRAW'
            );
        } else {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: 'Failed to Update request !'
            }, HttpStatus.BAD_REQUEST)
        }

        return {
            status: 'success',
            message: `Withdrawal request ${txn_status} successfully !`,
            data: {
                UTR: transaction.data.UTR
            }
        }

    }

    async payToMasterRequest(user_wallet_id: string, payToMasterDto: PayToMasterDto) {

        const { amount, txn_description } = payToMasterDto;

        let transaction: any;

        const userWallet = await this._getWalletOrFail(user_wallet_id, 'REGULAR');

        const system = await this.systemRepository.findOne({ where: { id: userWallet.system.id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System for User wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const masterWallet = await this._getWalletOrFail(user_wallet_id, 'MASTER', system.id);

        transaction = await this.transactionService.payToMasterRequestTransaction({
            currency: userWallet.currency,
            amount: amount,
            txn_description: 'REQUEST-PAYMENT-MASTER : ' + txn_description,
            userWallet: userWallet,
            masterWallet: masterWallet
        });

        return {
            status: 'success',
            message: 'Pay to Master request generated successfully !',
            data: {
                UTR: transaction.data.UTR
            }
        }

    }

    async updatePayToMasterRequest(user_account_no: string, updatePayToMasterRequest: UpdatePayToMasterRequestDto) {

        enum approvalStatus {
            APPROVED = "APPROVED",
            REJECTED = "REJECTED"
        }

        let paymentStatus: boolean;
        let transactionState: any;

        const { UTR, txn_status } = updatePayToMasterRequest;

        if (!Object.values(approvalStatus).includes(txn_status as approvalStatus)) {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Status Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const debitTransaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'DEBIT');
        const userWallet = await this._getWalletOrFail(debitTransaction.data.transaction.wallet.id, 'REGULAR');

        if (debitTransaction.data.transaction.txn_status !== 'PENDING') {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: 'Transaction status already updated !',
                data: {
                    UTR: UTR,
                    status: txn_status,
                    bank: debitTransaction.data.transaction.bank
                }
            }, HttpStatus.CONFLICT)
        }

        const system = await this.systemRepository.findOne({ where: { id: userWallet.system.id } });

        if (!system) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'System for User wallet not found !'
            }, HttpStatus.NOT_FOUND)
        }

        const masterWallet = await this._getWalletOrFail(null, 'MASTER', system.id);

        if (txn_status === approvalStatus.REJECTED) {

            await this.transactionService.updateTransactionStatus(debitTransaction.data.transaction.uuid, 'REJECTED');
            paymentStatus = false;

        } else if (txn_status === approvalStatus.APPROVED) {

            if (userWallet.balance < debitTransaction.data.transaction.amount) {
                throw new HttpException({
                    status: HttpStatus.CONFLICT,
                    message: `Wallet balance insufficient !`
                }, HttpStatus.CONFLICT);
            }

            transactionState = await this.transactionService.approveTransaction(debitTransaction.data.transaction,
                null,
                txn_status,
                null,
                'PAYTOMASTER',
                null,
                masterWallet
            );


            userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) - parseFloat(Number(debitTransaction.data.transaction.amount).toFixed(2));
            masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) + parseFloat(Number(debitTransaction.data.transaction.amount).toFixed(2));

            paymentStatus = await this.connection.transaction(async manager => {
                await this.walletRepository.manager.save(userWallet);
                await this.walletRepository.manager.save(masterWallet);
            }).then(async () => {
                await this.transactionService.updateTransactionStatus(debitTransaction.data.transaction.uuid, 'APPROVED');
                await this.transactionService.updateTransactionStatus(transactionState.data.creditTransaction.uuid, 'SUCCESS');
                return true;
            }).catch(async (err) => {
                await this.transactionService.updateTransactionStatus(debitTransaction.data.transaction.uuid, 'FAILURE');
                await this.transactionService.updateTransactionStatus(transactionState.data.creditTransaction.uuid, 'FAILURE');
                return false;
            });

        } else {
            throw new HttpException({ status: HttpStatus.CONFLICT, message: 'Status Invalid !' }, HttpStatus.CONFLICT)
        }

        const response = {
            status: paymentStatus ? 'success' : 'failure',
            message: paymentStatus ? 'Amount paid to Master account successfully !' : 'Failed to Pay !',
            data: {
                UTR: debitTransaction.data.transaction.UTR
            }
        }

        if (response.status !== 'success') {
            throw new HttpException(response, HttpStatus.CONFLICT);
        } else {
            return response;
        }

    }

    // Update Access Token
    async generateWalletAccessToken(id: string): Promise<object> {

        const wallet = await this.walletRepository.findOne({ where: { id } });

        if (!wallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found'
            }, HttpStatus.NOT_FOUND)
        }

        const secret = crypto.randomBytes(20).toString('hex');
        // console.log(secret);

        const newToken = crypto.createHmac('sha256', secret).digest('hex');

        await this.walletRepository.update({ id }, { token: newToken });

        let walletUpdated = await this.walletRepository.findOne({ where: { id } });

        return {
            status: 'success',
            message: 'Wallet access token updated successfully',
            data: {
                token: walletUpdated.token
            }
        }

    }

    // Get Access Token
    async getWalletAccessToken(id: string): Promise<object> {

        const wallet = await this.walletRepository.findOne({ where: { id } });

        if (!wallet) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'Wallet not found'
            }, HttpStatus.NOT_FOUND)
        }

        return {
            status: 'success',
            message: 'Wallet access token fetched successfully',
            data: {
                token: wallet.token
            }
        }

    }


    // Validate MASTER Guard 
    async systemAccessCheck(key: string, token: string): Promise<SystemEntity> {

        const system = await this.systemRepository.findOne({
            where: {
                key: key,
                token: token
            }
        })

        if (!system) {
            throw new UnauthorizedException();
        }

        return system;

    }

    // Validate REGULAR Guard
    async walletAccessCheck(account_no: string, token: string): Promise<WalletEntity> {

        const wallet = await this.walletRepository.findOne({
            where: {
                account_no: account_no,
                token: token
            }
        })

        if (!wallet) {
            throw new UnauthorizedException();
        }

        return wallet;
    }

    // Validate Wallet Of System
    async walletOfSystem(user_wallet_id: string, system_key: string, system_token: string) {

        const wallet = await this.walletRepository.findOne({ where: { id: user_wallet_id }, relations: ['system'] })

        if (!wallet) {
            return false
        }

        const system = await this.systemRepository.findOne({ where: { id: wallet.system.id } })

        if (!system) {
            return false
        }

        const systemFromCreds = await this.systemRepository.findOne({ where: { key: system_key, token: system_token } });

        if (!systemFromCreds) {
            return false
        }

        if (system.id !== systemFromCreds.id) {
            return false
        }

        return true;
    }

    // Approver Guard 
    async approverSystem(UTR: string, key: string, token: string) {

        const transaction = await this.transactionService.getTransaction({ UTR })

        if(!transaction) return false

        const transactionWalletSystem = await this.systemRepository.findOne({where : {id : transaction.wallet.system.id}})

        if(!transactionWalletSystem) return false

        const transactionWalletSystemMaster = await this.walletRepository.findOne({where : {system: transactionWalletSystem.id, wallet_user_type: 'MASTER'}})

        const system = await this.systemRepository.findOne({ where: { key, token } })
        const wallet = await this.walletRepository.findOne({ where: { system: system.id, wallet_user_type: 'MASTER' } })

        if (transactionWalletSystemMaster.id !== wallet.id) {
            return false;
        }

        return true;

    }

}
