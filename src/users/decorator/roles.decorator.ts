import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../const/roles.const';

export const ROLES_KEY = 'user_roles';

// SetMetadata(key, value);
// key에 해당되는 value
export const Roles = (role: RolesEnum) => SetMetadata(ROLES_KEY, role);
