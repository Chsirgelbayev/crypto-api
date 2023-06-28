import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CookieOptions, Response } from 'express';
import { Repository } from 'typeorm';
import { JwtTokenTypeEnum } from 'enums';
import { TokenEntity, UserEntity } from 'entities';
import { JwtInterface, PayloadInterface } from 'interfaces';
import { EthService } from '@/eth/eth.service';
import { UsersService } from '@/users/users.service';
import { JwtConfig } from '@/config/jwt/jwt-config';
import { generateHash } from './utils/generate-hash.util';
import { Web3LoginDto } from './dto/web3-login.dto';

@Injectable()
export class AuthWeb3Service {
  private readonly signMessage = 'Authentication';

  constructor(
    private readonly web3: EthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfig,
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
  ) {}

  public async web3Login(web3LoginDto: Web3LoginDto, res: Response) {
    const address = this.web3.eth.accounts
      .recover(this.web3.utils.toHex(this.signMessage), web3LoginDto.signature)
      .toLowerCase();

    let user = (await this.usersService.findByAddress({
      address,
    })) as UserEntity;

    if (!user) {
      user = await this.usersService.createByAddress({ address });
    }

    const tokens = await this.getjwtTokens(user, res);
    await this.saveRefreshToken(user, tokens.refreshToken);
    return tokens;
  }

  private async getjwtTokens(
    user: UserEntity | PayloadInterface,
    res: Response,
  ): Promise<JwtInterface> {
    const payload: PayloadInterface = {
      username: user.username,
      id: user.id,
    } as PayloadInterface;

    const accessToken: string = this.jwtService.sign(payload);
    const refreshToken: string = this.jwtService.sign(payload, {
      secret: this.jwtConfig.refreshToken.secret,
      expiresIn: this.jwtConfig.refreshToken.expiresIn,
    });

    const cookieOptions: CookieOptions = {
      expires: new Date(Number(this.jwtConfig.accessToken.expiresIn) * 1000),
      httpOnly: true,
    };

    res.cookie(JwtTokenTypeEnum.AccessToken, accessToken, cookieOptions);
    res.cookie(JwtTokenTypeEnum.RefreshToken, refreshToken, cookieOptions);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(
    user: UserEntity,
    refreshToken: string,
  ): Promise<void> {
    const hash: string = await generateHash(refreshToken);

    const token = await this.tokenRepository.findOne({
      where: {
        user: user.id,
      },
    });

    if (token) {
      await this.tokenRepository.update(token.id, {
        saveRefreshToken: hash,
      });
    } else {
      await this.tokenRepository.save({
        user,
        saveRefreshToken: hash,
      });
    }
  }
}