import { WalletEntity } from "../entity/wallet.entity";
import { WalletTransactionBankDto } from "../dto/walletTransactionBank.dto";
import { WalletTransactionDto } from "../dto/wallet-transaction.dto";
import { WalletDepositOutDto } from "../dto/walletDepositOutDto.dto";


export const toWalletTransactionBankDto = (data: WalletEntity): WalletTransactionBankDto => {
   
    const { id, account_no, currency, balance, user, status, system, wallet_user_type} = data; 

    const { transactions } = data;

    let walletTransactionBankDto: WalletTransactionBankDto = { 
        id, account_no, currency, balance, user_id: user.uuid, status, system_id: system.id,
        wallet_user_type, 
        transactions
    };
    return walletTransactionBankDto;
};

export const toWalletDepositDto = (data: WalletEntity): WalletDepositOutDto => {
   
    const { id, account_no, currency, balance, user, status, system, wallet_user_type} = data; 

    const { transactions } = data;
    // console.log(Object.keys(transactions).length);
    

    let walletDepositOutDto: WalletDepositOutDto = { 
        id, account_no, currency, balance, user_id: user.uuid, status, system_id: system.id,
        wallet_user_type, 
        transaction_id: transactions[Object.keys(transactions).length - 1].uuid
    };
    return walletDepositOutDto;
};