'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ChatApp = dynamic(() => import('@/app/(ai)/chatbot/_components/ChatApp'), {
  ssr: false,
  loading: () => null,
});

/**
 * ChatbotWidget - Global floating chatbot available across the entire application
 *
 * Auto-detects:
 * - User authentication state (via isUserAuthenticated in ChatApp)
 * - Query classification (via classifyQuery in ChatApp)
 * - Public vs authenticated capabilities (via backend authorization)
 *
 * ChatApp handles all the logic internally:
 * - Guest users see public/general questions
 * - Authenticated users see full capabilities
 * - Backend enforces authorization on all protected endpoints
 */
export default function ChatbotWidget() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return <ChatApp />;
}
