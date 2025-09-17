import { Inject, Injectable, Logger, Res } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as uuid from 'uuid';
import * as jwt from 'jsonwebtoken';
import { CustomException } from '../error/custom.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import * as dayjs from 'dayjs';
import { hashPassword, verifyPassword } from '../common/crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject('REDIS')
    private readonly redis,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * decoded
   * @param accessToken
   * @returns
   */
  async decoded(accessToken: string) {
    try {
      return jwt.verify(accessToken, this.configService.get('JWT_SECRET'));
    } catch (error) {
      throw new CustomException(1001);
    }
  }

  /**
   * generateToken
   * @param address
   * @returns
   */
  async generateToken(user: any) {
    delete user.passwordHash;
    const accessToken = jwt.sign(
      {
        ...user,
      },
      this.configService.get('JWT_SECRET'),
      { expiresIn: 10 * 60 * 300 }, // 30 min
    );
    return accessToken;
  }

  /**
   * register
   * @param dto
   * @returns
   */
  async register(dto: RegisterDto) {
    this.logger.log('register dto', dto);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new CustomException(1002);
    }

    // Hash password
    const passwordHash = hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: uuid.v4(),
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    // Generate token
    const accessToken = await this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    this.logger.log('login dto', dto);
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new CustomException(1003);
    }

    // Verify password
    const isPasswordValid = verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new CustomException(1004);
    }

    // Generate token
    const accessToken = await this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    };
  }
}
