'use client';

import Link from 'next/link';
import { Building2, Cpu, AlertTriangle } from 'lucide-react';
import type { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
  deviceCount?: number;
  alertCount?: number;
}

export default function PropertyCard({ property, deviceCount = 0, alertCount = 0 }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.id}`}>
      <div className="card hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-accent/10 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-text-dark">{property.name}</h3>
              <p className="text-sm text-text-gray">{property.address || 'No address'}</p>
            </div>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center bg-danger-light px-2 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4 text-danger mr-1" />
              <span className="text-sm font-medium text-danger">{alertCount}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center text-sm text-text-gray">
          <Cpu className="w-4 h-4 mr-1" />
          <span>{deviceCount} device{deviceCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </Link>
  );
}
