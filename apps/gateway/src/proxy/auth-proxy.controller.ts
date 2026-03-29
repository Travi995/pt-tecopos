import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface ProxyRequest {
  headers: { authorization?: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() body: RegisterDto) {
    return this.proxyService.sendToSso(
      'sso.auth.register',
      body as unknown as Record<string, unknown>,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: LoginDto) {
    return this.proxyService.sendToSso(
      'sso.auth.login',
      body as unknown as Record<string, unknown>,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async profile(@Req() req: ProxyRequest) {
    return this.proxyService.sendToSso('sso.auth.profile', {
      authorization: req.headers.authorization,
    });
  }
}
