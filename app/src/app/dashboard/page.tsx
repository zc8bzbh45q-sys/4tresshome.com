import { createServerSupabaseClient } from '@/lib/supabase-server';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyCard from '@/components/PropertyCard';
import AlertBanner from '@/components/AlertBanner';
import { Building2, Cpu, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';
import type { Property, Device, Alert } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch user's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false }) as { data: Property[] | null };

  // Fetch device counts per property
  const { data: devices } = await supabase
    .from('devices')
    .select('id, property_id, last_seen') as { data: Pick<Device, 'id' | 'property_id' | 'last_seen'>[] | null };

  // Fetch unacknowledged alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, device:devices(name, property_id)')
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(5) as { data: (Alert & { device?: { name: string; property_id: string } })[] | null };

  // Calculate stats
  const propertyCount = properties?.length || 0;
  const deviceCount = devices?.length || 0;
  const onlineDevices = devices?.filter(d =>
    d.last_seen && new Date(d.last_seen).getTime() > Date.now() - 5 * 60 * 1000
  ).length || 0;
  const alertCount = alerts?.length || 0;

  // Calculate device counts per property
  const deviceCountByProperty: Record<string, number> = {};
  devices?.forEach(d => {
    deviceCountByProperty[d.property_id] = (deviceCountByProperty[d.property_id] || 0) + 1;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">Dashboard</h1>
            <p className="text-text-gray">Overview of your properties and devices</p>
          </div>
          <Link href="/properties/new" className="btn-primary">
            Add Property
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="bg-accent/10 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-dark">{propertyCount}</p>
                <p className="text-sm text-text-gray">Properties</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-accent/10 p-3 rounded-lg">
                <Cpu className="w-6 h-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-dark">{deviceCount}</p>
                <p className="text-sm text-text-gray">Total Devices</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-success/10 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-dark">{onlineDevices}</p>
                <p className="text-sm text-text-gray">Online Now</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${alertCount > 0 ? 'bg-danger/10' : 'bg-success/10'}`}>
                <AlertTriangle className={`w-6 h-6 ${alertCount > 0 ? 'text-danger' : 'text-success'}`} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-dark">{alertCount}</p>
                <p className="text-sm text-text-gray">Active Alerts</p>
              </div>
            </div>
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

        {/* Properties */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text-dark">Your Properties</h2>
            <Link href="/properties" className="text-accent hover:text-accent-hover text-sm font-medium">
              View all
            </Link>
          </div>

          {properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.slice(0, 6).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  deviceCount={deviceCountByProperty[property.id] || 0}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Building2 className="w-12 h-12 text-text-gray mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-dark mb-2">No properties yet</h3>
              <p className="text-text-gray mb-4">Add your first property to start monitoring</p>
              <Link href="/properties/new" className="btn-primary">
                Add Property
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
