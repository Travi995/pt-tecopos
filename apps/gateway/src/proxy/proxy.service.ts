import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private ssoUrl: string;
  private bankingUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ssoUrl = this.configService.get<string>('SSO_URL', 'http://localhost:3001');
    this.bankingUrl = this.configService.get<string>('BANKING_URL', 'http://localhost:3002');
  }

  async forwardToSso(method: string, path: string, data?: any, headers?: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.ssoUrl}${path}`,
          data,
          headers: headers ? { authorization: headers.authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw error;
    }
  }

  async forwardToBanking(method: string, path: string, data?: any, headers?: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.bankingUrl}${path}`,
          data,
          headers: headers ? { authorization: headers.authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw error;
    }
  }
}
