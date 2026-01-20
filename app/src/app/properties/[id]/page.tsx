import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import DeviceCard from '@/components/DeviceCard';
import AlertBanner from '@/components/AlertBanner';
import { ArrowLeft, Plus, Cpu, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import DeletePropertyButton from './DeletePropertyButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch property
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !property) {
    notFound();
  }

  // Fetch devices for this property
  const { data: devices } = await supabase
    .from('devices')
    .select('*')
    .eq('property_id', id)
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

  // Fetch active alerts for this property's devices
  const deviceIds = devices?.map(d => d.id) || [];
  const { data: alerts } = deviceIds.length > 0
    ? await supabase
        .from('alerts')
        .select('*, device:devices(name)')
        .in('device_id', deviceIds)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
    : { data: [] };

  // Fetch alert rules
  const { data: alertRules } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('property_id', id)
    .order('created_at', { ascending: false });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link
              href="/properties"
              className="text-text-gray hover:text-text-dark flex items-center gap-2 text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Properties
            </Link>
            <h1 className="text-2xl font-bold text-text-dark">{property.name}</h1>
            <p className="text-text-gray">{property.address || 'No address'}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/devices/new?property=${id}`}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </Link>
            <DeletePropertyButton propertyId={id} propertyName={property.name} />
          </div>
        </div>

        {/* Active Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-dark">Active Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertBanner
                  key={alert.id}
                  alert={alert}
                  deviceName={(alert as any).device?.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Devices */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text-dark">Devices</h2>
            <span className="text-text-gray text-sm">
              {devices?.length || 0} device{(devices?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {devices && devices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  latestReadings={deviceReadings[device.id] || []}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Cpu className="w-12 h-12 text-text-gray mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-dark mb-2">No devices yet</h3>
              <p className="text-text-gray mb-4">Add your first sensor device to start monitoring</p>
              <Link href={`/devices/new?property=${id}`} className="btn-primary">
                Add Device
              </Link>
            </div>
          )}
        </div>

        {/* Alert Rules */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text-dark">Alert Rules</h2>
            <Link
              href={`/settings?property=${id}`}
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              Manage Rules
            </Link>
          </div>

          {alertRules && alertRules.length > 0 ? (
            <div className="card">
              <div className="divide-y divide-border">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <span className="font-medium text-text-dark capitalize">
                        {rule.reading_type}
                      </span>
                      <span className="text-text-gray mx-2">{rule.condition}</span>
                      <span className="font-medium text-text-dark">{rule.threshold}</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      rule.enabled
                        ? 'bg-success-light text-green-800'
                        : 'bg-gray-100 text-text-gray'
                    }`}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-text-gray mb-4">No alert rules configured</p>
              <Link href={`/settings?property=${id}`} className="text-accent hover:text-accent-hover font-medium">
                Set up alert rules
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
