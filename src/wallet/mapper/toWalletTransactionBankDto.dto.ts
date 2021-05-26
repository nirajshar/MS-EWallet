import { WalletEntity } from "../entity/wallet.entity";
import { WalletTransactionBankDto } from "../dto/walletTransactionBank.dto";
import { WalletTransactionDto } from "../dto/wallet-transaction.dto";


export const toWalletTransactionBankDto = (data: WalletEntity): WalletTransactionBankDto => {
    console.log(data);
    
    const { id, account_no, currency, balance, user, status, system, wallet_user_type} = data; 

    const { transactions } = data;

    let walletTransactionBankDto: WalletTransactionBankDto = { 
        id, account_no, currency, balance, user_id: user.uuid, status, system_id: system.id,
        wallet_user_type, 
        transactions
    };
    return walletTransactionBankDto;
};