import { IsBoolean } from 'class-validator';

export class SetUserBlockedDto {
  @IsBoolean()
  isBlocked: boolean;
}

