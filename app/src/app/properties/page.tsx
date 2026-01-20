import { createServerSupabaseClient } from '@/lib/supabase-server';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyCard from '@/components/PropertyCard';
import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function PropertiesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: devices } = await supabase
    .from('devices')
    .select('id, property_id');

  // Calculate device counts per property
  const deviceCountByProperty: Record<string, number> = {};
  devices?.forEach(d => {
    deviceCountByProperty[d.property_id] = (deviceCountByProperty[d.property_id] || 0) + 1;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">Properties</h1>
            <p className="text-text-gray">Manage your monitored properties</p>
          </div>
          <Link href="/properties/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Property
          </Link>
        </div>

        {/* Properties Grid */}
        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
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
    </DashboardLayout>
  );
}
