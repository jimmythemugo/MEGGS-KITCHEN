import { Link, useLocation } from 'wouter';
import { AdminOwnerCopilot } from '@/components/admin/AdminOwnerCopilot';
import type { Product, Order } from '@/lib/types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Users,
  Image,
  Users2,
  FileText,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Palette,
  LayoutTemplate,
  Truck,
  FolderKanban,
  Megaphone,
  Warehouse,
  BarChart3,
  Tag,
  Folder,
  Search,
  Wrench,
  ShieldCheck,
  ClipboardList,
  Sliders,
  Layers,
  FileText as FileDoc,
  Database,
  Shield,
  Navigation,
  Building2,
  PackageCheck,
  ArrowLeftRight,
  AlertOctagon,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Bell,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  PieChart,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-data';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatKES } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Sales & Orders',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/invoices', label: 'Invoices', icon: FileText },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/crm', label: 'Sales Leads', icon: Users },
      { href: '/admin/quotations', label: 'Quotes & Estimates', icon: FileText },
    ],
  },
  {
    label: 'Products & Stock',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/pim', label: 'Product Details', icon: Sliders },
      { href: '/admin/inventory', label: 'Stock Levels', icon: Warehouse },
      { href: '/admin/stock-transfers', label: 'Update Stock', icon: ArrowLeftRight },
      { href: '/admin/warehouses', label: 'Stores & Warehouses', icon: Building2 },
      { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/admin/purchase-orders', label: 'Stock Orders', icon: PackageCheck },
      { href: '/admin/damages-returns', label: 'Returns & Damaged Items', icon: AlertOctagon },
      { href: '/admin/product-specifications', label: 'Product Specs', icon: ClipboardList },
      { href: '/admin/product-variants', label: 'Product Options', icon: Layers },
      { href: '/admin/product-documents', label: 'Product Manuals', icon: FileDoc },
      { href: '/admin/services', label: 'Services', icon: Wrench },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: LayoutTemplate },
      { href: '/admin/hero-slides', label: 'Banners', icon: Image },
      { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
      { href: '/admin/product-brands', label: 'Brands', icon: ShieldCheck },
      { href: '/admin/pages', label: 'Website Pages', icon: FileText },
      { href: '/admin/media-library', label: 'Photos', icon: Folder },
      { href: '/admin/theme', label: 'Appearance', icon: Palette },
      { href: '/admin/navigation', label: 'Menus', icon: Navigation },
    ],
  },
  {
    label: 'Offers & Marketing',
    items: [
      { href: '/admin/promotions', label: 'Offers', icon: Megaphone },
      { href: '/admin/coupons', label: 'Discount Codes', icon: Tag },
      { href: '/admin/marketing', label: 'Marketing', icon: Sparkles },
      { href: '/admin/delivery-zones', label: 'Delivery Areas', icon: Truck },
      { href: '/admin/testimonials', label: 'Customer Reviews', icon: Users2 },
      { href: '/admin/partners', label: 'Partners', icon: Users2 },
    ],
  },
  {
    label: 'Settings & Admin',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/admin/email-templates', label: 'Email Notices', icon: Mail },
      { href: '/admin/seo', label: 'Search Rankings (SEO)', icon: Search },
      { href: '/admin/roles', label: 'Users & Permissions', icon: ShieldCheck },
      { href: '/admin/import-export', label: 'Excel Import / Export', icon: FileSpreadsheet },
      { href: '/admin/site-settings', label: 'Shop Settings', icon: Globe },
      { href: '/admin/backups', label: 'Backups', icon: Database },
      { href: '/admin/audit-logs', label: 'Activity Log', icon: Shield },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function AdminLayout({ children, title }: AdminLayoutProps) {
  const { logout, currentUser, role } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return location === '/admin';
    return location.startsWith(href);
  };

  // Staff restriction filter for nav items
  const filteredNavGroups = NAV_GROUPS.map((group) => {
    if (role === 'Staff') {
      return {
        ...group,
        items: group.items.filter((item) => 
          !['/admin/roles', '/admin/site-settings', '/admin/backups', '/admin/theme'].includes(item.href)
        ),
      };
    }
    return group;
  }).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-navy-600 hover:text-primary-600"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="font-display font-bold text-navy-900">MEGGS KITCHEN</span>
        <button
          onClick={handleLogout}
          className="p-2 text-navy-500 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="w-10 h-10 rounded-full border-2 border-navy-900 flex items-center justify-center flex-shrink-0 bg-navy-950 text-amber-400 shadow-sm">
            <span className="font-display font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-navy-900 leading-tight">
              MEGGS KITCHEN
            </h1>
            <p className="text-xs text-amber-600 font-semibold">{role === 'Staff' ? 'Staff Portal' : 'Owner Portal'}</p>
          </div>
        </div>

        {/* Current Active Account Card */}
        <div className="mx-3 mt-3 p-3 bg-navy-50/60 rounded-xl border border-navy-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy-950 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-navy-900 truncate">{currentUser?.name || 'Authorized User'}</p>
            <p className="text-[10px] text-navy-500 truncate">{currentUser?.email || 'owner@meggskitchen.test'}</p>
          </div>
          <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
            role === 'Owner' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {role}
          </span>
        </div>

        <nav className="px-3 py-4 space-y-5 overflow-y-auto flex-1">
          {filteredNavGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-navy-950 text-white shadow-sm'
                        : 'text-navy-600 hover:bg-gray-100 hover:text-navy-900'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-[1600px]">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-navy-900">{title}</h1>
          </div>
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export function DashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <DashboardContent />
    </AdminLayout>
  );
}

export { AdminLayout };

interface RecentOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface RecentQuotation {
  id: string;
  name: string;
  project_type: string | null;
  status: string;
  created_at: string;
}

function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0,
    cancelledOrdersCount: 0,
    avgOrderValue: 0,
    grossProfit: 0,
    netProfit: 0,
    inventoryCostValue: 0,
    inventoryRetailValue: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalCustomersCount: 0,
    newCustomersCount: 0,
    returningCustomersCount: 0,
    conversionRate: 0,
    healthScore: 85,
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<RecentQuotation[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; type: 'warning' | 'danger' | 'info'; title: string; message: string; date: string }[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchCommandCenterData() {
      setLoading(true);
      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

        const [
          { data: allOrders },
          { data: allProducts },
          { data: allCustomers },
          { data: recentQuotesData },
        ] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('quotations').select('id, name, project_type, status, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        const ordersList = allOrders || [];
        const productsList = allProducts || [];
        const customersList = allCustomers || [];

        setRawProducts(productsList as Product[]);
        setRawOrders(ordersList as Order[]);

        // Revenue calculations
        const todayOrders = ordersList.filter((o) => o.created_at >= startOfToday);
        const weeklyOrders = ordersList.filter((o) => o.created_at >= startOfWeek);
        const monthlyOrders = ordersList.filter((o) => o.created_at >= startOfMonth);
        const annualOrders = ordersList.filter((o) => o.created_at >= startOfYear);

        const todayRev = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const weekRev = weeklyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const monthRev = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const yearRev = annualOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Order status counts
        const pendingCount = ordersList.filter((o) => o.status === 'pending').length;
        const completedCount = ordersList.filter((o) => o.status === 'completed' || o.status === 'delivered').length;
        const cancelledCount = ordersList.filter((o) => o.status === 'cancelled').length;

        const totalOrderRev = ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const aov = ordersList.length > 0 ? totalOrderRev / ordersList.length : 0;

        // Inventory values & counts
        let costVal = 0;
        let retailVal = 0;
        let lowStock = 0;
        let outStock = 0;
        let inStock = 0;

        productsList.forEach((p) => {
          const qty = p.stock_quantity || 0;
          const cost = p.cost_price || (p.price * 0.7); // 70% cost estimate if cost_price not specified
          costVal += qty * cost;
          retailVal += qty * (p.price || 0);

          if (qty <= 0) outStock++;
          else if (p.low_stock_threshold != null && qty <= p.low_stock_threshold) lowStock++;
          else inStock++;
        });

        // Profit calculations
        const grossProfitVal = totalOrderRev > 0 ? totalOrderRev * 0.35 : 0; // ~35% average gross margin
        const netProfitVal = grossProfitVal * 0.75; // minus operating expenses

        // Customer stats
        const newCust = customersList.filter((c) => c.created_at >= startOfMonth).length;
        const returningCust = Math.max(0, customersList.length - newCust);

        // Health score calculation
        const stockHealth = productsList.length > 0 ? Math.round(((inStock) / productsList.length) * 100) : 100;
        const orderFulfillment = ordersList.length > 0 ? Math.round((completedCount / (ordersList.length - cancelledCount || 1)) * 100) : 100;
        const calculatedHealth = Math.min(100, Math.max(40, Math.round(stockHealth * 0.4 + orderFulfillment * 0.4 + 20)));

        setMetrics({
          todayRevenue: todayRev,
          weeklyRevenue: weekRev,
          monthlyRevenue: monthRev,
          annualRevenue: yearRev,
          todayOrdersCount: todayOrders.length,
          pendingOrdersCount: pendingCount,
          completedOrdersCount: completedCount,
          cancelledOrdersCount: cancelledCount,
          avgOrderValue: aov,
          grossProfit: grossProfitVal,
          netProfit: netProfitVal,
          inventoryCostValue: costVal,
          inventoryRetailValue: retailVal,
          inStockCount: inStock,
          lowStockCount: lowStock,
          outOfStockCount: outStock,
          totalCustomersCount: customersList.length,
          newCustomersCount: newCust,
          returningCustomersCount: returningCust,
          conversionRate: 3.4,
          healthScore: calculatedHealth,
        });

        setRecentOrders(ordersList.slice(0, 5));
        setRecentQuotations(recentQuotesData || []);

        // Dynamic System Notifications & Critical Alerts
        const alertList = [];
        if (lowStock > 0 || outStock > 0) {
          alertList.push({
            id: 'alt-1',
            type: 'warning' as const,
            title: 'Inventory Stock Warning',
            message: `${outStock} products out of stock, ${lowStock} running low on inventory.`,
            date: 'Just now',
          });
        }
        if (pendingCount > 0) {
          alertList.push({
            id: 'alt-2',
            type: 'info' as const,
            title: 'Pending Orders Awaiting Dispatch',
            message: `${pendingCount} orders require processing and warehouse fulfillment.`,
            date: '10m ago',
          });
        }
        if (cancelledCount > 0) {
          alertList.push({
            id: 'alt-3',
            type: 'danger' as const,
            title: 'Order Cancellations Logged',
            message: `${cancelledCount} orders cancelled this week. Check customer notes.`,
            date: '1h ago',
          });
        }
        setAlerts(alertList);
      } catch (err) {
        console.error('Error fetching command center data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCommandCenterData();
  }, []);

  const orderStatusStyle = (status: string) =>
    status === 'pending'
      ? 'bg-yellow-100 text-yellow-700'
      : status === 'cancelled'
      ? 'bg-red-100 text-red-700'
      : 'bg-green-100 text-green-700';

  const quoteStatusStyle = (status: string) =>
    status === 'new' || status === 'draft'
      ? 'bg-accent-100 text-accent-700'
      : 'bg-gray-100 text-navy-600';

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-primary-950 to-navy-900 text-white rounded-2xl p-6 shadow-md border border-navy-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-400" />
              <span className="text-xs font-semibold tracking-wider text-accent-300 uppercase">Shop Overview</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">MEGGS KITCHEN Dashboard</h1>
            <p className="text-xs text-navy-300 max-w-xl">Clear daily summary of your sales, stock levels, and customer orders.</p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Business Health Score */}
            <div className="bg-white/10 backdrop-blur border border-white/20 p-3.5 rounded-xl flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-400/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-300">{metrics.healthScore}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-navy-300 font-medium uppercase">Health Score</p>
                <p className="text-xs font-bold text-emerald-400">Excellent Operational State</p>
              </div>
            </div>

            {/* Notifications Toggle Button */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
              title="Toggle System Notifications"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Critical System Alerts Bar */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                a.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : a.type === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {a.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : a.type === 'danger' ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                ) : (
                  <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <div>
                  <span className="font-bold mr-2">{a.title}:</span>
                  <span>{a.message}</span>
                </div>
              </div>
              <span className="text-[11px] opacity-75">{a.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* Owner Copilot AI Business Intelligence */}
      <AdminOwnerCopilot products={rawProducts} orders={rawOrders} />

      {/* Executive Revenue & Financial Metrics */}
      <div>
        <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Revenue & Growth Matrix</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-navy-500 font-medium">Today's Revenue</span>
            <p className="text-2xl font-bold text-navy-900 mt-1">
              {loading ? <span className="inline-block h-7 w-20 bg-gray-100 rounded animate-pulse" /> : formatKES(metrics.todayRevenue)}
            </p>
            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Live today
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-navy-500 font-medium">Weekly Revenue</span>
            <p className="text-2xl font-bold text-navy-900 mt-1">
              {loading ? <span className="inline-block h-7 w-20 bg-gray-100 rounded animate-pulse" /> : formatKES(metrics.weeklyRevenue)}
            </p>
            <p className="text-[11px] text-navy-400 mt-1">Last 7 days total</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-navy-500 font-medium">Monthly Revenue</span>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              {loading ? <span className="inline-block h-7 w-20 bg-gray-100 rounded animate-pulse" /> : formatKES(metrics.monthlyRevenue)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Month to date
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-navy-500 font-medium">Annual Revenue</span>
            <p className="text-2xl font-bold text-navy-900 mt-1">
              {loading ? <span className="inline-block h-7 w-20 bg-gray-100 rounded animate-pulse" /> : formatKES(metrics.annualRevenue)}
            </p>
            <p className="text-[11px] text-navy-400 mt-1">Full year performance</p>
          </div>
        </div>
      </div>

      {/* Orders, Profit & Inventory Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Order Fulfillment Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary-500" />
              Orders & Fulfillment
            </h3>
            <Link href="/admin/orders" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-yellow-700 font-medium">Pending Orders</p>
              <p className="text-xl font-bold text-yellow-900 mt-0.5">{metrics.pendingOrdersCount}</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
              <p className="text-green-700 font-medium">Completed</p>
              <p className="text-xl font-bold text-green-900 mt-0.5">{metrics.completedOrdersCount}</p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-navy-500 font-medium">Today's Orders</p>
              <p className="text-xl font-bold text-navy-900 mt-0.5">{metrics.todayOrdersCount}</p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-700 font-medium">Cancelled</p>
              <p className="text-xl font-bold text-red-900 mt-0.5">{metrics.cancelledOrdersCount}</p>
            </div>
          </div>
        </div>

        {/* Profitability Analysis */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Profit & Margins
            </h3>
            <Link href="/admin/reports" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              BI Report <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-navy-500">Average Order Value (AOV)</span>
              <span className="font-bold text-navy-900">{formatKES(metrics.avgOrderValue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-navy-500">Estimated Gross Profit</span>
              <span className="font-bold text-emerald-600">{formatKES(metrics.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-navy-500">Estimated Net Profit</span>
              <span className="font-bold text-primary-600">{formatKES(metrics.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Inventory Health Valuation */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-purple-500" />
              Inventory Valuation
            </h3>
            <Link href="/admin/inventory" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              Matrix <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-navy-500">Cost Valuation</span>
              <span className="font-bold text-navy-900">{formatKES(metrics.inventoryCostValue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-navy-500">Retail Value</span>
              <span className="font-bold text-navy-900">{formatKES(metrics.inventoryRetailValue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-navy-500">Low / Out of Stock</span>
              <span className="font-bold text-amber-600">{metrics.lowStockCount} low / {metrics.outOfStockCount} out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Work Tables: Recent Orders & Recent Quotations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-900">Recent Live Orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-primary-600 hover:underline">
              View All Orders
            </Link>
          </div>
          {loading ? (
            <p className="text-navy-400 text-sm">Loading...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-navy-400 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-navy-900 truncate">{order.customer_name}</p>
                    <p className="text-xs text-navy-400">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-medium text-navy-900">{formatKES(order.total_amount || 0)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orderStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-900">Recent Quotation Requests</h2>
            <Link href="/admin/quotations" className="text-xs font-semibold text-primary-600 hover:underline">
              View All Quotes
            </Link>
          </div>
          {loading ? (
            <p className="text-navy-400 text-sm">Loading...</p>
          ) : recentQuotations.length === 0 ? (
            <p className="text-navy-400 text-sm">No quotation requests yet</p>
          ) : (
            <div className="space-y-1">
              {recentQuotations.map((quote) => (
                <Link
                  key={quote.id}
                  href="/admin/quotations"
                  className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-navy-900 truncate">{quote.name}</p>
                    <p className="text-xs text-navy-400">{quote.project_type || 'General Kitchen Project'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3 ${quoteStatusStyle(quote.status)}`}>
                    {quote.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-4">Quick Actions & Shortcuts</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Reports', href: '/admin/reports' },
            { label: 'Customers', href: '/admin/customers' },
            { label: 'Marketing', href: '/admin/marketing' },
            { label: 'Invoices', href: '/admin/invoices' },
            { label: 'Stock Levels', href: '/admin/inventory' },
            { label: 'Stock Orders', href: '/admin/purchase-orders' },
            { label: 'Offers & Discounts', href: '/admin/promotions' },
            { label: 'Shop Settings', href: '/admin/site-settings' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-medium text-navy-800 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 shadow-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-navy-900">Notifications Center</h3>
              </div>
              <button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-navy-400">No active system alerts.</p>
              ) : (
                alerts.map((alt) => (
                  <div key={alt.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-navy-900">{alt.title}</p>
                    <p className="text-navy-600">{alt.message}</p>
                    <p className="text-[10px] text-navy-400">{alt.date}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <button onClick={() => setNotificationsOpen(false)} className="w-full btn-secondary text-xs py-2">
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
