import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.constants';
import type { AuthRole } from './auth.types';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);
