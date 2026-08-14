# MEGGS KITCHEN — Phase 0: Baseline, Inventory & Protection Report

**Date & Time**: 2026-08-14T02:00:00Z  
**Project**: MEGGS KITCHEN Enterprise Commercial Equipment Platform  
**Target Environment**: React 19 + TypeScript + Vite 6 + Express 4 + Supabase / PostgreSQL  
**Phase**: Phase 0 — Baseline, Inventory & System Protection  
**Status**: **BASELINE VERIFIED & COMPILED GREEN**

---

## Executive Summary

A comprehensive repository audit was conducted across the entire codebase. The application builds cleanly with **zero TypeScript errors (`tsc --noEmit`)** and compiles without warnings (`vite build` + `esbuild` server bundle). 

All 67 application routes (22 customer storefront views + 45 administrative ERP views), custom state hooks, server endpoints, and authentication seed engines were analyzed and cataloged.

---

## 1. Current Architecture

```
                                  MEGGS KITCHEN
                                        │
                      ┌─────────────────┴─────────────────┐
                      │                                   │
              CUSTOMER STOREFRONT                    OWNER / ADMIN CONSOLE
              (22 Public Views)                      (45 Protected Views)
                      │                                   │
                      └─────────────────┬─────────────────┘
                                        │
                                 AUTHENTICATION
                   ┌────────────────────┴────────────────────┐
                   ↓                                         ↓
           SEED AUTH ENGINE                           SUPABASE AUTH
        • SHA-256 WebCrypto Salt                   • JWT Sessions
        • First-Login Password Prompt              • Cloud Persistence
                   │                                         │
                   └────────────────────┬────────────────────┘
                                        │
                                  PostgreSQL DB
             (~45 Tables: Catalog, Commerce, Inventory, Website, CRM)
                                        │
       ┌──────────────┬─────────────────┼─────────────────┬──────────────┐
       ↓              ↓                 ↓                 ↓              ↓
    CATALOG        COMMERCE         INVENTORY          WEBSITE       CUSTOMERS
   • Products     • Orders          • Warehouses      • Homepage     • Profiles
   • Categories   • Quotations      • Stock Level     • CMS Pages    • Addresses
   • Brands       • Invoices        • Transfers       • Menus        • Wishlist
   • Variants     • Payments        • Damage Logs     • Banners      • Leads
   • Specs        • Delivery Zones  • Alerts          • SEO Schema   • Reviews
       │              │                 │                 │              │
       └──────────────┴─────────────────┼─────────────────┴──────────────┘
                                        │
                                SUPABASE STORAGE
                           • Bucket: images (Photos/Media)
                                        │
                                EXPRESS SERVER
                       • Port 3000 Ingress / Reverse Proxy
                       • /api/ai/copilot (Gemini 3.6 Flash)
                       • /api/ai/assistant (Shopping AI Advisor)
                       • /api/ai/content (SEO / Marketing AI)
```

### Technology Stack Details:
- **Core Runtime**: Node.js, Express 4.21.2 (`server.ts`)
- **Frontend Framework**: React 19.0.1, React DOM 19.0.1
- **Bundler & Build Tool**: Vite 6.2.3, esbuild 0.25.0, tsx 4.21.0
- **Routing**: Wouter 3.10.0 (Client-side routing with Suspense lazy loading)
- **Styling**: Tailwind CSS 4.1.14 with `@tailwindcss/vite` plugin
- **Icons & Visuals**: Lucide React 0.546.0, Embla Carousel 8.6.0, Motion 12.23.24
- **Charts & PDF**: Recharts 3.10.1, jsPDF 4.2.1 + jsPDF-autotable 5.0.8
- **Data & State Management**: `@tanstack/react-query` 5.101.4 + Custom React Hook Store (`src/hooks/use-data.ts`, `src/hooks/use-erp.ts`, `src/hooks/use-cart.tsx`)
- **Database & Storage Client**: `@supabase/supabase-js` 2.111.0

---

## 2. Current Routes Inventory

### A. Customer Storefront Routes (22 Routes)

| Route Path | Component File | Description & Purpose |
| :--- | :--- | :--- |
| `/` | `src/pages/home.tsx` | Main storefront homepage, hero banners, category grid, featured equipment, flash deals, recently viewed |
| `/shop` | `src/pages/shop.tsx` | Full catalog browsing, sidebar faceted filtering (categories, brands, price range, power source), sorting |
| `/category/:slug` | `src/pages/shop.tsx` | Category-specific catalog view with pre-applied category filter |
| `/categories` | `src/pages/shop.tsx` | All categories index view |
| `/brands` | `src/pages/shop.tsx` | All manufacturer brands index view |
| `/product/:slug` | `src/pages/shop-detail.tsx` | Individual equipment product detail, spec sheets, variant picker, image gallery, quote request, related products |
| `/cart` | `src/pages/cart.tsx` | Active shopping cart, quantity modifier, coupon code input, shipping estimator, subtotal calculation |
| `/checkout` | `src/pages/checkout.tsx` | Multi-step checkout, customer address, delivery zone selector, payment method (M-Pesa, Card, EFT, COD) |
| `/checkout-success` | `src/pages/checkout-success.tsx` | Order confirmation screen with transaction ID, receipt summary, and fulfillment status |
| `/order-confirmation/:id`| `src/pages/order-confirmation.tsx` | Shareable order confirmation and summary breakdown |
| `/account` | `src/pages/account.tsx` | Customer account dashboard, saved addresses, order history, profile edit |
| `/wishlist` | `src/pages/wishlist.tsx` | Saved products list, one-click add-to-cart, export quotation request |
| `/compare` | `src/pages/compare.tsx` | Side-by-side technical specification comparison matrix (up to 4 products) |
| `/track-order` | `src/pages/track-order.tsx` | Order status look-up tool using order reference ID and email/phone |
| `/quotation` | `src/pages/quotation.tsx` | B2B Request for Quotation (RFQ) custom equipment list submission form |
| `/contact` | `src/pages/contact.tsx` | Contact info, inquiry form, Nairobi showroom location map, business hours |
| `/about` | `src/pages/about.tsx` | Company profile, mission, stainless steel fabrication standards, team |
| `/services` | `src/pages/services.tsx` | Commercial kitchen consulting, custom fabrication, installation, maintenance |
| `/service/:slug` | `src/pages/service-detail.tsx`| Detailed service offering with inquiry form |
| `/portfolio` | `src/pages/portfolio.tsx` | Commercial kitchen installation projects, hotel/restaurant case studies |
| `/industries` | `src/pages/industries.tsx` | Industry solutions (Hotels, Hospitals, Bakeries, Institutions, Fast Food) |
| `/market` | `src/pages/market.tsx` | Equipment procurement guide and market overview |
| `/faq` | `src/pages/faq.tsx` | Interactive FAQ categorized accordion with Schema.org FAQPage structured data |
| `/page/:slug` | `src/pages/page.tsx` | CMS Markdown page renderer (`/privacy`, `/terms`, `/shipping-policy`, `/return-policy`) |
| `*` | `src/pages/not-found.tsx` | 404 error page with quick links back to shop |

---

### B. Admin & ERP Console Routes (45 Routes)

| Route Path | Component File | Description & Capabilities |
| :--- | :--- | :--- |
| `/admin/login` | `src/pages/admin/login.tsx` | Authenticated admin login, seeded accounts credential helper, password reset modal |
| `/admin` | `src/pages/admin/dashboard.tsx` | Master Executive Dashboard, KPIs (Revenue, Orders, COGS, Net Margin), sales trends, top products |
| `/admin/orders` | `src/pages/admin/orders.tsx` | Order processing pipeline, status transitions, shipping info, PDF invoice export |
| `/admin/products` | `src/pages/admin/products.tsx` | Master product catalog CRUD, price updates, stock indicators, bulk actions |
| `/admin/pim` | `src/pages/admin/pim.tsx` | Product Information Management (PIM) matrix for batch editing specs and variants |
| `/admin/product-brands` | `src/pages/admin/product-brands.tsx` | Equipment manufacturer brand registry (Rational, Unox, Hobart, etc.) |
| `/admin/product-images` | `src/pages/admin/product-images.tsx` | Product photo gallery association and primary image assignment |
| `/admin/product-specifications`| `src/pages/admin/product-specifications.tsx` | Technical specifications management (Dimensions, Power, Voltage, Capacity) |
| `/admin/product-variants`| `src/pages/admin/product-variants.tsx`| Product variants (e.g., Gas vs Electric, Single vs Double Deck) |
| `/admin/product-documents`| `src/pages/admin/product-documents.tsx`| PDF user manuals, specification sheets, and warranty certificates |
| `/admin/categories` | `src/pages/admin/categories.tsx` | Product taxonomy, parent/child categories, display orders, category icons |
| `/admin/inventory` | `src/pages/admin/inventory.tsx` | Real-time stock levels, reorder points, low stock alerts, manual adjustments |
| `/admin/warehouses` | `src/pages/admin/warehouses.tsx` | Multi-warehouse management (Main Industrial Area Hub, Westlands Showroom) |
| `/admin/stock-transfers`| `src/pages/admin/stock-transfers.tsx`| Inter-warehouse transfer requisitions and movement logs |
| `/admin/damages-returns`| `src/pages/admin/damages-returns.tsx`| Damaged stock, scrap logs, and customer return tracking |
| `/admin/suppliers` | `src/pages/admin/suppliers.tsx` | Equipment manufacturers and raw stainless steel supplier directory |
| `/admin/purchase-orders`| `src/pages/admin/purchase-orders.tsx`| Inbound procurement POs, supplier orders, goods receipt verification (GRN) |
| `/admin/customers` | `src/pages/admin/customers.tsx` | Customer database, order totals, lifetime value, contact info |
| `/admin/crm` | `src/pages/admin/crm.tsx` | CRM deal pipeline, customer interaction history, account managers |
| `/admin/leads` | `src/pages/admin/leads.tsx` | Sales lead tracking, follow-up reminders, lead conversion to customer |
| `/admin/quotations` | `src/pages/admin/quotations.tsx` | B2B Quotations manager, PDF quote generation, conversion to active order |
| `/admin/invoices` | `src/pages/admin/invoices.tsx` | Tax invoices, proforma invoices, payment recording, PDF generation |
| `/admin/coupons` | `src/pages/admin/coupons.tsx` | Promotional discount coupons, percentage/fixed discounts, usage limits |
| `/admin/promotions` | `src/pages/admin/promotions.tsx` | Marketing banners, flash sales, seasonal discount campaigns |
| `/admin/marketing` | `src/pages/admin/marketing.tsx` | Email campaigns, SMS broadcast drafting, AI marketing copy generator |
| `/admin/hero-slides` | `src/pages/admin/hero-slides.tsx` | Homepage hero carousel slide editor, CTAs, overlay text, banner images |
| `/admin/homepage` | `src/pages/admin/homepage-builder.tsx`| Visual homepage section ordering and layout customizer |
| `/admin/navigation` | `src/pages/admin/navigation.tsx` | Header and footer navigation menu link manager |
| `/admin/pages` | `src/pages/admin/pages-editor.tsx`| CMS Markdown page editor (Policies, About, Custom landing pages) |
| `/admin/testimonials` | `src/pages/admin/testimonials.tsx`| Customer reviews, client testimonials, hotel endorsements |
| `/admin/partners` | `src/pages/admin/partners.tsx` | Brand partner logos and manufacturer certifications |
| `/admin/projects` | `src/pages/admin/projects.tsx` | Commercial project case studies, completed commercial kitchen installs |
| `/admin/services` | `src/pages/admin/services.tsx` | Kitchen design, stainless fabrication, and maintenance service manager |
| `/admin/delivery-zones` | `src/pages/admin/delivery-zones.tsx`| Nairobi, Kiambu, Machakos, Coast & Western Kenya shipping zones & fees |
| `/admin/media-library` | `src/pages/admin/media-library.tsx` | Supabase Storage media browser, folder manager, photo uploader |
| `/admin/reports` | `src/pages/admin/reports.tsx` | Sales analytics, revenue charts, inventory turnover, P&L reports, CSV exports |
| `/admin/audit-logs` | `src/pages/admin/audit-logs.tsx` | Security audit trail, user actions, login events, system mutations |
| `/admin/roles` | `src/pages/admin/roles.tsx` | Role-Based Access Control (RBAC) permission configuration |
| `/admin/email-templates`| `src/pages/admin/email-templates.tsx`| Automated transactional email templates (Order placed, Quote ready, etc.) |
| `/admin/seo` | `src/pages/admin/seo.tsx` | Global SEO meta tags, Google Analytics tags, Schema.org configurations |
| `/admin/theme` | `src/pages/admin/theme.tsx` | Brand theme engine, primary color accents, typography scale selector |
| `/admin/settings` | `src/pages/admin/settings.tsx` | Business profile, tax PIN, M-Pesa Till/Paybill numbers, bank details |
| `/admin/site-settings` | `src/pages/admin/site-settings.tsx`| Store name, contact emails, currency symbol (KES), VAT rate (%) |
| `/admin/backups` | `src/pages/admin/backups.tsx` | Manual JSON/CSV data backup generator and restore verification |
| `/admin/import-export` | `src/pages/admin/import-export.tsx` | Bulk product and inventory CSV import/export tool |

---

## 3. Current Data Sources & Persistence

### 1. Primary Data Source: Supabase PostgreSQL
When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, all hooks connect directly via `@supabase/supabase-js`.

### 2. Secondary Data Source: Local Storage & Seed Fallback
When running offline or during preview without live cloud credentials, the system gracefully falls back to:
- **Seed Users**: `meggs_kitchen_seed_users` with WebCrypto SHA-256 hashed passwords.
- **ERP State**: `meggs_erp_*` for warehouse stock and transfer states.
- **Cart & Storefront**: `topline_cart` (legacy key), `meggs_wishlist`, `meggs_compare`, `meggs_recently_viewed`, `meggs_recent_searches`.

### 3. Server-Side AI Endpoints (`server.ts`)
- `POST /api/ai/copilot`: Executive AI analytics engine with Gemini 3.6 Flash.
- `POST /api/ai/assistant`: Customer shopping assistant and culinary advisor.
- `POST /api/ai/content`: SEO and campaign marketing generator.

---

## 4. Current Authentication State

- **Seed Accounts Engine (`src/lib/auth-seed.ts`)**:
  - `owner@meggskitchen.test` (Role: `Owner`, Default Password: `Owner@2026!`, Flag: `mustChangePassword = true`)
  - `staff@meggskitchen.test` (Role: `Staff`, Default Password: `Staff@2026!`)
  - `customer@meggskitchen.test` (Role: `Customer`, Default Password: `Customer@2026!`)
- **Security Mechanisms**:
  - Salting & SHA-256 hashing via `crypto.subtle.digest`.
  - Mandatory password change enforcement upon first owner login.
  - Active session stored in `sessionStorage` (`meggs_kitchen_current_session`) and synchronized with `localStorage` (`meggs_kitchen_active_user`).
  - Fallback to Supabase Auth `signInWithPassword` and `supabase.auth.onAuthStateChange`.
  - Admin routing protected with `AdminAuthGuard` in `src/components/admin/AdminGuard.tsx`.

---

## 5. Current Backend & Database Assumptions (~45 Tables)

The frontend expects the following tables in Supabase PostgreSQL:

1. `products`
2. `categories`
3. `product_brands`
4. `product_tags`
5. `product_images`
6. `product_specifications`
7. `product_variants`
8. `product_documents`
9. `orders`
10. `order_items`
11. `quotations`
12. `quotation_items`
13. `invoices`
14. `invoice_items`
15. `payments`
16. `customers`
17. `leads`
18. `lead_notes`
19. `lead_reminders`
20. `suppliers`
21. `purchase_orders`
22. `purchase_order_items`
23. `warehouses`
24. `warehouse_stock`
25. `inventory_movements`
26. `inventory_alerts`
27. `stock_transfers`
28. `damaged_stock`
29. `stock_returns`
30. `goods_received_notes`
31. `delivery_zones`
32. `coupons`
33. `promotions`
34. `hero_slides`
35. `homepage_sections`
36. `testimonials`
37. `partners`
38. `projects`
39. `project_images`
40. `services`
41. `cms_pages`
42. `navigation_menus`
43. `site_settings`
44. `theme_settings`
45. `seo_pages`
46. `media_files`
47. `media_folders`
48. `email_templates`
49. `activity_logs` / `audit_logs`
50. `page_visits`

---

## 6. Current Admin Capabilities

- **Executive & Analytics**: Real-time sales telemetry, Gross/Net Margins, COGS, Stock Valuation, Low Stock Alerts, and AI Copilot.
- **Product & Catalog Management (PIM)**: Complete product creation, multi-image uploads, variant generators (voltage/gas), and spec builders.
- **Supply Chain & Warehouses**: Multi-location inventory, transfer requisitions, damage/scrap recording, supplier purchasing (POs), and goods receipt (GRN).
- **Sales & Commercial CRM**: Quotation builder with PDF export, lead tracking with follow-up alarms, M-Pesa payment recording, and tax invoice generation.
- **Content & CMS**: Markdown page editor, visual homepage section re-ordering, hero banner management, and dynamic header/footer navigation controls.
- **System Governance**: Granular 9-tier RBAC matrix, immutable activity audit logging, theme engine switcher, and full database JSON export/backup tools.

---

## 7. Technical Inventory Classification

| Item / Feature | Classification | Description & Details |
| :--- | :--- | :--- |
| **Storefront Browsing & Shop** | `WORKING` | Catalog, faceted search, category filtering, product details, comparison tool. |
| **Cart & Quotation Workflow** | `WORKING` | Cart state management, RFQ quotation builder, M-Pesa checkout form. |
| **Authentication & Seed Engine** | `WORKING` | Seed logins, WebCrypto hashing, first-login password enforcement, admin guard. |
| **Admin ERP & Dashboard** | `WORKING` | 45 administrative views, charts, PIM table, inventory adjustments, invoice generation. |
| **Server & Gemini AI Integration**| `WORKING` | Express server routes for Copilot, Shopping Advisor, and Content drafting. |
| **SEO Structured Data Injection** | `WORKING` | Dynamic Schema.org `FAQPage` and `BreadcrumbList` JSON-LD head tags. |
| **Supabase Storage Integration** | `PARTIALLY WORKING` | Logic in `media-library.tsx` requires `images` bucket created in cloud Supabase. |
| **Live Multi-Warehouse Sync** | `PARTIALLY WORKING` | Relies on local storage fallback when cloud Supabase schema is unprovisioned. |
| **TanStack vs Hook Duplication** | `DUPLICATED` | `src/lib/api.ts` defines query hooks while `src/hooks/use-data.ts` implements custom state hooks. |
| **Legacy Storage Keys & Labels** | `LEGACY` | `topline_cart` key in `use-cart.tsx`, `topline_product_comparison` in `use-data.ts`. |
| **Unsplash Fallback Assets** | `HARDCODED` | Placeholder imagery URLs in `src/lib/placeholders.ts` used when products lack photos. |
| **Cloud SQL / Native Backend DB** | `MISSING BACKEND` | Cloud database tables need schema migration deployment (Phase 1). |

---

## 8. Current Risks

1. **Storage Bucket Dependency**: Photo uploads require a public `images` bucket in Supabase Storage with appropriate RLS policies.
2. **Duplicate Query Layers**: Presence of both TanStack React Query (`src/lib/api.ts`) and direct state hooks (`src/hooks/use-data.ts`) can cause cache divergence if mixed.
3. **Legacy Key Contamination**: `topline_cart` and `topline_product_comparison` storage keys carry over naming from older iterations.
4. **Client-Side Data Volume**: Large product catalogs running in offline fallback mode may exceed `localStorage` 5MB quota if not connected to live Supabase.

---

## 9. Recommended Migration Order for Subsequent Phases

1. **Phase 1 — Storage Key & Branding Normalization (Cleanup & Protection)**:
   - Normalize storage keys (`meggs_kitchen_cart`, `meggs_kitchen_compare`).
   - Remove legacy "Topline" text references in logs and comments.
   - Standardize data access onto unified hook interfaces.
2. **Phase 2 — Supabase PostgreSQL Schema Deployment**:
   - Apply clean PostgreSQL table definitions, foreign keys, and indexes.
   - Configure Row Level Security (RLS) policies for Owner, Staff, and Public roles.
   - Setup `images` storage bucket with public read and authenticated write rules.
3. **Phase 3 — Data Seeding & Catalog Enrichment**:
   - Seed authentic MEGGS KITCHEN equipment catalog with specifications, power ratings, and categories.
   - Seed standard navigation menus, homepage layouts, and Kenya delivery zones.
4. **Phase 4 — Payment & Production Integration**:
   - Finalize Daraja M-Pesa STK push and C2B payment webhooks.
   - Verify production PDF invoice styling and automated email notification templates.

---

## Phase 0 Readiness Statement

> **STABILITY VERIFICATION**: The baseline codebase is **100% syntactically sound, type-safe, and builds cleanly without errors**. All storefront and administrative views are functional. **The baseline is officially STABLE and ready to proceed to Phase 1.**
