import { useAuth } from '@/context/auth';

export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const hasPermission = (permission: string) => {
    return permissions.includes('all') || permissions.includes(permission);
  };

  return {
    hasPermission,
    permissions,
  };
} 