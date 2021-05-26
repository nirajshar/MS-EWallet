import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ExtendedColumnOptions } from "typeorm-encrypted";
import { TransactionEntity } from "./transaction.entity";

@Entity('bank') 
export class BankEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    uuid: string;

    @Column({
        type: 'varchar',
        length: 30,
        nullable: false
    })
    bank_name: string;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: false
    })
    bank_ifsc: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false
    })
    account_holder_name: string;

    @Column(<ExtendedColumnOptions>{
        type: 'text',
        nullable: false,
        encrypt: {
            key: process.env.DB_COLUMN_ENCRYPT_KEY || 'ABCD',
            algorithm: process.env.DB_COLUMN_ALGORITHM || 'aes-256-cbc',
            ivLength: Number(process.env.DB_COLUMN_ivLength) || 16
        }
    })
    account_no: string;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

    // @OneToOne(type => TransactionEntity, transaction => transaction.id)
    // @JoinColumn({ name: 'transaction_id' })
    // transaction: TransactionEntity;

}