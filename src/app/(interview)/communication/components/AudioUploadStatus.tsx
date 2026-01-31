'use client';

import { useState, useEffect } from 'react';
import { getAudioStatus } from '@/api/communicationApi';
import logger from '@/lib/logger';

interface AudioUploadStatusProps {
  sessionId: string;
  totalQuestions?: number;
  pollInterval?: number;
  onStatusChange?: (status: {
    completed: number;
    failed: number;
    processing: number;
  }) => void;
}

export function AudioUploadStatus({
  sessionId,
  totalQuestions = 44,
  pollInterval = 5000,
  onStatusChange,
}: AudioUploadStatusProps) {
  const [status, setStatus] = useState({
    completed: 0,
    processing: 0,
    failed: 0,
    missing: totalQuestions,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchStatus = async () => {
      try {
        const data = await getAudioStatus(sessionId);
        const newStatus = {
          completed: data.completed,
          processing: data.processing,
          failed: data.failed,
          missing: data.missing,
        };
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      } catch (error) {
        logger.error('Failed to fetch audio status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [sessionId, pollInterval, onStatusChange]);

  const percentage = Math.round((status.completed / totalQuestions) * 100);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          Audio Processing
        </span>
        <span className="text-sm text-gray-500">
          {status.completed}/{totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status breakdown */}
      <div className="flex gap-4 text-xs">
        <span className="text-green-600">
          {status.completed} done
        </span>
        {status.processing > 0 && (
          <span className="text-blue-600">
            {status.processing} processing
          </span>
        )}
        {status.failed > 0 && (
          <span className="text-red-600">
            {status.failed} failed
          </span>
        )}
      </div>

      {/* Warning for failed */}
      {status.failed > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
          Some recordings failed. They will be retried automatically.
        </div>
      )}
    </div>
  );
}

export default AudioUploadStatus;
