import { UserEntity } from "../entity/user.entity";
import { UserDto } from "../dto/user.dto";


export const toUserDto = (data: UserEntity): UserDto => {
    const { uuid, name, mobile, email, status } = data;
    let userDto: UserDto = { uuid, name, mobile, email, status };
    return userDto;
};