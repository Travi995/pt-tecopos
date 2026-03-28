import { Module } from '@nestjs/common';
import { SsoController } from './sso.controller';
import { SsoService } from './sso.service';

@Module({
  imports: [],
  controllers: [SsoController],
  providers: [SsoService],
})
export class SsoModule {}
