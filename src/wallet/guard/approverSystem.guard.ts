import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WalletService } from '../wallet.service';

@Injectable()
export class ApproverSystem implements CanActivate {

  constructor(
    private readonly walletService: WalletService
  ) { }


  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request: any = context.switchToHttp().getRequest();

    const headers = request.headers;

    if (!headers.system_key || !headers.system_token) {
      return false;
    }

    return await this.walletService.approverSystem(request.body.UTR, headers.system_key, headers.system_token);

  }
}
