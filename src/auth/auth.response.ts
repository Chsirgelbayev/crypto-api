import { ApiProperty } from '@nestjs/swagger';
import { JwtInterface } from 'interfaces';

export class AuthResponse {
  @ApiProperty()
  public readonly accessToken: string;
  @ApiProperty()
  public readonly refreshToken: string;

  constructor(auth: JwtInterface) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
  }
}
