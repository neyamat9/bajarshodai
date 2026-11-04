import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { UserProfile } from '../types';
import { useAuthStore } from '@/store/useAuthStore';

export async function getProfileApi(): Promise<UserProfile> {
  return api.get<UserProfile>('/customer/auth/profile');
}

export function useUserProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setProfile = useAuthStore((s) => s.setProfile);

  return useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      const profile = await getProfileApi();
      setProfile(profile);
      return profile;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
