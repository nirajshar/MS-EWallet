import { WalletEntity } from "src/wallet/entity/wallet.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BankEntity } from "./bank.entity";

@Entity('transaction')
@Index(["txn_type", "UTR"], { unique: true })
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
        enum: ['CREDIT', 'DEBIT', 'REFUND:DEBIT', 'REFUND:CREDIT', 'WITHDRAW:DEBIT', 'WITHDRAW:CREDIT'],
        default: null
    })
    public txn_type: string;

    @Column({
        type: 'text',
        nullable: true
    })
    txn_description: string;

    // @ManyToOne(type => WalletEntity, source_wallet => source_wallet.id)
    // @JoinColumn({ name: 'source_wallet_id' })
    // source_wallet: WalletEntity;

    // @ManyToOne(type => WalletEntity, destination_wallet => destination_wallet.id, { nullable: false })
    // @JoinColumn({ name: 'destination_wallet_id' })
    // destination_wallet: WalletEntity;

    @Column({
        type: "enum",
        enum: ['FAILURE', 'PENDING', 'SUCCESS'],
        default: 'PENDING'
    })
    public txn_status: string;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

    // - Bank UUID
    @OneToOne(type => BankEntity, bank => bank.id, { cascade: true })
    @JoinColumn({ name: 'bank_id' })
    bank: BankEntity;

    @ManyToOne(type => WalletEntity, wallet => wallet.id, { nullable: false })
    @JoinColumn({ name: 'wallet_id', referencedColumnName: 'id' })
    wallet: WalletEntity;

    @Column({
        type: 'varchar',
        nullable: false
    })
    UTR: string;

    @Column({
        default: 0
    })
    is_refund: boolean;
}