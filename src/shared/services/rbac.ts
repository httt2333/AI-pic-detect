import { cache } from 'react';
import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm';

import { db } from '@/core/db';
import { permission, role, rolePermission, userRole } from '@/config/db/schema';
import { getUuid } from '@/shared/lib/hash';
import { getAllConfigs } from '@/shared/models/config';
import { User } from '@/shared/models/user';

// Types
export type Role = typeof role.$inferSelect;
export type Permission = typeof permission.$inferSelect;
export type RolePermission = typeof rolePermission.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;

export type NewRole = typeof role.$inferInsert;
export type NewPermission = typeof permission.$inferInsert;
export type NewRolePermission = typeof rolePermission.$inferInsert;
export type NewUserRole = typeof userRole.$inferInsert;

export type UpdateRole = Partial<Omit<Role, 'id' | 'createdAt'>>;
export type UpdatePermission = Partial<Omit<Permission, 'id' | 'createdAt'>>;
export type UpdateRolePermission = Partial<
  Omit<RolePermission, 'id' | 'createdAt'>
>;
export type UpdateUserRole = Partial<Omit<UserRole, 'id' | 'createdAt'>>;

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export enum RoleStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  DELETED = 'deleted',
}

/**
 * Get all roles
 */
export async function getRoles(): Promise<Role[]> {
  return await db()
    .select()
    .from(role)
    .where(eq(role.status, RoleStatus.ACTIVE));
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<Role | undefined> {
  const [result] = await db().select().from(role).where(eq(role.id, roleId));
  return result;
}

/**
 * Get role by name
 */
export async function getRoleByName(name: string): Promise<Role | undefined> {
  const [result] = await db().select().from(role).where(eq(role.name, name));
  return result;
}

/**
 * Create a new role
 */
export async function createRole(newRole: NewRole): Promise<Role> {
  const [result] = await db().insert(role).values(newRole).returning();
  return result;
}

/**
 * Update a role
 */
export async function updateRole(
  roleId: string,
  updates: UpdateRole
): Promise<Role> {
  const [result] = await db()
    .update(role)
    .set(updates)
    .where(eq(role.id, roleId))
    .returning();
  return result;
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<void> {
  await db().delete(role).where(eq(role.id, roleId));
}

/**
 * Get all permissions
 */
export async function getPermissions(): Promise<Permission[]> {
  return await db().select().from(permission);
}

/**
 * Get permission by code
 */
export async function getPermissionByCode(
  code: string
): Promise<Permission | undefined> {
  const [result] = await db()
    .select()
    .from(permission)
    .where(eq(permission.code, code));
  return result;
}

/**
 * Create a new permission
 */
export async function createPermission(
  newPermission: NewPermission
): Promise<Permission> {
  const [result] = await db()
    .insert(permission)
    .values(newPermission)
    .returning();
  return result;
}

/**
 * Get permissions for a role
 */
export async function getRolePermissions(
  roleId: string
): Promise<Permission[]> {
  const result = await db()
    .select({
      id: permission.id,
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      title: permission.title,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    })
    .from(rolePermission)
    .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
    .where(eq(rolePermission.roleId, roleId));

  return result;
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(
  roleId: string,
  permissionId: string
): Promise<RolePermission> {
  const [result] = await db()
    .insert(rolePermission)
    .values({
      id: getUuid(),
      roleId,
      permissionId,
    })
    .returning();
  return result;
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<void> {
  await db()
    .delete(rolePermission)
    .where(
      and(
        eq(rolePermission.roleId, roleId),
        eq(rolePermission.permissionId, permissionId)
      )
    );
}

/**
 * Batch assign permissions to role
 */
export async function assignPermissionsToRole(
  roleId: string,
  permissionIds: string[]
): Promise<void> {
  // First, remove all existing permissions
  await db().delete(rolePermission).where(eq(rolePermission.roleId, roleId));

  // Then, add new permissions
  if (permissionIds.length > 0) {
    await db()
      .insert(rolePermission)
      .values(
        permissionIds.map((permissionId) => ({
          id: getUuid(),
          roleId,
          permissionId,
        }))
      );
  }
}

/**
 * Get user's roles
 */
export const getUserRoles = cache(async (userId: string): Promise<Role[]> => {
  const now = new Date();
  const result = await db()
    .select({
      id: role.id,
      name: role.name,
      title: role.title,
      description: role.description,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      sort: role.sort,
    })
    .from(userRole)
    .innerJoin(role, eq(userRole.roleId, role.id))
    .where(
      and(
        eq(userRole.userId, userId),
        eq(role.status, RoleStatus.ACTIVE),
        // Check if role is not expired
        // Either expiresAt is null or expiresAt > now
        or(isNull(userRole.expiresAt), gt(userRole.expiresAt, now))
      )
    );

  return result;
});

/**
 * Get user's permissions (through roles)
 */
export const getUserPermissions = cache(
  async (userId: string): Promise<Permission[]> => {
    const roles = await getUserRoles(userId);
    if (roles.length === 0) return [];

    const roleIds = roles.map((r) => r.id);

    const result = await db()
      .selectDistinct({
        id: permission.id,
        code: permission.code,
        resource: permission.resource,
        action: permission.action,
        title: permission.title,
        description: permission.description,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      })
      .from(rolePermission)
      .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
      .where(inArray(rolePermission.roleId, roleIds));

    return result;
  }
);

/**
 * Check if user has a specific permission
 * Supports wildcard matching (e.g., "admin.*", "admin.posts.*")
 */
export const hasPermission = cache(
  async (userId: string, permissionCode: string): Promise<boolean> => {
    const permissions = await getUserPermissions(userId);
    const permissionCodes = permissions.map((p) => p.code);

    // Check exact match
    if (permissionCodes.includes(permissionCode)) {
      return true;
    }

    // Check wildcard match
    // If user has "admin.*", they have all "admin.xxx" permissions
    const parts = permissionCode.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcard = parts.slice(0, i).join('.') + '.*';
      if (permissionCodes.includes(wildcard)) {
        return true;
      }
    }

    // Check if user has "*" (super admin)
    if (permissionCodes.includes('*')) {
      return true;
    }

    return false;
  }
);

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (await hasPermission(userId, code)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (!(await hasPermission(userId, code))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user has a specific role
 */
export const hasRole = cache(
  async (userId: string, roleName: string): Promise<boolean> => {
    const roles = await getUserRoles(userId);
    return roles.some((r) => r.name === roleName);
  }
);

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  userId: string,
  roleNames: string[]
): Promise<boolean> {
  const roles = await getUserRoles(userId);
  const userRoleNames = roles.map((r) => r.name);
  return roleNames.some((name) => userRoleNames.includes(name));
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  updatedAt?: Date
): Promise<UserRole> {
  const [result] = await db()
    .insert(userRole)
    .values({
      id: getUuid(),
      userId,
      roleId,
      updatedAt,
    })
    .returning();
  return result;
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string
): Promise<void> {
  await db()
    .delete(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)));
}

/**
 * Batch assign roles to user
 */
export async function assignRolesToUser(
  userId: string,
  roleIds: string[]
): Promise<void> {
  await db().transaction(async (tx: any) => {
    await tx.delete(userRole).where(eq(userRole.userId, userId));

    if (roleIds.length > 0) {
      await tx.insert(userRole).values(
        roleIds.map((roleId) => ({
          id: getUuid(),
          userId,
          roleId,
        }))
      );
    }
  });
}

/**
 * Get users by role
 */
export async function getUsersByRole(roleId: string): Promise<string[]> {
  const result = await db()
    .select({ userId: userRole.userId })
    .from(userRole)
    .where(eq(userRole.roleId, roleId));

  return result.map((r: any) => r.userId);
}

export async function grantRoleForNewUser(user: User) {
  try {
    // get configs from db
    const configs = await getAllConfigs();

    // initial role not enabled
    if (configs.initial_role_enabled !== 'true') {
      return;
    }

    const roleName = configs.initial_role_name;

    // initial role name not set
    if (!roleName) {
      return;
    }

    const role = await getRoleByName(roleName);

    // initial role not found
    if (!role) {
      return;
    }

    await assignRoleToUser(user.id, role.id, user.createdAt);
  } catch (e) {
    console.error('grant role for new user failed', e);
  }
}
