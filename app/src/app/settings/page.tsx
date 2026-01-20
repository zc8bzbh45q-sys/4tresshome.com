import { createServerSupabaseClient } from '@/lib/supabase-server';
import DashboardLayout from '@/components/DashboardLayout';
import AlertRulesSection from './AlertRulesSection';
import { Settings } from 'lucide-react';

interface Props {
  searchParams: Promise<{ property?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const { property: selectedPropertyId } = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Fetch user's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('name');

  // Fetch alert rules
  const { data: alertRules } = await supabase
    .from('alert_rules')
    .select('*, property:properties(name)')
    .order('created_at', { ascending: false });

  // Get user info
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Settings</h1>
          <p className="text-text-gray">Manage your alert rules and account settings</p>
        </div>

        {/* Account Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-dark mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-gray">Email</span>
              <span className="text-text-dark">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-text-gray">Account Created</span>
              <span className="text-text-dark">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Alert Rules */}
        <AlertRulesSection
          properties={properties || []}
          alertRules={alertRules || []}
          selectedPropertyId={selectedPropertyId}
        />
      </div>
    </DashboardLayout>
  );
}
