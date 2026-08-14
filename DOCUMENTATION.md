# MEGGS KITCHEN Enterprise Platform Documentation

## 1. System Architecture Overview
The **MEGGS KITCHEN Enterprise Platform** is built as a high-performance, full-stack commercial e-commerce marketplace and ERP solution designed for heavy-duty kitchen equipment, commercial catering machinery, and stainless steel fabrication sales in East Africa.

### Stack Architecture
- **Frontend Framework**: React 18 with Vite, TypeScript, Tailwind CSS, Lucide React icons, and Recharts visualization.
- **State Management & Routing**: Custom lightweight React hooks (`useCart`, `useData`, `useERP`, `usePagination`, `useSEO`) with client-side hash and history routing.
- **Database & Persistence**: Supabase (PostgreSQL) with full offline fallback cache and real-time syncing.
- **Enterprise Features**:
  - Dynamic Role-Based Access Control (RBAC) supporting 9 distinct roles (Owner, Administrator, Inventory Manager, Warehouse Staff, Sales, Customer Support, Accountant, Marketing, Viewer).
  - Activity & Security Audit Logging with immutable transaction tracking.
  - P&L Profit & Loss Reporting with real-time Cost of Goods Sold (COGS) estimation and tax calculations.
  - Multi-Currency & Delivery Zone Engines (KES / USD) with M-Pesa STK Push integration.
  - Comprehensive CRM, Lead Pipeline, and B2B Quotation Builder.

---

## 2. Environment Variables Guide

Declare all configuration variables in `.env` (or via Cloud environment settings):

```env
# Supabase Database Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Business Defaults
VITE_STORE_NAME="MEGGS KITCHEN"
VITE_DEFAULT_CURRENCY=KES
VITE_VAT_RATE=16
```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Role | Catalog | Inventory | Orders | Quotations | Financials | CRM | Marketing | Audit Logs | Settings |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Owner** | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| **Administrator** | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| **Inventory Manager** | Edit | Edit | Read | Read | - | - | - | - | - |
| **Warehouse Staff** | Read | Edit | Read | - | - | - | - | - | - |
| **Sales** | Read | Read | Edit | Edit | - | Edit | - | - | - |
| **Customer Support** | Read | Read | Edit | Read | - | Edit | - | - | - |
| **Accountant** | Read | Read | Read | Read | Full | - | - | - | - |
| **Marketing** | Read | - | Read | - | - | Read | Full | - | - |
| **Viewer** | Read | Read | Read | Read | Read | Read | Read | - | - |

---

## 4. Disaster Recovery & Backup Strategy

### Database Backups
- **Frequency**: Automated daily full snapshots + Point-in-Time Recovery (PITR) up to 7 days via Supabase cloud infrastructure.
- **Manual Export**: Administrators can export customer records, products, orders, and audit logs to CSV/JSON directly from the Admin Reports panel.

### Recovery Procedure
1. Provision target database instance.
2. Run database migration scripts or restore target PITR snapshot.
3. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in environment secrets.
4. Trigger redeployment via automated CI/CD pipeline.

---

## 5. Deployment Pipeline & Core Web Vitals
- **Build Command**: `npm run build`
- **Lint Command**: `npm run lint`
- **Type Safety**: Standard TypeScript strict checking enabled (`tsc --noEmit`).
- **Asset Optimization**: Lazy loading enabled for all administrative sub-pages and heavy charts to ensure sub-second initial page load times.
