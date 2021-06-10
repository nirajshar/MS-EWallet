import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WalletService } from '../wallet.service';

@Injectable()
export class SystemGuard implements CanActivate {

  constructor(
    private readonly walletService: WalletService
  ) { }


  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request: any = context.switchToHttp().getRequest();

    const headers = request.headers;

    if (!headers.system_key || !headers.system_token) {
      return false
    }

    let system = await this.walletService.systemAccessCheck(headers.system_key, headers.system_token);

    if (!system) {
      return false;
    }

    return true
  }
}
