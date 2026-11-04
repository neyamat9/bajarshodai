import { useAuthStore } from '@/store/useAuthStore';

export function useRiderAccess() {
  const { isAuthenticated, user } = useAuthStore();

  const isStaffOrRider =
    isAuthenticated &&
    Boolean(
      user &&
      (user.role === 'STAFF' ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN' ||
        ((user as any).permissions &&
          Array.isArray((user as any).permissions) &&
          (user as any).permissions.includes('staff'))),
    );

  return {
    isStaffOrRider,
    user,
    isAuthenticated,
  };
}
