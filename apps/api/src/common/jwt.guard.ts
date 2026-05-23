import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly jwt = new JwtService({ secret: process.env.JWT_SECRET });

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException();
    const payload = this.jwt.verify(token);
    request.user = { id: payload.sub, email: payload.email };
    return true;
  }
}
