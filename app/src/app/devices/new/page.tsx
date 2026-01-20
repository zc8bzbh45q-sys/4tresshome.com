'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Property } from '@/lib/types';

const deviceTypes = [
  { value: 'multi_sensor', label: 'Multi-Sensor (Temperature, Humidity, Pressure)' },
  { value: 'temperature', label: 'Temperature Only' },
  { value: 'water_leak', label: 'Water Leak Detector' },
  { value: 'presence', label: 'Presence/Motion Sensor' },
];

function NewDeviceForm() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('multi_sensor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const fetchProperties = async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .order('name') as { data: Property[] | null };
      if (data) {
        setProperties(data);
        // Set default property from URL param or first property
        const urlProperty = searchParams.get('property');
        if (urlProperty && data.find(p => p.id === urlProperty)) {
          setPropertyId(urlProperty);
        } else if (data.length > 0) {
          setPropertyId(data[0].id);
        }
      }
    };
    fetchProperties();
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!propertyId) {
      setError('Please select a property');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('devices')
      .insert({
        property_id: propertyId,
        name,
        device_type: deviceType,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/properties/${propertyId}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/devices"
          className="text-text-gray hover:text-text-dark flex items-center gap-2 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Devices
        </Link>
        <h1 className="text-2xl font-bold text-text-dark">Add New Device</h1>
        <p className="text-text-gray">Register a new sensor device</p>
      </div>

      {/* Form */}
      <div className="card">
        {properties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-gray mb-4">You need to create a property before adding devices.</p>
            <Link href="/properties/new" className="btn-primary">
              Create Property
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger-light text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="property" className="label">
                Property *
              </label>
              <select
                id="property"
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="input"
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="label">
                Device Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Living Room Sensor, Basement Monitor"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="deviceType" className="label">
                Device Type *
              </label>
              <select
                id="deviceType"
                required
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="input"
              >
                {deviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Device'}
              </button>
              <Link href="/devices" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function NewDevicePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <NewDeviceForm />
      </Suspense>
    </DashboardLayout>
  );
}
