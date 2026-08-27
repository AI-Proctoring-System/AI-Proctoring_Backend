import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { VerificationModule } from './modules/verification/verification.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AssessmentsModule,
    QuestionsModule,
    InvitationsModule,
    AttemptsModule,
    VerificationModule,
    TelemetryModule,
    UploadModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
