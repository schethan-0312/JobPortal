import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SubscribePushDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;

  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  auth!: string;
}
