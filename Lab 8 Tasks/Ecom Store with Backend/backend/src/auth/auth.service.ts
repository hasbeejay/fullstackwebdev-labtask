import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { User } from './user.model';

@Injectable()
export class AuthService {
  private readonly users: User[] = [];

  register(input: RegisterDto) {
    const email = input.email.toLowerCase();
    if (this.users.some((user) => user.email === email)) throw new ConflictException('Email is already registered');
    const user: User = { id: Date.now(), name: input.name.trim(), email, password: input.password, createdAt: new Date().toISOString() };
    this.users.push(user);
    return this.publicUser(user);
  }

  login(input: LoginDto) {
    const user = this.users.find((entry) => entry.email === input.email.toLowerCase() && entry.password === input.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    return { user: this.publicUser(user), token: `demo-${user.id}` };
  }

  private publicUser({ password: _password, ...user }: User) {
    return user;
  }
}
