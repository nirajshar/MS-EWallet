import { TransactionEntity } from "../entity/transaction.entity";
import { TransactionDto } from "../dto/transaction.dto";

export const toTransactionDto = (data: TransactionEntity): TransactionDto => {
    
    const { uuid, amount, txn_id, txn_type, txn_status, txn_description, currency, wallet } = data;
    
    let transactionDto: TransactionDto = {
        uuid,
        wallet,
        amount,
        txn_id,
        txn_type,
        txn_status,
        txn_description,
        currency
    }

    return transactionDto;
}