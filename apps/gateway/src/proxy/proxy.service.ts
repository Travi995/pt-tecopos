import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

interface ProxyHeaders {
  authorization?: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private ssoUrl: string;
  private bankingUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ssoUrl = this.configService.get<string>('SSO_URL', 'http://localhost:3001');
    this.bankingUrl = this.configService.get<string>('BANKING_URL', 'http://localhost:3002');
  }

  async forwardToSso(method: string, path: string, data?: Record<string, unknown>, headers?: ProxyHeaders) {
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.ssoUrl}/api/v1${path}`,
          data,
          headers: headers ? { authorization: headers.authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new HttpException(axiosError.response.data as Record<string, unknown>, axiosError.response.status);
      }
      this.logger.error(`Failed to forward request to SSO: ${axiosError.message}`);
      throw error;
    }
  }

  async forwardToBanking(method: string, path: string, data?: Record<string, unknown>, headers?: ProxyHeaders) {
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.bankingUrl}/api/v1${path}`,
          data,
          headers: headers ? { authorization: headers.authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new HttpException(axiosError.response.data as Record<string, unknown>, axiosError.response.status);
      }
      this.logger.error(`Failed to forward request to Banking: ${axiosError.message}`);
      throw error;
    }
  }
}
