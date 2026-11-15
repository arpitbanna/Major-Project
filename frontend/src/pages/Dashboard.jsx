import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, MapPin, Calendar } from 'lucide-react';
import SummaryCards from '../components/dashboard/SummaryCards';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';

export default function Dashboard() {
  const { user, profile, role, session } = useAuth();

  const [summaryData, setSummaryData] = useState({
    todayHandovers: 0,
    pendingAcknowledgements: 0,
    openHazards: 0,
    pendingSafetyActions: 0,
  });
  const [recentData, setRecentData] = useState({
    handovers: [],
    hazards: [],
    pendingActions: []
  });
  const [tablesInitialized, setTablesInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine current active shift based on 24-hour clock
  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) {
      return { name: 'Shift 1 (Morning)', time: '06:00 – 14:00', code: 'S1' };
    } else if (hour >= 14 && hour < 22) {
      return { name: 'Shift 2 (Afternoon)', time: '14:00 – 22:00', code: 'S2' };
    } else {
      return { name: 'Shift 3 (Night)', time: '22:00 – 06:00', code: 'S3' };
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Fetch summary
      const summaryRes = await fetch('/api/dashboard/summary', { headers });
      if (summaryRes.ok) {
        const result = await summaryRes.json();
        if (result.data) {
          setSummaryData(result.data);
          setTablesInitialized(result.tablesInitialized);
        }
      }

      // Fetch recent activity
      const recentRes = await fetch('/api/dashboard/recent', { headers });
      if (recentRes.ok) {
        const result = await recentRes.json();
        if (result.data) {
          setRecentData(result.data);
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Could not fetch data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchDashboardData();
    }
  }, [session?.access_token]);

  const currentShift = getCurrentShift();
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Mine Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-borderLight rounded p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-status-success"></span>
            <span className="text-xs font-semibold text-slateText-muted uppercase tracking-wider">
              Operational Shift Control
            </span>
          </div>
          <h1 className="text-xl font-bold text-slateText">
            Mine Operations & Safety Dashboard
          </h1>
          <p className="text-xs text-slateText-secondary mt-1">
            {user ? (
              <>
                Welcome back, <span className="font-semibold text-slateText">{profile?.full_name || user.email}</span>
                {role && (
                  <span className="ml-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-primary-light text-primary border border-blue-200">
                    {role}
                  </span>
                )}
              </>
            ) : (
              'Centralized shift handover logging & safety management system'
            )}
          </p>
        </div>

        {/* Operational Context Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Active Shift */}
          <div className="flex items-center gap-1.5 bg-background border border-borderLight px-3 py-2 rounded">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <div>
              <p className="text-[10px] text-slateText-muted leading-none">Active Shift</p>
              <p className="font-semibold text-slateText mt-0.5">{currentShift.name}</p>
            </div>
          </div>

          {/* Mine Location / Section */}
          <div className="flex items-center gap-1.5 bg-background border border-borderLight px-3 py-2 rounded">
            <MapPin className="w-3.5 h-3.5 text-slateText-secondary" />
            <div>
              <p className="text-[10px] text-slateText-muted leading-none">Mine Section</p>
              <p className="font-semibold text-slateText mt-0.5">
                {profile?.mine_section || 'Colliery Sec-1'}
              </p>
            </div>
          </div>

          {/* Current Date */}
          <div className="flex items-center gap-1.5 bg-background border border-borderLight px-3 py-2 rounded">
            <Calendar className="w-3.5 h-3.5 text-slateText-secondary" />
            <div>
              <p className="text-[10px] text-slateText-muted leading-none">Date</p>
              <p className="font-semibold text-slateText mt-0.5">{todayFormatted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Section */}
      <SummaryCards
        data={summaryData}
        loading={loading}
        tablesInitialized={tablesInitialized}
        onRefresh={fetchDashboardData}
      />

      {/* Operational Shortcuts / Quick Actions */}
      <QuickActions />

      {/* Recent Activity Section */}
      <RecentActivity
        recentData={recentData}
        loading={loading}
      />
    </div>
  );
}
