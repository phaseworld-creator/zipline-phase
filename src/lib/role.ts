import type { Role } from '@/prisma/client';

type RoleIdentity = {
  id: string;
  role: Role;
};

export function isOwner(role?: Role) {
  return role === 'OWNER';
}

export function isAdministrator(role?: Role) {
  return role === 'ADMIN' || role === 'SUPERADMIN' || role === 'OWNER';
}

export function isSuperAdminOrOwner(role?: Role) {
  return role === 'SUPERADMIN' || role === 'OWNER';
}

export function canInteract(current?: Role, target?: Role) {
  if (current === 'OWNER') return target !== 'OWNER'; // Owner can interact with everyone except other Owners
  return (
    (current === 'SUPERADMIN' && (target === 'USER' || target === 'ADMIN')) ||
    (current === 'ADMIN' && target === 'USER')
  );
}

export function canManage(current?: RoleIdentity | null, target?: RoleIdentity | null) {
  if (!current || !target) return false;
  return current.id === target.id || canInteract(current.role, target.role);
}

export function interactableRoles(current?: Role): Role[] {
  if (current === 'OWNER') return ['USER', 'ADMIN', 'SUPERADMIN'];
  if (current === 'SUPERADMIN') return ['USER', 'ADMIN'];
  if (current === 'ADMIN') return ['USER'];
  return [];
}

export function roleName(role?: Role) {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'SUPERADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'USER':
      return 'User';
    default:
      return 'User';
  }
}

/** Numeric rank — higher = more privileged. Used for comparisons. */
export function roleRank(role?: Role): number {
  switch (role) {
    case 'OWNER':     return 4;
    case 'SUPERADMIN': return 3;
    case 'ADMIN':     return 2;
    case 'USER':      return 1;
    default:          return 0;
  }
}
