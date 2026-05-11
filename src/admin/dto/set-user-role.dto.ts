import { IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class SetUserRoleDto {
  @IsEnum(Role)
  role: Role;
}
