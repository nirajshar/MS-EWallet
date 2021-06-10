import { Column, CreateDateColumn, Entity, Generated, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('user')
export class UserEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    uuid: string;

    @Column({
        type: 'varchar',
        length: 100
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 10,
        unique: true,
        nullable: false
    })
    mobile: string;

    @Column({
        type: 'varchar',
        length: 50,
        unique: true,
        nullable: true
    })
    email: string;

    @Column()
    status: boolean;

    @CreateDateColumn() createdAt : Date;
    @UpdateDateColumn() updatedAt : Date; 

    @Column({
        type: "enum",
        enum: ['MASTER', 'REGULAR'],
        enumName: 'wallet_user_type',
        default: 'REGULAR'
    })
    public wallet_user_type: string;
    

}