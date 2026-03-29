import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AuthKafkaController {
  private readonly logger = new Logger(AuthKafkaController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @MessagePattern('sso.auth.register')
  async handleRegister(
    @Payload() data: { email: string; password: string; name: string },
  ) {
    try {
      return await this.authService.register(data);
    } catch (error) {
      this.logger.error(`Register error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 500 };
    }
  }

  @MessagePattern('sso.auth.login')
  async handleLogin(@Payload() data: { email: string; password: string }) {
    try {
      return await this.authService.login(data);
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 500 };
    }
  }

  @MessagePattern('sso.auth.profile')
  async handleProfile(@Payload() data: { authorization: string }) {
    try {
      const token = data.authorization?.replace('Bearer ', '');
      if (!token) {
        return { error: 'No token provided', statusCode: 401 };
      }
      const decoded = this.jwtService.verify(token);
      return await this.authService.getProfile(decoded.sub);
    } catch (error) {
      this.logger.error(`Profile error: ${error.message}`);
      return { error: error.message, statusCode: error.status || 401 };
    }
  }
}
