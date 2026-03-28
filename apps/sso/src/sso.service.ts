import { Injectable } from '@nestjs/common';

@Injectable()
export class SsoService {
  getHello(): string {
    return 'Hello World!';
  }
}
