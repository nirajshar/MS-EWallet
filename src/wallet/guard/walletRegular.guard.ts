import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WalletService } from '../wallet.service';

@Injectable()
export class WalletGuard implements CanActivate {

  constructor(
    private readonly walletService: WalletService
  ) { }


  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request: any = context.switchToHttp().getRequest();

    const headers = request.headers;

    if (!headers.token) {
      return false;
    }

    let wallet = await this.walletService.walletAccessCheck(headers.token);

    if (!wallet) {
      return false;
    }

    return true
  }
}
