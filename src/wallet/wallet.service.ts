import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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
    async payToMasterWallet(user_wallet_id: string, payToMasterDto: PayToMasterDto) {

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
    async refundRequest(user_wallet_id: string, refundRequestDto: RefundRequestDto) {

        const { UTR, txn_description } = refundRequestDto;

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

        const transactionsToRefund = await this.transactionService.getTransactionFromUTRWallet(UTR, userWallet.id, masterWallet.id);

        if (transactionsToRefund.debitTransaction.is_refunded) {
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

        transaction = await this.transactionService.refundRequest({
            currency: userWallet.currency,
            amount: transactionsToRefund.debitTransaction.amount,
            txn_description: 'Refund-Wallet : ' + txn_description + '|' + UTR,
            userWallet: userWallet,
            masterWallet: masterWallet
        });

        masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) - parseFloat(Number(transactionsToRefund.debitTransaction.amount).toFixed(2));

        const paymentStatus = await this.connection.transaction(async manager => {
            await this.walletRepository.manager.save(masterWallet);
        }).then(async () => {
            return true;
        }).catch(async (err) => {
            return false;
        });

        const response = {
            status: paymentStatus ? 'success' : 'failure',
            message: paymentStatus ? 'Refund request generated successfully. Awaiting approval !' : 'Failed to generate Refund request !',
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

        const { UTR, txn_status } = updateRefundRequestDto;

        if (!Object.values(approvalStatus).includes(txn_status as approvalStatus)) {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Status Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const refundDebitTransaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'REFUND:DEBIT');
        const masterWallet = await this._getWalletOrFail(refundDebitTransaction.data.transaction.wallet.id, 'MASTER');

        const refundCreditTransaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'REFUND:CREDIT');
        const userWallet = await this._getWalletOrFail(refundCreditTransaction.data.transaction.wallet.id, 'REGULAR');

        const splitDescription = refundDebitTransaction.data.transaction.txn_description.split('|')
        const refund_against_utr = splitDescription[splitDescription.length - 1];

        if (txn_status === approvalStatus.REJECTED) {
            transactionState = await this.transactionService.rejectTransaction(refundDebitTransaction.data.transaction, updateRefundRequestDto.txn_status, updateRefundRequestDto.txn_description, 'REFUND:CREDIT');
            masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) + parseFloat(Number(refundDebitTransaction.data.transaction.amount).toFixed(2));
            await this.walletRepository.save(masterWallet);
            await this.transactionService.updateTransactionStatus(refundDebitTransaction.data.transaction.uuid, 'REJECTED');
            await this.transactionService.updateTransactionStatus(transactionState.data.transaction.uuid, 'SUCCESS');
        } else if (txn_status === approvalStatus.APPROVED) {
            transactionState = await this.transactionService.approveTransaction(refundCreditTransaction.data.transaction,
                null,
                updateRefundRequestDto.txn_status,
                null,
                'REFUND'
            );
            userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) + parseFloat(Number(refundCreditTransaction.data.transaction.amount).toFixed(2));
            await this.walletRepository.save(userWallet);
            await this.transactionService.updateUTRRefundStatus(refund_against_utr, true);
            await this.transactionService.updateUTRRefundStatus(UTR, true);
        } else {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: 'Failed to Update request !'
            }, HttpStatus.BAD_REQUEST)
        }

        return {
            status: 'success',
            message: `Refund request ${txn_status} successfully !`,
            data: {
                UTR: refundDebitTransaction.data.UTR
            }
        }



    }

    // Generate Refund from Wallet (MASTER) to Wallet (REGULAR)
    async refundTransaction(refundTransactionDto: RefundTransactionDto) {

        const { UTR, user_wallet_id } = refundTransactionDto;

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

        const transactionsToRefund = await this.transactionService.getTransactionFromUTRWallet(UTR, userWallet.id, masterWallet.id);

        if (transactionsToRefund.debitTransaction.is_refunded) {
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
            txn_description: 'Refund-Wallet : ' + UTR,
            userWallet: userWallet,
            masterWallet: masterWallet
        });

        masterWallet.balance = parseFloat(masterWallet.balance.toFixed(2)) - parseFloat(Number(transactionsToRefund.debitTransaction.amount).toFixed(2));
        userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) + parseFloat(Number(transactionsToRefund.debitTransaction.amount).toFixed(2));

        const paymentStatus = await this.connection.transaction(async manager => {
            await this.walletRepository.manager.save(masterWallet);
            await this.walletRepository.manager.save(userWallet);
        }).then(async () => {
            await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'SUCCESS');
            await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'SUCCESS');
            await this.transactionService.updateUTRRefundStatus(UTR, true);
            return true;
        }).catch(async (err) => {
            await this.transactionService.updateTransactionStatus(transaction.data.debitTransaction.uuid, 'FAILED');
            await this.transactionService.updateTransactionStatus(transaction.data.creditTransaction.uuid, 'FAILED');
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
    async withdrawRequest(user_wallet_id: string, withdrawFromRegularDto: WithdrawFromRegularDto) {

        const { amount, txn_description, bank } = withdrawFromRegularDto;

        let transaction: any;

        const userWallet = await this._getWalletOrFail(user_wallet_id, 'REGULAR');

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

        userWallet.balance = parseFloat(userWallet.balance.toFixed(2)) - parseFloat(amount.toFixed(2));

        const withdrawalStatus = await this.connection.transaction(async manager => {
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

        const { user_wallet_id, UTR, bank_utr_no, txn_status } = updateWithdrawDto;

        if (!Object.values(approvalStatus).includes(txn_status as approvalStatus)) {
            throw new HttpException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                message: 'Status Invalid !'
            }, HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const transaction = await this.transactionService.getTransactionForApproval(UTR, txn_status, 'WITHDRAW:DEBIT');

        if(transaction.data.transaction.wallet.id !== user_wallet_id ){
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                message: 'Transaction not associated with given User Wallet'
            }, HttpStatus.BAD_REQUEST)
        }

        const userWallet = await this._getWalletOrFail(user_wallet_id, 'REGULAR');

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




}
