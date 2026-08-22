import type { Role } from '@/prisma/client';

type RoleIdentity = {
  id: string;
  role: Role;
};

export function isAdministrator(role?: Role) {
  return role === 'ADMIN';
}

export function canInteract(current?: Role, target?: Role) {
  return current === 'ADMIN' && target === 'USER';
}

export function canManage(current?: RoleIdentity | null, target?: RoleIdentity | null) {
  if (!current || !target) return false;
  return current.id === target.id || canInteract(current.role, target.role);
}

export function interactableRoles(current?: Role): Role[] {
  if (current === 'ADMIN') return ['USER'];
  return [];
}

export function roleName(role?: Role) {
  switch (role) {
    case 'ADMIN': return 'Admin';
    case 'USER':  return 'User';
    default:      return 'User';
  }
}

export function roleRank(role?: Role): number {
  switch (role) {
    case 'ADMIN': return 2;
    case 'USER':  return 1;
    default:      return 0;
  }
}
