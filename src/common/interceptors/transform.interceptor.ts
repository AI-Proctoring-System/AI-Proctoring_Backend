import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

function getSuccessMessage(method: string, path: string): string {
  // Normalize path by removing trailing slash
  const cleanPath = path.replace(/\/$/, '');

  // Auth routes
  if (cleanPath.includes('/auth/register')) return 'Registration successful';
  if (cleanPath.includes('/auth/login')) return 'Login successful';
  if (cleanPath.includes('/auth/logout')) return 'Logout successful';
  if (cleanPath.includes('/auth/profile')) return 'Profile updated successfully';

  // Upload routes
  if (cleanPath.includes('/upload/company-logo')) return 'Logo uploaded successfully';

  // Telemetry routes
  if (cleanPath.includes('/telemetry/') && cleanPath.endsWith('/browser')) return 'Browser telemetry logged successfully';

  // Verification routes
  if (cleanPath.includes('/verification/')) {
    if (cleanPath.endsWith('/status')) return 'Verification status retrieved successfully';
    if (cleanPath.endsWith('/room/status')) return 'Room verification status retrieved successfully';
    if (cleanPath.endsWith('/room')) return 'Room verification details submitted successfully';
    if (cleanPath.endsWith('/identity')) return 'Identity verification details submitted successfully';
  }

  // Attempts routes
  if (cleanPath.includes('/attempts/scheduled')) return 'Scheduled attempts retrieved successfully';
  if (cleanPath.includes('/attempts/start/')) return 'Exam attempt started successfully';
  if (cleanPath.includes('/attempts/') && cleanPath.endsWith('/answers')) return 'Answers saved successfully';
  if (cleanPath.includes('/attempts/') && cleanPath.endsWith('/submit')) return 'Exam attempt submitted successfully';

  // Invitations routes
  if (cleanPath.includes('/invitations')) {
    if (cleanPath.endsWith('/bulk')) return 'Bulk invitations sent successfully';
    if (method === 'GET') return 'Invitations retrieved successfully';
  }

  // Questions routes
  if (cleanPath.includes('/questions')) {
    if (cleanPath.endsWith('/bulk')) return 'Questions uploaded in bulk successfully';
    if (method === 'POST') return 'Question created successfully';
    if (method === 'GET') {
      if (cleanPath.split('/').pop() !== 'questions') return 'Question retrieved successfully';
      return 'Questions retrieved successfully';
    }
    if (method === 'PATCH') return 'Question updated successfully';
    if (method === 'DELETE') return 'Question deleted successfully';
  }

  // Assessments routes
  if (cleanPath.includes('/assessments')) {
    if (cleanPath.endsWith('/rules')) return 'Rules updated successfully';
    if (cleanPath.endsWith('/schedule')) return 'Assessment scheduled successfully';
    if (method === 'POST') return 'Assessment created successfully';
    if (method === 'GET') {
      if (cleanPath.endsWith('/assessments')) return 'Assessments retrieved successfully';
      return 'Assessment retrieved successfully';
    }
    if (method === 'PATCH') return 'Assessment updated successfully';
    if (method === 'DELETE') return 'Assessment deleted successfully';
  }

  // Fallback based on HTTP Method
  switch (method) {
    case 'POST': return 'Created successfully';
    case 'PUT':
    case 'PATCH': return 'Updated successfully';
    case 'DELETE': return 'Deleted successfully';
    case 'GET': return 'Data retrieved successfully';
    default: return 'Success';
  }
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const method = request.method;
    const path = request.route?.path || request.url;

    return next.handle().pipe(
      map((data) => ({
        statusCode: http.getResponse().statusCode,
        message: data?.message || getSuccessMessage(method, path),
        data: data?.data ?? data,
      })),
    );
  }
}
