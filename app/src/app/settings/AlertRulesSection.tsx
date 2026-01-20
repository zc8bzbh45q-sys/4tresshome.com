'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Plus, Trash2, Bell } from 'lucide-react';
import type { Property, AlertRule } from '@/lib/types';

interface AlertRuleWithProperty extends AlertRule {
  property?: { name: string };
}

interface AlertRulesSectionProps {
  properties: Property[];
  alertRules: AlertRuleWithProperty[];
  selectedPropertyId?: string;
}

const readingTypes = [
  { value: 'temperature', label: 'Temperature', defaultUnit: '°F' },
  { value: 'humidity', label: 'Humidity', defaultUnit: '%' },
  { value: 'pressure', label: 'Pressure', defaultUnit: 'hPa' },
];

export default function AlertRulesSection({
  properties,
  alertRules,
  selectedPropertyId,
}: AlertRulesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [propertyId, setPropertyId] = useState(selectedPropertyId || properties[0]?.id || '');
  const [readingType, setReadingType] = useState('temperature');
  const [condition, setCondition] = useState<'above' | 'below'>('below');
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: insertError } = await supabase
      .from('alert_rules')
      .insert({
        property_id: propertyId,
        reading_type: readingType,
        condition,
        threshold: parseFloat(threshold),
        enabled: true,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setShowAddForm(false);
    setThreshold('');
    router.refresh();
    setLoading(false);
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    await supabase
      .from('alert_rules')
      .update({ enabled: !enabled })
      .eq('id', ruleId);
    router.refresh();
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;
    await supabase.from('alert_rules').delete().eq('id', ruleId);
    router.refresh();
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-dark">Alert Rules</h2>
          <p className="text-sm text-text-gray">Get notified when sensor values exceed thresholds</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <div className="bg-bg-light rounded-lg p-4 mb-6">
          <form onSubmit={handleAddRule} className="space-y-4">
            {error && (
              <div className="bg-danger-light text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Property</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="input"
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Reading Type</label>
                <select
                  value={readingType}
                  onChange={(e) => setReadingType(e.target.value)}
                  className="input"
                  required
                >
                  {readingTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                  className="input"
                  required
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>

              <div>
                <label className="label">Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={`e.g., ${readingType === 'temperature' ? '32' : readingType === 'humidity' ? '70' : '1000'}`}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Rule'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {alertRules.length > 0 ? (
        <div className="divide-y divide-border">
          {alertRules.map((rule) => (
            <div key={rule.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-accent/10' : 'bg-gray-100'}`}>
                  <Bell className={`w-5 h-5 ${rule.enabled ? 'text-accent' : 'text-text-gray'}`} />
                </div>
                <div>
                  <p className="font-medium text-text-dark">
                    <span className="capitalize">{rule.reading_type}</span>
                    <span className="text-text-gray mx-2">{rule.condition}</span>
                    <span>{rule.threshold}</span>
                  </p>
                  <p className="text-sm text-text-gray">{rule.property?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  className={`text-sm px-3 py-1 rounded ${
                    rule.enabled
                      ? 'bg-success-light text-green-800'
                      : 'bg-gray-100 text-text-gray'
                  }`}
                >
                  {rule.enabled ? 'Active' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 text-text-gray hover:text-danger hover:bg-danger-light rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-text-gray mx-auto mb-4" />
          <p className="text-text-gray">No alert rules configured yet</p>
          <p className="text-sm text-text-gray mt-1">
            Create your first rule to get notified when conditions change
          </p>
        </div>
      )}
    </div>
  );
}
