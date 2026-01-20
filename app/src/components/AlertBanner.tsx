'use client';

import { AlertTriangle, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Alert } from '@/lib/types';

interface AlertBannerProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  deviceName?: string;
}

export default function AlertBanner({ alert, onAcknowledge, deviceName }: AlertBannerProps) {
  if (alert.acknowledged) return null;

  return (
    <div className="bg-danger-light border-l-4 border-danger p-4 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-danger mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium text-danger">
              {deviceName && <span>{deviceName}: </span>}
              {alert.message}
            </p>
            <p className="text-sm text-text-gray mt-1">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {onAcknowledge && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="ml-4 p-1 hover:bg-danger/10 rounded transition-colors"
            title="Acknowledge alert"
          >
            <Check className="w-5 h-5 text-danger" />
          </button>
        )}
      </div>
    </div>
  );
}
