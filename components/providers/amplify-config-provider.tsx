'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from '@/lib/amplify-config';

export function AmplifyConfigProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Amplify.configure(amplifyConfig, { ssr: true });
  }, []);

  return <>{children}</>;
}
