import { WalletEntity } from "src/wallet/entity/wallet.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BankEntity } from "./bank.entity";

@Entity('transaction')
export class TransactionEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    uuid: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
        unique: true
    })
    txn_id: string;

    @Column({
        type: "enum",
        enum: ['INR'],
        default: 'INR'
    })
    currency: string;

    @Column("decimal", { precision: 10, scale: 2, default: 0.00 })
    amount: number;

    @Column({
        type: "enum",
        enum: ['CREDIT', 'DEBIT', 'REFUND'],
        default: null
    })
    txn_type: string;

    @Column({
        type: 'text',
        nullable: true
    })
    txn_description: string;

    @OneToOne(type => WalletEntity)
    @JoinColumn({name: 'source_wallet_id'})
    source_wallet: WalletEntity;

    @OneToOne(type => WalletEntity)
    @JoinColumn({name: 'destination_wallet_id'})
    destination_wallet: WalletEntity;

    @Column({
        type: "enum",
        enum: ['FAILURE', 'PENDING', 'SUCCESS'],
        default: 'PENDING'
    })
    txn_status: string;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

    // - User UUID
    // @OneToOne( type => BankEntity)
    // @JoinColumn({ name: 'bank_id' })    
    // bank: BankEntity;

    @OneToOne(type => BankEntity, bank => bank.id)
    @JoinColumn({ name: 'bank_id' })
    bank: BankEntity;
    
}