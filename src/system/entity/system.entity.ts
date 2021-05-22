import { WalletEntity } from "src/wallet/entity/wallet.entity";
import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('system')
export class SystemEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        nullable: false,
        unique: true
    })
    app_name: string;

    @Column({
        type: 'text'
    })
    app_description: string;
    
    @Column({
        type: 'varchar',
        nullable: false,
        unique: true
    })
    key: string;

    @BeforeInsert() async sanitizeKey() {
        this.key = await this.key.replace(/\s/g, "").toLowerCase();
    }

    @Column({
        type: 'varchar',
        nullable: false,
        unique: true
    })
    token: string;

    @Column({
        type: 'varchar',
        nullable: false
    })
    whitelist_ip: string;

    @Column({
        default: 0
    })
    status: boolean;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;

    @Column({
        type: 'varchar',
        nullable: true,
        unique: true
    })
    account_prefix: string;

    @BeforeInsert() async sanitizeAccountPrefix() {
        this.account_prefix = await this.account_prefix.replace(/\s/g, "").toLowerCase().toUpperCase();
    }

    // OneToMany Relation with Wallet 
    @OneToMany(type => WalletEntity, wallet => wallet.id)
    wallet: WalletEntity[];

}