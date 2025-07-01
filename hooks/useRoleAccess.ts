// DEPRECATED: Use usePermissions instead. This hook is no longer used.
export function useRoleAccess() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('useRoleAccess is deprecated. Use usePermissions instead.');
  }
  return {};
} 