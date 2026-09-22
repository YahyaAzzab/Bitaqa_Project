'use client';

import { useEffect, useState } from 'react';
import { ProfilesList, type ProfileListItem } from '@/features/profiles/profiles-list';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfilesClient() {
  const [profiles, setProfiles] = useState<ProfileListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/dashboard/profiles')
      .then(async (res) => {
        if (!res.ok) throw new Error('fail');
        return res.json() as Promise<{ profiles: ProfileListItem[] }>;
      })
      .then((json) => {
        if (!cancelled) setProfiles(json.profiles);
      })
      .catch(() => {
        if (!cancelled) setProfiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!profiles) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    );
  }

  return <ProfilesList profiles={profiles} />;
}
