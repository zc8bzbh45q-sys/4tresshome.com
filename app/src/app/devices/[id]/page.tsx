import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SensorChart from '@/components/SensorChart';
import AlertBanner from '@/components/AlertBanner';
import { ArrowLeft, Thermometer, Droplets, Gauge, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import CopyApiKey from './CopyApiKey';
import DeleteDeviceButton from './DeleteDeviceButton';
import type { Device, SensorReading, Alert } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}

interface DeviceWithProperty extends Device {
  property?: { id: string; name: string };
}

export default async function DeviceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { range = '24h' } = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Fetch device with property info
  const { data: device, error } = await supabase
    .from('devices')
    .select('*, property:properties(id, name)')
    .eq('id', id)
    .single() as { data: DeviceWithProperty | null; error: any };

  if (error || !device) {
    notFound();
  }

  // Calculate time range
  const now = new Date();
  let startTime: Date;
  switch (range) {
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Fetch sensor readings
  const { data: readings } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('device_id', id)
    .gte('recorded_at', startTime.toISOString())
    .order('recorded_at', { ascending: true }) as { data: SensorReading[] | null };

  // Fetch active alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('device_id', id)
    .eq('acknowledged', false)
    .order('created_at', { ascending: false }) as { data: Alert[] | null };

  // Get latest readings by type
  const latestByType: Record<string, any> = {};
  if (readings) {
    for (const reading of [...readings].reverse()) {
      if (!latestByType[reading.reading_type]) {
        latestByType[reading.reading_type] = reading;
      }
    }
  }

  const isOnline = device.last_seen &&
    new Date(device.last_seen).getTime() > Date.now() - 5 * 60 * 1000;

  const property = device.property as any;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link
              href={`/properties/${property?.id}`}
              className="text-text-gray hover:text-text-dark flex items-center gap-2 text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {property?.name || 'Property'}
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-dark">{device.name}</h1>
              <span className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                isOnline ? 'bg-success-light text-green-800' : 'bg-gray-100 text-text-gray'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-text-gray capitalize">{device.device_type.replace('_', ' ')}</p>
          </div>
          <DeleteDeviceButton deviceId={id} deviceName={device.name} propertyId={property?.id} />
        </div>

        {/* Active Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertBanner key={alert.id} alert={alert} />
            ))}
          </div>
        )}

        {/* Current Readings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {latestByType.temperature && (
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Thermometer className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-dark">
                    {latestByType.temperature.value.toFixed(1)}{latestByType.temperature.unit}
                  </p>
                  <p className="text-sm text-text-gray">Temperature</p>
                </div>
              </div>
            </div>
          )}
          {latestByType.humidity && (
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Droplets className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-dark">
                    {latestByType.humidity.value.toFixed(1)}{latestByType.humidity.unit}
                  </p>
                  <p className="text-sm text-text-gray">Humidity</p>
                </div>
              </div>
            </div>
          )}
          {latestByType.pressure && (
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Gauge className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-dark">
                    {latestByType.pressure.value.toFixed(0)} {latestByType.pressure.unit}
                  </p>
                  <p className="text-sm text-text-gray">Pressure</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <Link
            href={`/devices/${id}?range=24h`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              range === '24h' ? 'bg-accent text-white' : 'bg-bg-white text-text-gray hover:bg-bg-light'
            }`}
          >
            24 Hours
          </Link>
          <Link
            href={`/devices/${id}?range=7d`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              range === '7d' ? 'bg-accent text-white' : 'bg-bg-white text-text-gray hover:bg-bg-light'
            }`}
          >
            7 Days
          </Link>
          <Link
            href={`/devices/${id}?range=30d`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              range === '30d' ? 'bg-accent text-white' : 'bg-bg-white text-text-gray hover:bg-bg-light'
            }`}
          >
            30 Days
          </Link>
        </div>

        {/* Charts */}
        {readings && readings.length > 0 ? (
          <div className="space-y-6">
            <SensorChart
              readings={readings.filter(r => r.reading_type === 'temperature')}
              title="Temperature"
              color="#3182CE"
              unit="°F"
            />
            <SensorChart
              readings={readings.filter(r => r.reading_type === 'humidity')}
              title="Humidity"
              color="#48BB78"
              unit="%"
            />
            <SensorChart
              readings={readings.filter(r => r.reading_type === 'pressure')}
              title="Pressure"
              color="#ED8936"
              unit="hPa"
            />
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-text-gray">No sensor data available for this time range</p>
          </div>
        )}

        {/* Device Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-dark mb-4">Device Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-gray">Last Seen</span>
              <span className="text-text-dark">
                {device.last_seen
                  ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-gray">Created</span>
              <span className="text-text-dark">
                {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-gray">API Key</span>
                <CopyApiKey apiKey={device.api_key} />
              </div>
              <p className="text-xs text-text-gray">
                Use this key to authenticate sensor data from your ESP32 device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
