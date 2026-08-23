import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Calendar, Users, Truck, Sparkles, Shield,
  Settings, ClipboardList, LayoutDashboard, Flame, Image, Coins
} from 'lucide-react';

interface Stats {
  todayEvents: number;
  upcomingEvents: number;
  membersCount: number;
  juniorsCount: number;
  volunteersCount: number;
  katheCount: number;
  prasadaPending: number;
  prasadaDelivered: number;
  auctionUnpaid: number;
}

interface AuditLog {
  _id: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  timestamp: string;
}

export const AdminDashboard: React.FC = () => {
  const { isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(res => {
      if (res.data.status === 'success') {
        setStats(res.data.stats);
        setLogs(res.data.recentLogs);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-accent-dark" />
            <span>Administrative Dashboard</span>
          </h1>
          <p className="text-xs text-charcoal-light">
            Manage events, membership lists, Satya Ganapati registrations, and prasada delivery operations.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/settings"
            className="flex items-center gap-1.5 text-xs font-bold uppercase border border-warm-dark bg-white hover:bg-warm px-3 py-2 rounded-lg text-charcoal transition"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          {isSuperAdmin && (
            <Link
              to="/admin/audit-logs"
              className="flex items-center gap-1.5 text-xs font-bold uppercase border border-warm-dark bg-white hover:bg-warm px-3 py-2 rounded-lg text-charcoal transition"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Audit Logs</span>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">Loading dashboard stats...</div>
      ) : (
        <>
          {/* Stats Overview Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-warm-dark p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-charcoal-light uppercase">Today's Events</span>
                <span className="text-3xl font-extrabold text-primary block">{stats.todayEvents}</span>
              </div>
              
              <div className="bg-white border border-warm-dark p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-charcoal-light uppercase">Total Members</span>
                <span className="text-3xl font-extrabold text-charcoal block">{stats.membersCount}</span>
              </div>

              <div className="bg-white border border-warm-dark p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-charcoal-light uppercase">Prasada Pending</span>
                <span className="text-3xl font-extrabold text-secondary block">{stats.prasadaPending}</span>
              </div>

              <div className="bg-white border border-warm-dark p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-xs font-bold text-charcoal-light uppercase">Kathe Registrations</span>
                <span className="text-3xl font-extrabold text-accent-dark block">{stats.katheCount}</span>
              </div>
            </div>
          )}

          {/* Quick Management Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-primary border-b border-warm-dark pb-2">
                Operational Management Panels
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/admin/events"
                  className="bg-white rounded-xl border border-warm-dark p-5 hover:border-accent transition group"
                >
                  <Calendar className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-bold text-charcoal group-hover:text-primary transition">Events Manager</h3>
                  <p className="text-xs text-charcoal-light mt-1">Create, update, delete, and duplicate Ganeshotsava daily events.</p>
                </Link>

                <Link
                  to="/admin/members"
                  className="bg-white rounded-xl border border-warm-dark p-5 hover:border-accent transition group"
                >
                  <Users className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-bold text-charcoal group-hover:text-secondary transition">Members & Teams</h3>
                  <p className="text-xs text-charcoal-light mt-1">Manage committee lists, teams mapping, and volunteers assignments.</p>
                </Link>

                <Link
                  to="/admin/prasada"
                  className="bg-white rounded-xl border border-warm-dark p-5 hover:border-accent transition group"
                >
                  <Truck className="h-8 w-8 text-accent-dark mb-3" />
                  <h3 className="font-bold text-charcoal group-hover:text-accent-dark transition">Prasada Delivery</h3>
                  <p className="text-xs text-charcoal-light mt-1">Update status of deliveries for area volunteers from a mobile-friendly view.</p>
                </Link>

                <Link
                  to="/admin/gallery"
                  className="bg-white rounded-xl border border-warm-dark p-5 hover:border-accent transition group"
                >
                  <Image className="h-8 w-8 text-accent-dark mb-3" />
                  <h3 className="font-bold text-charcoal group-hover:text-accent-dark transition">Gallery & Videos</h3>
                  <p className="text-xs text-charcoal-light mt-1">Upload celebration photos and YouTube links to public pages.</p>
                </Link>

                <Link
                  to="/admin/financials"
                  className="bg-white rounded-xl border border-warm-dark p-5 hover:border-accent transition group"
                >
                  <Coins className="h-8 w-8 text-emerald-600 mb-3" />
                  <h3 className="font-bold text-charcoal group-hover:text-emerald-600 transition">Jama Karchu & Donors</h3>
                  <p className="text-xs text-charcoal-light mt-1">Edit audited receipts, expenditures balance sheets, and donors list.</p>
                </Link>

                {isSuperAdmin && (
                  <Link
                    to="/admin/users"
                    className="bg-white rounded-xl border border-warm-dark p-5 hover:border-accent transition group"
                  >
                    <Shield className="h-8 w-8 text-emerald-600 mb-3" />
                    <h3 className="font-bold text-charcoal group-hover:text-emerald-600 transition">Administrators</h3>
                    <p className="text-xs text-charcoal-light mt-1">Configure additional logins, update passwords, and roles.</p>
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Action logs */}
            <div className="bg-white rounded-xl border border-warm-dark p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-primary border-b border-warm-dark pb-2">
                Recent Audit Trail
              </h2>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map(log => (
                    <div key={log._id} className="text-xs border-b border-warm-dark/50 pb-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{log.action}</span>
                        <span className="text-[10px] text-charcoal-light">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-charcoal-light">By: {log.user} ({log.role})</p>
                      <p className="text-[10px] text-charcoal-light/60">Entity: {log.entity}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-charcoal-light text-center py-6">No logs recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
