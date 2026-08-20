import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: { name: registerDto.companyName },
    });
    if (existingCompany) {
      throw new ConflictException('A company with this name already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.ADMIN,
        company: {
          create: {
            name: registerDto.companyName,
            logoUrl: registerDto.logoDataUrl || null,
          },
        },
      },
      include: {
        company: true,
      },
    });

    return this.generateToken(user.id, user.email, user.role);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user.id, user.email, user.role, user.candidate?.id);
  }

  private generateToken(userId: string, email: string, role: string, candidateId?: string) {
    const payload: any = { sub: userId, email, role };
    if (candidateId) {
      payload.candidateId = candidateId;
    }
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async updateCompanyProfile(userId: string, dto: UpdateCompanyProfileDto) {
    // 1. Prepare updates for the User model
    const userUpdates: any = {};
    if (dto.firstName !== undefined) userUpdates.firstName = dto.firstName;
    if (dto.lastName !== undefined) userUpdates.lastName = dto.lastName;

    // 2. Prepare updates for the Company model
    const companyUpdates: any = {};
    if (dto.companyName !== undefined) companyUpdates.name = dto.companyName;
    if (dto.companyEmail !== undefined) companyUpdates.email = dto.companyEmail;
    if (dto.websiteUrl !== undefined) companyUpdates.websiteUrl = dto.websiteUrl;
    if (dto.description !== undefined) companyUpdates.description = dto.description;
    if (dto.logoDataUrl !== undefined) companyUpdates.logoUrl = dto.logoDataUrl;

    // 3. Update in Database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdates,
        company: Object.keys(companyUpdates).length > 0 ? {
          update: companyUpdates
        } : undefined,
      },
      include: {
        company: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        company: updatedUser.company,
      }
    };
  }
}
