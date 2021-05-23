import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCreateDto } from './dto/user.createDto.dto';
import { UserEntity } from './entity/user.entity';
import { toUserDto } from './mapper/toUserDto.dto';
import { fromString } from 'uuidv4';
import { UserUpdateDto } from './dto/user.updateDto.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    ) { }


    async findAll(): Promise<Array<object>> {
        const users = await this.userRepository.find({ relations: ['wallet'] });
        return users.map(user => toUserDto(user));
    }

    async findOne(options?: object): Promise<object> {

        const user = await this.userRepository.findOne(options);

        return user;
    }

    async create(userCreateDto: UserCreateDto): Promise<object> {

        const { name, mobile, email, status } = userCreateDto;
        let uuid: any;

        const userExists = await this.userRepository.findOne({
            where: [
                { mobile: mobile },
                { email: email }
            ]
        });

        if (userExists) {
            throw new HttpException({
                status: HttpStatus.CONFLICT,
                message: `User with email/mobile already exists !`
            }, HttpStatus.CONFLICT);
        }

        uuid = await fromString(mobile);

        const user: UserEntity = await this.userRepository.create({
            uuid: uuid,
            name,
            mobile,
            email,
            status
        });

        let userCreated = await this.userRepository.save(user);

        return {
            status: 'success',
            message: 'User created successfully',
            data: {
                user: toUserDto(user)
            }
        };
    }

    async updateOne(uuid: string, userUpdateDto: UserUpdateDto): Promise<object> {

        const userExists = await this.userRepository.findOne({ where: { uuid } });

        if (!userExists) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'User not found !'
            }, HttpStatus.NOT_FOUND)
        }

        await this.userRepository.update({ id: userExists.id }, userUpdateDto);

        const userUpdated = await this.userRepository.findOne({ where: { uuid } });

        return {
            status: 'success',
            message: 'Wallet updated successfully',
            data: {
                user: toUserDto(userUpdated)
            }
        }

    }

    async delete(uuid: string): Promise<object> {

        const user: UserEntity = await this.userRepository.findOne({ where: { uuid } });

        if (!user) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                message: 'User not found !'
            }, HttpStatus.NOT_FOUND);
        }

        await this.userRepository.delete({ uuid });

        return {
            status: HttpStatus.NO_CONTENT,
            message: 'User deleted successfully',
            data: {
                user: toUserDto(user)
            }
        };
    }

}
