import { WalletEntity } from "../entity/wallet.entity";
import { WalletDto } from "../dto/wallet/wallet.dto";


export const toWalletDto = (data: WalletEntity): WalletDto => {
    const { id, account_no, currency, balance, user, status, system, wallet_user_type } = data; 
    let walletDto: WalletDto = { 
        id, account_no, currency, balance, user_id: user.uuid, status, system_name: system.app_name,
        wallet_user_type 
    };
    return walletDto;
};