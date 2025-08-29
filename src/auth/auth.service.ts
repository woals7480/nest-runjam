import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(email: string, password: string, nickname: string) {
    const user = await this.usersService.create(email, password, nickname);
    return this.usersService.sanitize(user);
  }
}
