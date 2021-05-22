import { IsNotEmpty } from "class-validator";


export class SystemDto {

    @IsNotEmpty()
    id: string;
    
    @IsNotEmpty()
    app_name: string;

    @IsNotEmpty()
    app_description: string;
 
    @IsNotEmpty()
    account_prefix: string;  

}