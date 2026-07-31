import { IsBoolean, IsOptional, IsPhoneNumber } from 'class-validator';

export class UpdateChannelPrefsDto {
  @IsOptional()
  @IsPhoneNumber(undefined)
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  smsOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}
