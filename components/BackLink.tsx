'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** Goes back in history when there is somewhere to go back to, so list scroll position is kept. */
export default function BackLink({ fallback = '/', label = '뒤로' }: { fallback?: string; label?: string }) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(typeof window !== 'undefined' && window.history.length > 1);
  }, []);

  if (!canGoBack) {
    return <Link href={fallback} className="back"><Icon name="back" size={16} />{label}</Link>;
  }
  return (
    <button type="button" className="back" onClick={() => router.back()}>
      <Icon name="back" size={16} />{label}
    </button>
  );
}
