import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = HttpStatus.INTERNAL_SERVER_ERROR;

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
            message: exception.meta,
        });
    }
}
