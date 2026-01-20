'use client';

import Link from 'next/link';
import { Cpu, Thermometer, Droplets, Users, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import type { Device, SensorReading } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface DeviceCardProps {
  device: Device;
  latestReadings?: SensorReading[];
  showPropertyLink?: boolean;
  propertyName?: string;
}

const deviceTypeIcons = {
  temperature: Thermometer,
  water_leak: Droplets,
  presence: Users,
  multi_sensor: Cpu,
};

export default function DeviceCard({ device, latestReadings = [], showPropertyLink, propertyName }: DeviceCardProps) {
  const Icon = deviceTypeIcons[device.device_type] || Cpu;
  const isOnline = device.last_seen &&
    new Date(device.last_seen).getTime() > Date.now() - 5 * 60 * 1000; // 5 minutes

  const getReadingDisplay = () => {
    if (latestReadings.length === 0) return null;

    const temp = latestReadings.find(r => r.reading_type === 'temperature');
    const humidity = latestReadings.find(r => r.reading_type === 'humidity');

    return (
      <div className="flex gap-4 mt-3">
        {temp && (
          <div className="flex items-center text-sm">
            <Thermometer className="w-4 h-4 text-accent mr-1" />
            <span className="font-medium">{temp.value.toFixed(1)}{temp.unit}</span>
          </div>
        )}
        {humidity && (
          <div className="flex items-center text-sm">
            <Droplets className="w-4 h-4 text-accent mr-1" />
            <span className="font-medium">{humidity.value.toFixed(1)}{humidity.unit}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Link href={`/devices/${device.id}`}>
      <div className="card hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${isOnline ? 'bg-success/10' : 'bg-text-gray/10'}`}>
              <Icon className={`w-6 h-6 ${isOnline ? 'text-success' : 'text-text-gray'}`} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-text-dark">{device.name}</h3>
              <p className="text-sm text-text-gray capitalize">{device.device_type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center">
            {isOnline ? (
              <div className="flex items-center text-success text-sm">
                <Wifi className="w-4 h-4 mr-1" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center text-text-gray text-sm">
                <WifiOff className="w-4 h-4 mr-1" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>

        {getReadingDisplay()}

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-text-gray">
          {showPropertyLink && propertyName && (
            <span>{propertyName}</span>
          )}
          <span>
            {device.last_seen
              ? `Last seen ${formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}`
              : 'Never seen'}
          </span>
        </div>
      </div>
    </Link>
  );
}
