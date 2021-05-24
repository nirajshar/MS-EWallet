import { TransactionEntity } from "../entity/transaction.entity";
import { TransactionDto } from "../dto/transaction.dto";

export const toTransactionDto = (data: TransactionEntity): TransactionDto => {
    
    const { uuid, source_wallet, destination_wallet, amount, txn_id, txn_type, txn_status, txn_description, currency } = data;
    
    let transactionDto: TransactionDto = {
        uuid,
        source_wallet,
        destination_wallet,
        amount,
        txn_id,
        txn_type,
        txn_status,
        txn_description,
        currency
    }

    return transactionDto;
}