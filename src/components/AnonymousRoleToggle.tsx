"use client";

import { useSession } from '@/lib/auth/session-context';
import SegmentedRoleToggle from './SegmentedRoleToggle';

interface Props {
  initialActive?: 'crew' | 'employer';
  className?: string;
}

export default function AnonymousRoleToggle({ initialActive = 'crew', className }: Props) {
  const { data: session, status } = useSession();
  // While loading session, avoid flashing the toggle
  if (status === 'loading') return null;
  if (session) return null;
  return <SegmentedRoleToggle initialActive={initialActive} className={className} />;
}
