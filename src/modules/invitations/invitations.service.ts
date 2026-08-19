import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkInviteDto } from './dto/bulk-invite.dto';
import { UserRole, InvitationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendBulkInvites(userId: string, assessmentId: string, dto: BulkInviteDto) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment || assessment.company.userId !== userId) {
      throw new ForbiddenException('Assessment not found or access denied');
    }

    const results = [];

    for (const candidateData of dto.candidates) {
      let user = await this.prisma.user.findUnique({
        where: { email: candidateData.email },
        include: { candidate: true },
      });

      let rawPassword = '';

      if (!user) {
        // Create new candidate user
        rawPassword = randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        user = await this.prisma.user.create({
          data: {
            email: candidateData.email,
            passwordHash,
            firstName: candidateData.firstName,
            lastName: candidateData.lastName,
            role: UserRole.CANDIDATE,
            candidate: {
              create: {
                phone: candidateData.phone,
              },
            },
          },
          include: { candidate: true },
        });
      }

      if (!user.candidate) {
        // User exists but has no candidate profile
        await this.prisma.candidate.create({
          data: {
            userId: user.id,
            phone: candidateData.phone,
          },
        });
        user = await this.prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          include: { candidate: true },
        });
      }

      // Create Invitation
      const invitationToken = randomBytes(32).toString('hex');
      const invitation = await this.prisma.assessmentInvitation.upsert({
        where: {
          assessmentId_candidateId: {
            assessmentId: assessment.id,
            candidateId: user.candidate!.id,
          },
        },
        update: {
          invitationToken,
          status: InvitationStatus.INVITED,
          invitedAt: new Date(),
        },
        create: {
          assessmentId: assessment.id,
          candidateId: user.candidate!.id,
          email: user.email,
          invitationToken,
        },
      });

      // Send Email
      await this.sendInviteEmail(
        user.email,
        user.firstName,
        assessment.title,
        assessment.company.name,
        rawPassword,
        `http://localhost:3000/login?token=${invitationToken}` // Placeholder URL for frontend
      );

      // Log for easy testing locally
      this.logger.log(`Invited ${user.email} | PW: ${rawPassword || '(existing user)'}`);
      
      results.push(invitation);
    }

    return { message: `Successfully processed ${results.length} invitations.` };
  }

  async getInvitations(userId: string, assessmentId: string, page: number = 1, limit: number = 10) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { company: true },
    });

    if (!assessment || assessment.company.userId !== userId) {
      throw new ForbiddenException('Assessment not found or access denied');
    }

    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.prisma.assessmentInvitation.findMany({
        where: { assessmentId },
        skip,
        take: limit,
        include: {
          candidate: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { invitedAt: 'desc' },
      }),
      this.prisma.assessmentInvitation.count({ where: { assessmentId } }),
    ]);

    return {
      data: invitations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async sendInviteEmail(to: string, name: string, assessmentTitle: string, companyName: string, password?: string, link?: string) {
    const loginSnippet = password
      ? `<p>Your temporary password is: <strong>${password}</strong></p>`
      : `<p>Please use your existing password to log in.</p>`;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to,
      subject: `Invitation to ${assessmentTitle}`,
      html: `
        <h3>Hello ${name},</h3>
        <p>You have been invited by ${companyName} to take the <strong>${assessmentTitle}</strong> assessment.</p>
        ${loginSnippet}
        <p><a href="${link}">Click here to access your portal</a></p>
        <p>Best regards,<br/>The Proctoring Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as any).message}`);
    }
  }
}
