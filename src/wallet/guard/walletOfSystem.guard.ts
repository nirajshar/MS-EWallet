import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WalletService } from '../wallet.service';

@Injectable()
export class WalletOfSystem implements CanActivate {

  constructor(
    private readonly walletService: WalletService
  ) { }


  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request: any = context.switchToHttp().getRequest();

    const headers = request.headers;

    return await this.walletService.walletOfSystem(headers.user_wallet_id, headers.system_key, headers.system_token);
  }
}
