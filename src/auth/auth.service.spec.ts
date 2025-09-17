import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CustomException } from '../error/custom.exception';
import { hashPassword } from '../common/crypto';

jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'REDIS', useValue: {} },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        avatarUrl: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          avatarUrl: mockUser.avatarUrl,
        },
        accessToken: 'mock-jwt-token',
      });
    });

    it('should throw CustomException when user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      const existingUser = {
        id: 'existing-uuid',
        email: 'existing@example.com',
        passwordHash: 'existing-hash',
        name: 'Existing User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        CustomException,
      );
      await expect(authService.register(registerDto)).rejects.toThrow(
        'User already exists',
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = hashPassword('password123');
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        name: 'Test User',
        avatarUrl: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          avatarUrl: mockUser.avatarUrl,
        },
        accessToken: 'mock-jwt-token',
      });
    });

    it('should throw CustomException when user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        CustomException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'User not found',
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw CustomException when password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: hashPassword('correct-password'),
        name: 'Test User',
        avatarUrl: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login(loginDto)).rejects.toThrow(
        CustomException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid password',
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      (jwt.sign as jest.Mock).mockReturnValue('generated-token');

      const token = await authService.generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          ...mockUser,
        },
        'test-secret',
        { expiresIn: 10 * 60 * 300 },
      );
      expect(token).toBe('generated-token');
    });
  });

  describe('decoded', () => {
    it('should decode a valid token', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { id: 'uuid-123', email: 'test@example.com' };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = await authService.decoded(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret');
      expect(result).toEqual(mockDecoded);
    });

    it('should throw CustomException when token is invalid', async () => {
      const invalidToken = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.decoded(invalidToken)).rejects.toThrow(
        CustomException,
      );
      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, 'test-secret');
    });
  });
});
