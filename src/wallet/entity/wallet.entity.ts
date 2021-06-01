import { SystemEntity } from "src/system/entity/system.entity";
import { TransactionEntity } from "src/transaction/entity/transaction.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

enum WalletType {
    CLOSED = "closed"
}

enum CurrencyType {
    INR = "INR"
}

@Entity('wallet')
export class WalletEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 30
    })
    account_prefix: string;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 30
    })
    account_actual: string;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 30,
        unique: true
    })
    account_no: string;

    @Column({
        type: "enum",
        enum: CurrencyType,
        default: CurrencyType.INR
    })
    currency: string;

    @Column("decimal", {
        precision: 10, scale: 2, default: 0.00,
        transformer: {
            to(value) {
                return value;
            },
            from(value) {
                return parseFloat(value);
            },
        },
    })
    balance: number;

    @Column({
        type: "enum",
        enum: WalletType,
        enumName: 'WalletEnum',
        default: WalletType.CLOSED
    })
    public wallet_type: string;

    @Column({
        default: 0
    })
    status: boolean;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

    // - System UUID    
    @ManyToOne(type => SystemEntity, system => system.id)
    @JoinColumn({ name: 'system_id' })
    system: SystemEntity;

    // - User UUID
    @OneToOne(type => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({
        type: "enum",
        enum: ['MASTER', 'REGULAR'],
        enumName: 'wallet_user_type',
        default: 'REGULAR'
    })
    public wallet_user_type: string;

    @OneToMany(type => TransactionEntity, transaction => transaction.wallet)
    transactions: TransactionEntity[];

    @Column({
        type: 'varchar',
        nullable: false,
        unique: true
    })
    token: string;
}


