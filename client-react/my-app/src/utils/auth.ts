import { usePermissionStore } from '../store/usePermissionStore';

// 检查用户是否有权限
export const checkPermission = (permission: string): boolean => {
  const hasPermission = usePermissionStore.getState().hasPermission(permission);
  return hasPermission;
};

// 检查用户是否有多个权限中的任意一个
export const checkAnyPermission = (permissions: string[]): boolean => {
  const state = usePermissionStore.getState();
  return permissions.some(permission => state.hasPermission(permission));
};

// 检查用户是否有所有权限
export const checkAllPermissions = (permissions: string[]): boolean => {
  const state = usePermissionStore.getState();
  return permissions.every(permission => state.hasPermission(permission));
};