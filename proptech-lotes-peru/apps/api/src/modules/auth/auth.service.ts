import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Support both bcrypt and sha256 (for seed data)
    let isValid = false;
    try {
      isValid = await bcrypt.compare(dto.password, user.password);
    } catch {
      // If bcrypt fails, try sha256 (seed uses sha256)
      const crypto = require('crypto');
      const sha256 = crypto.createHash('sha256').update(dto.password).digest('hex');
      isValid = sha256 === user.password;
    }

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
    return {
      user: {
        id: stored.user.id,
        email: stored.user.email,
        name: stored.user.name,
        role: stored.user.role,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
