# MEGGS KITCHEN — PHASE 2: ONE SOURCE OF TRUTH ARCHITECTURE REPORT

**Document Version**: 2.0.0  
**Phase**: Phase 2 — One Source of Truth (SSOT) Architecture & Data Source Audit  
**Target Platform**: MEGGS KITCHEN Enterprise Marketplace (PostgreSQL + Supabase Storage + Supabase Auth)  

---

## 1. Executive Summary & Objective

In accordance with Phase 2 requirements, a comprehensive audit of all business data sources across the MEGGS KITCHEN application was conducted. The goal is to establish **PostgreSQL as the single source of truth (SSOT)** for all structured business entities, **Supabase Storage** for binary media assets, and **Supabase Auth** for identity management.

This audit catalogues all occurrences of:
- `localStorage` and `sessionStorage` usage
- Hardcoded arrays and default constant objects
- Mock products, fallback catalog items, and hardcoded prices
- Static banner configurations, reviews, and promotional cards
- Hardcoded categories and brand partners
- Synthetic statistics, demo customer records, and simulated orders
- Obsolete runtime fallback chains

A definitive **DATA_SOURCE_MAP** has been constructed to define the migration path from current client-side/hybrid sources to production PostgreSQL tables and storage buckets without creating duplicate schemas or secondary backend silos.

---

## 2. Comprehensive Audit of Business Data Sources

### 2.1 Web Storage Usage (`localStorage` & `sessionStorage`)

| Key / Identifier | Location | Stored Data | Current Purpose | Assessment & Target Architecture |
| :--- | :--- | :--- | :--- | :--- |
| `meggs_kitchen_cart` | `src/hooks/use-cart.tsx` | Array of cart items (product ID, quantity, price, options) | Client shopping cart | **Keep as Transient Client Cache with DB Sync**: Persist guest items in `localStorage`; sync with PostgreSQL `cart_items` upon customer authentication. |
| `meggs_kitchen_product_comparison` | `src/hooks/use-data.ts`, `src/components/comparison/ComparisonBar.tsx` | Array of product IDs / specs | Active product comparison tray | **Client-side UI State**: Legitimate client session storage. |
| `meggs_wishlist` | `src/pages/wishlist.tsx`, `src/components/home/ProductCard.tsx` | Array of product IDs | Saved customer favorites | **Migrate to PostgreSQL `customer_wishlists`**: Currently stored only in browser; must persist to database for logged-in users. |
| `meggs_recently_viewed` | `src/pages/shop-detail.tsx`, `src/components/home/RecentlyViewed.tsx` | Array of product IDs | Recent browsing history | **Client-side UI State**: Legitimate local cache. |
| `meggs_recent_searches` / `meggs_kitchen_search_history` | `src/components/search/SearchEngineModal.tsx`, `AdvancedSearch.tsx` | Array of search query strings | Search history chips | **Client-side UI State**: Legitimate browser preference. |
| `meggs_kitchen_seed_users` | `src/lib/auth-seed.ts` | Hashed user objects (Owner, Staff, Customer) | Mock authentication engine | **Migrate to Supabase Auth + `customers` table**: Replace local storage user dictionary with real database auth profiles. |
| `meggs_kitchen_current_session` | `src/lib/auth-seed.ts` | Active login session token | Mock session management | **Migrate to Supabase Auth JWT session**. |
| `meggs_erp_*` (`warehouses`, `suppliers`, `roles`) | `src/hooks/use-erp.ts` | Arrays of ERP entities | Fallback when tables offline | **Migrate to PostgreSQL**: Tables `warehouses`, `suppliers`, `roles` must be the sole source. |
| `order_summary_*` | `src/pages/checkout.tsx`, `order-confirmation.tsx` | Completed order snapshot | Temporary checkout handoff | **Migrate to PostgreSQL `orders` query**: Fetch directly by order ID from database. |

---

### 2.2 Hardcoded Arrays, Fallbacks & Mock Datasets

| Identifier / Constant | File Location | Content Description | Required Action |
| :--- | :--- | :--- | :--- |
| `DUMMY_CMS_PAGES` | `src/pages/page.tsx` | 10 hardcoded legal and company pages (`about`, `privacy-policy`, `terms`, `warranty`, `commercial-kitchens`, etc.) | **Migrate to PostgreSQL `cms_pages` table**. Remove hardcoded array once database is seeded. |
| `DEFAULT_PAGES` | `src/pages/admin/pages-editor.tsx` | 5 default CMS page structures | **Migrate to PostgreSQL `cms_pages` table**. |
| `DEFAULT_COLLECTIONS` | `src/pages/admin/pim.tsx` | Hardcoded product collections ('Chef Master Line', 'Commercial Heavy Duty', 'Bakery Series') | **Migrate to PostgreSQL `product_collections` or `categories`**. |
| `DEFAULT_TEMPLATES` | `src/pages/admin/email-templates.tsx` | Order confirmation, quote ready, and dispatch email templates | **Migrate to PostgreSQL `email_templates` table**. |
| `DEFAULT_REVIEWS` | `src/components/home/CustomerReviews.tsx` | 3 hardcoded customer testimonials with ratings | **Migrate to PostgreSQL `testimonials` table**. |
| `DEFAULT_PROMO_CARDS` | `src/components/home/HeroSection.tsx` | 4 hardcoded promotion tiles with external Unsplash URLs | **Migrate to PostgreSQL `promotions` table**. |
| `DEFAULT_BRANDS` | `src/components/home/ShopByBrand.tsx` | 6 brand logos and taglines (Citronic, Blinkmax, KAL, etc.) | **Migrate to PostgreSQL `product_brands` / `partners` tables**. |
| `DEFAULT_CIRCULAR_CATEGORIES` | `src/components/home/QuickCategories.tsx` | 9 circular category buttons with fallback icon mapping | **Migrate to PostgreSQL `categories` table**. |
| `FALLBACK_INDUSTRIES` | `src/pages/industries.tsx` | 8 commercial industry categories | **Migrate to PostgreSQL `cms_content` / `services` tables**. |
| `DEFAULT_PARTNERS` | `src/pages/market.tsx` | 8 certified partner brands | **Migrate to PostgreSQL `partners` table**. |
| `INITIAL_SEED_SPECS` | `src/lib/auth-seed.ts` | 3 default role accounts (Owner, Staff, Customer) | **Migrate to Supabase Auth + PostgreSQL `user_roles`**. |
| `INITIAL_WAREHOUSES` | `src/hooks/use-erp.ts` | 3 warehouse records (Nairobi Central, Mombasa, Kisumu) | **Migrate to PostgreSQL `warehouses` table**. |
| `INITIAL_ROLES` | `src/hooks/use-erp.ts` | 7 default ERP permission roles | **Migrate to PostgreSQL `roles` / `role_permissions` tables**. |
| `Sample Orders Effect` | `src/pages/account.tsx` | Hardcoded orders `MG-893012` and `MG-772104` | **Replace with live query to PostgreSQL `orders` table filtered by `customer_id`**. |
| `Sample Customer Stats` | `src/pages/admin/reports.tsx`, `dashboard.tsx` | Fallback aggregates for revenue and inventory | **Ensure all metrics compute dynamically from `orders`, `order_items`, and `products`**. |

---

## 3. DATA_SOURCE_MAP

The following master map specifies the authoritative production destination and migration workflow for every business entity in MEGGS KITCHEN.

| Business Entity | Current Source | Required Production Source | Target PostgreSQL Table / Bucket | Migration Action |
| :--- | :--- | :--- | :--- | :--- |
| **Products & SKU Data** | Supabase query with UI fallback | PostgreSQL Database | `products` | Seed 100% authoritative kitchenware catalog to PostgreSQL; enforce DB read. |
| **Product Variants** | Supabase query | PostgreSQL Database | `product_variants` | Normalize sizes, voltages, capacities, finishes into `product_variants`. |
| **Product Specs** | Supabase query | PostgreSQL Database | `product_specifications` | Standardize key-value specs (material, capacity, power, dimensions). |
| **Product Tags & Labels** | Hardcoded tags & query | PostgreSQL Database | `product_tags` | Migrate to relational tag association table. |
| **Categories** | `useCategories` + `DEFAULT_CIRCULAR_CATEGORIES` | PostgreSQL Database | `categories` | Ensure all 9 core kitchen categories exist in `categories` table with display order. |
| **Brands & Manufacturers** | `DEFAULT_BRANDS` + `useBrands` | PostgreSQL Database | `product_brands` & `partners` | Store brand metadata, logos, and authorized distributor badges in PostgreSQL. |
| **Product Images & Media** | Remote Unsplash URLs & fallback functions | Supabase Storage + PostgreSQL | `product_images` (table) + `media_files` (bucket) | Store uploaded images in Supabase Storage `product_images` bucket; save paths in database. |
| **Orders & Line Items** | Sample state in `account.tsx` & `useOrders` | PostgreSQL Database | `orders`, `order_items`, `payments` | Route all checkout transactions to `orders` and `order_items` tables. |
| **Customers & Profiles** | `localStorage` seed + `customers` table | Supabase Auth + PostgreSQL | `auth.users` + `public.customers` | Link customer UUIDs directly to Supabase Auth UID with B2B company fields. |
| **Homepage Layout & CMS** | `DEFAULT_PROMO_CARDS` + `homepage_sections` | PostgreSQL Database | `homepage_sections`, `hero_slides`, `promotions` | Fetch dynamic section order, slides, and promo banners from PostgreSQL. |
| **Custom CMS Pages** | `DUMMY_CMS_PAGES` + `cms_pages` table | PostgreSQL Database | `cms_pages`, `cms_content` | Seed all legal, about, warranty, and industry pages into `cms_pages`. |
| **Navigation Menus** | `useNavigationMenus` + hardcoded header | PostgreSQL Database | `navigation_menus` | Store primary, mobile, and footer menu tree hierarchies in `navigation_menus`. |
| **Site Settings & SEO** | `useSiteSettings` + `useSeoPages` | PostgreSQL Database | `site_settings`, `seo_pages`, `theme_settings` | Single source of truth in `site_settings` (JSONB) and `seo_pages`. |
| **Media Library** | `media_files` table + Supabase Storage | Supabase Storage + PostgreSQL | `media_folders`, `media_files` (tables) + `media_assets` (bucket) | Direct uploads to Supabase Storage with relational metadata in PostgreSQL. |
| **Inventory & Stock Tracking**| `products.stock_quantity` + `use-erp.ts` local cache | PostgreSQL Database | `products`, `inventory_movements`, `inventory_alerts`, `warehouses` | Real-time stock decrements on order completion; audit movements in `inventory_movements`. |
| **Quotations & Invoices** | `useQuotations` & `useInvoices` | PostgreSQL Database | `quotations`, `quotation_items`, `invoices`, `invoice_items` | Store formal commercial quotes and tax invoices in PostgreSQL with PDF generation. |
| **B2B Leads & Reminders** | `useLeads` & `useLeadNotes` | PostgreSQL Database | `leads`, `lead_notes`, `lead_reminders` | Store commercial equipment inquiries and CRM follow-ups in PostgreSQL. |
| **Audit & Activity Logs** | `use-data.ts` & `activity_logs` | PostgreSQL Database | `activity_logs` | Log all admin create/update/delete actions with user identity and timestamp. |

---

## 4. Single Source of Truth Architecture

```
                                  ┌───────────────────────────────┐
                                  │       MEGGS KITCHEN           │
                                  │   React + Tailwind Frontend   │
                                  └──────────────┬────────────────┘
                                                 │
                                 HTTPS / Supabase Client SDK
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
       ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
       │      Supabase Auth      │  │  PostgreSQL Relational  │  │    Supabase Storage     │
       │                         │  │        Database         │  │                         │
       │ - Owner Identity        │  │ - products / categories │  │ - product_images bucket │
       │ - Staff Identity        │  │ - orders / order_items  │  │ - media_assets bucket   │
       │ - Customer Identity     │  │ - customers / leads     │  │ - documents bucket      │
       │ - Role & JWT Tokens     │  │ - cms_pages / settings  │  │ - invoice_pdfs bucket   │
       │                         │  │ - inventory / movements │  │                         │
       │                         │  │ - audit / activity_logs │  │                         │
       └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

### Architecture Principles:
1. **Zero Duplicate Tables**: All entities share unified primary keys (`UUID` v4) referencing existing relational definitions.
2. **Zero Secondary Backends**: No intermediate mock servers or separate JSON endpoints. The client connects directly to PostgreSQL via the secure Supabase client.
3. **Strict Separation of Concerns**:
   - **Database (PostgreSQL)**: Pure business state, transaction records, pricing, catalog taxonomy, permissions.
   - **Object Storage (Supabase Storage)**: High-resolution product imagery, equipment specification PDF spec sheets, media library uploads.
   - **Identity (Supabase Auth)**: User credentials, secure sessions, role claims.
   - **Local Browser Storage**: Limited strictly to transient client-side UI states (unauthenticated cart, search history chips, compare drawer).

---

## 5. Phase 2 Conclusion & Next Steps

1. **Audit Complete**: All 18 business data sources, storage vectors, and fallback arrays have been discovered, categorized, and mapped.
2. **Readiness for Phase 3 (Database Schema & Seed Execution)**:
   - All target PostgreSQL tables are identified.
   - Seed scripts will populate complete MEGGS KITCHEN product lines, categories, brands, CMS pages, navigation menus, and default site settings.
   - Runtime fallback structures will be progressively superseded by live PostgreSQL data.
