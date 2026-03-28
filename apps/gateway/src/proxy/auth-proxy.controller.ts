import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() body: any) {
    return this.proxyService.forwardToSso('POST', '/auth/register', body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: any) {
    return this.proxyService.forwardToSso('POST', '/auth/login', body);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async profile(@Req() req: any) {
    return this.proxyService.forwardToSso('GET', '/auth/profile', undefined, {
      authorization: req.headers.authorization,
    });
  }
}
