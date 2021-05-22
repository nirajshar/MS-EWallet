import { WalletEntity } from "../entity/wallet.entity";
import { WalletDto } from "../dto/wallet.dto";


export const toWalletDto = (data: WalletEntity): WalletDto => {
    const { id, account_no, currency, balance, user_id, status, system } = data;
    let walletDto: WalletDto = { id, account_no, currency, balance, user_id, status, system_name: system.app_name };
    return walletDto;
};