'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

interface UserAvatarProps {
  address: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

export const UserAvatar = memo(({ address, size = 'md', className }: UserAvatarProps) => {
  const { data: profile } = useUserProfile(address);

  const containerClass = cn(
    sizeClasses[size],
    'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden',
    className
  );

  if (profile?.avatar_url) {
    return (
      <div className={containerClass}>
        <Image
          src={profile.avatar_url}
          alt={profile.username || address}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <User className={cn(iconSizes[size], 'text-white')} />
    </div>
  );
}); 