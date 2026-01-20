import { createServerSupabaseClient } from '@/lib/supabase-server';
import DashboardLayout from '@/components/DashboardLayout';
import DeviceCard from '@/components/DeviceCard';
import { Cpu, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function DevicesPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all devices with their property info
  const { data: devices } = await supabase
    .from('devices')
    .select('*, property:properties(name)')
    .order('created_at', { ascending: false });

  // Fetch latest readings for each device
  const deviceReadings: Record<string, any[]> = {};
  if (devices) {
    for (const device of devices) {
      const { data: readings } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', device.id)
        .order('recorded_at', { ascending: false })
        .limit(3);
      if (readings) {
        deviceReadings[device.id] = readings;
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">Devices</h1>
            <p className="text-text-gray">All your sensor devices</p>
          </div>
          <Link href="/devices/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Device
          </Link>
        </div>

        {/* Devices Grid */}
        {devices && devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                latestReadings={deviceReadings[device.id] || []}
                showPropertyLink
                propertyName={(device as any).property?.name}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Cpu className="w-12 h-12 text-text-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-dark mb-2">No devices yet</h3>
            <p className="text-text-gray mb-4">Add your first sensor device to start monitoring</p>
            <Link href="/devices/new" className="btn-primary">
              Add Device
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
