'use client';

import { useEnsureUserProfile } from '@/hooks/useEnsureUserProfile';

export function UserProfileManager() {
  useEnsureUserProfile();
  return null;
} 