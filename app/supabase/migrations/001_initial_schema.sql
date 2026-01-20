-- 4tress Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('temperature', 'water_leak', 'presence', 'multi_sensor')),
    api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor readings table
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('temperature', 'humidity', 'pressure', 'water_detected', 'presence')),
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert rules table
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    threshold NUMERIC NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Properties
CREATE INDEX idx_properties_user_id ON properties(user_id);

-- Devices
CREATE INDEX idx_devices_property_id ON devices(property_id);
CREATE INDEX idx_devices_api_key ON devices(api_key);

-- Sensor readings
CREATE INDEX idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);
CREATE INDEX idx_sensor_readings_device_type ON sensor_readings(device_id, reading_type, recorded_at DESC);

-- Alert rules
CREATE INDEX idx_alert_rules_property_id ON alert_rules(property_id);

-- Alerts
CREATE INDEX idx_alerts_device_id ON alerts(device_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_unacknowledged ON alerts(acknowledged) WHERE acknowledged = false;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Properties policies
CREATE POLICY "Users can view own properties"
    ON properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own properties"
    ON properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
    ON properties FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
    ON properties FOR DELETE
    USING (auth.uid() = user_id);

-- Devices policies
CREATE POLICY "Users can view devices of own properties"
    ON devices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = devices.property_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create devices for own properties"
    ON devices FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update devices of own properties"
    ON devices FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = devices.property_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete devices of own properties"
    ON devices FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = devices.property_id
            AND properties.user_id = auth.uid()
        )
    );

-- Sensor readings policies
CREATE POLICY "Users can view readings of own devices"
    ON sensor_readings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices
            JOIN properties ON properties.id = devices.property_id
            WHERE devices.id = sensor_readings.device_id
            AND properties.user_id = auth.uid()
        )
    );

-- Allow devices to insert readings via API key (handled by Edge Function)
CREATE POLICY "Service role can insert readings"
    ON sensor_readings FOR INSERT
    WITH CHECK (true);

-- Alert rules policies
CREATE POLICY "Users can view own alert rules"
    ON alert_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = alert_rules.property_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create alert rules for own properties"
    ON alert_rules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own alert rules"
    ON alert_rules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = alert_rules.property_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own alert rules"
    ON alert_rules FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = alert_rules.property_id
            AND properties.user_id = auth.uid()
        )
    );

-- Alerts policies
CREATE POLICY "Users can view own alerts"
    ON alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices
            JOIN properties ON properties.id = devices.property_id
            WHERE devices.id = alerts.device_id
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own alerts"
    ON alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM devices
            JOIN properties ON properties.id = devices.property_id
            WHERE devices.id = alerts.device_id
            AND properties.user_id = auth.uid()
        )
    );

-- Service role can insert alerts (for trigger function)
CREATE POLICY "Service role can insert alerts"
    ON alerts FOR INSERT
    WITH CHECK (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check alerts when new reading is inserted
CREATE OR REPLACE FUNCTION check_alert_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    device_record RECORD;
    should_alert BOOLEAN;
BEGIN
    -- Get the device's property
    SELECT d.*, p.id as prop_id
    INTO device_record
    FROM devices d
    JOIN properties p ON p.id = d.property_id
    WHERE d.id = NEW.device_id;

    -- Check all enabled alert rules for this property and reading type
    FOR rule IN
        SELECT * FROM alert_rules
        WHERE property_id = device_record.prop_id
        AND reading_type = NEW.reading_type
        AND enabled = true
    LOOP
        should_alert := false;

        IF rule.condition = 'above' AND NEW.value > rule.threshold THEN
            should_alert := true;
        ELSIF rule.condition = 'below' AND NEW.value < rule.threshold THEN
            should_alert := true;
        END IF;

        IF should_alert THEN
            INSERT INTO alerts (alert_rule_id, device_id, value, message)
            VALUES (
                rule.id,
                NEW.device_id,
                NEW.value,
                CASE
                    WHEN rule.condition = 'above' THEN
                        NEW.reading_type || ' is ' || NEW.value || NEW.unit || ' (above ' || rule.threshold || ')'
                    ELSE
                        NEW.reading_type || ' is ' || NEW.value || NEW.unit || ' (below ' || rule.threshold || ')'
                END
            );
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check alerts on new readings
CREATE TRIGGER trigger_check_alerts
    AFTER INSERT ON sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION check_alert_rules();

-- Function to update device last_seen timestamp
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE devices
    SET last_seen = NOW()
    WHERE id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_seen on new readings
CREATE TRIGGER trigger_update_last_seen
    AFTER INSERT ON sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_device_last_seen();

-- =============================================
-- REAL-TIME SUBSCRIPTIONS
-- =============================================

-- Enable real-time for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
