'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

interface DeletePropertyButtonProps {
  propertyId: string;
  propertyName: string;
}

export default function DeletePropertyButton({ propertyId, propertyName }: DeletePropertyButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) {
      alert('Failed to delete property: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/properties');
    router.refresh();
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-text-dark mb-2">Delete Property</h3>
          <p className="text-text-gray mb-4">
            Are you sure you want to delete &quot;{propertyName}&quot;? This will also delete all devices and sensor data associated with this property. This action cannot be undone.
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
      title="Delete property"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
