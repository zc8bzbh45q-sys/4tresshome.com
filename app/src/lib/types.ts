// Database Types for 4tress

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Device {
  id: string;
  property_id: string;
  name: string;
  device_type: 'temperature' | 'water_leak' | 'presence' | 'multi_sensor';
  api_key: string;
  last_seen: string | null;
  created_at: string;
}

export interface SensorReading {
  id: string;
  device_id: string;
  reading_type: 'temperature' | 'humidity' | 'pressure' | 'water_detected' | 'presence';
  value: number;
  unit: string;
  recorded_at: string;
}

export interface AlertRule {
  id: string;
  property_id: string;
  reading_type: string;
  condition: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_rule_id: string;
  device_id: string;
  value: number;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

// Extended types with relations
export interface PropertyWithDevices extends Property {
  devices: Device[];
}

export interface DeviceWithReadings extends Device {
  sensor_readings: SensorReading[];
  property?: Property;
}

export interface AlertWithDetails extends Alert {
  alert_rule?: AlertRule;
  device?: Device;
}

// Form types
export interface CreatePropertyInput {
  name: string;
  address: string;
}

export interface CreateDeviceInput {
  property_id: string;
  name: string;
  device_type: Device['device_type'];
}

export interface CreateAlertRuleInput {
  property_id: string;
  reading_type: string;
  condition: 'above' | 'below';
  threshold: number;
  enabled?: boolean;
}

// API types for sensor data ingestion
export interface SensorDataPayload {
  device_id: string;
  api_key: string;
  readings: {
    type: string;
    value: number;
    unit: string;
  }[];
}

// Dashboard summary types
export interface PropertySummary {
  property: Property;
  device_count: number;
  active_alerts: number;
  latest_readings: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
  };
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'created_at'>;
        Update: Partial<Omit<Property, 'id' | 'created_at'>>;
      };
      devices: {
        Row: Device;
        Insert: Omit<Device, 'id' | 'api_key' | 'last_seen' | 'created_at'>;
        Update: Partial<Omit<Device, 'id' | 'api_key' | 'created_at'>>;
      };
      sensor_readings: {
        Row: SensorReading;
        Insert: Omit<SensorReading, 'id'>;
        Update: Partial<Omit<SensorReading, 'id'>>;
      };
      alert_rules: {
        Row: AlertRule;
        Insert: Omit<AlertRule, 'id' | 'created_at'>;
        Update: Partial<Omit<AlertRule, 'id' | 'created_at'>>;
      };
      alerts: {
        Row: Alert;
        Insert: Omit<Alert, 'id' | 'created_at'>;
        Update: Partial<Omit<Alert, 'id' | 'created_at'>>;
      };
    };
  };
}
