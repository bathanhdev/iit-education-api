import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadGatewayException, BadRequestException } from "@nestjs/common";
import { Observable, catchError, throwError } from "rxjs";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SubDataInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const id = context.switchToHttp().getRequest().id;

        this.prisma.subData.findUniqueOrThrow({
            where: id
        })
        return next.handle().pipe(
            catchError(err => throwError(() => new BadRequestException(err))),
        );
    }
}