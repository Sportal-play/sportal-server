'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    // TODO: Use NextAuth.js session here
    setDebug({ info: 'Implement NextAuth.js callback/session logic here.' });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white">
      <p className="mb-4">Please wait while we sign you in...</p>
      {debug && (
        <div className="bg-gray-900 p-4 rounded mt-4 w-full max-w-xl break-all">
          <h2 className="font-bold mb-2 text-red-400">Debug Info</h2>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 