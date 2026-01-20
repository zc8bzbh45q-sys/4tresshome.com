'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

interface DeleteDeviceButtonProps {
  deviceId: string;
  deviceName: string;
  propertyId: string;
}

export default function DeleteDeviceButton({ deviceId, deviceName, propertyId }: DeleteDeviceButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      alert('Failed to delete device: ' + error.message);
      setLoading(false);
      return;
    }

    router.push(`/properties/${propertyId}`);
    router.refresh();
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-text-dark mb-2">Delete Device</h3>
          <p className="text-text-gray mb-4">
            Are you sure you want to delete &quot;{deviceName}&quot;? This will also delete all sensor data and alerts. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn-danger flex-1 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="btn-secondary text-danger hover:bg-danger-light"
      title="Delete device"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
