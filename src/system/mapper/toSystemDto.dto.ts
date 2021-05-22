import { SystemEntity } from "../entity/system.entity";
import { SystemDto } from "../dto/systemDto.dto";

export const toSystemDto = (data: SystemEntity): SystemDto => {  
    const { id, app_name, app_description, account_prefix } = data;
    let systemDto: SystemDto = { id, app_name, app_description, account_prefix };
    return systemDto;
};