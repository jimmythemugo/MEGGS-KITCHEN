# MEGGS KITCHEN — PHASE 3: DATABASE ARCHITECTURE BLUEPRINT

**Document Version**: 3.0.0  
**Target RDBMS**: PostgreSQL 15+ / Supabase  
**Identity System**: Supabase Auth (`auth.users`)  
**Storage System**: Supabase Storage  

---

## 1. Executive Summary & Design Principles

This database architecture blueprint defines the unified PostgreSQL relational model for the **MEGGS KITCHEN** e-commerce marketplace and commercial culinary equipment management system.

### Core Architectural Principles:
1. **Single Source of Truth (SSOT)**: All business data, catalog taxonomy, transactions, customer profiles, CMS layouts, and audit logs reside within PostgreSQL.
2. **Identity Integration**: Customer and administrative users are linked to `auth.users(id)` via Foreign Keys on `profiles(id)`.
3. **Optimized Indexing**: Foreign keys, slug fields, lookup keys, display order columns, and filter flags are indexed using PostgreSQL B-tree and GIN indexes.
4. **Data Integrity & Cascade Policies**: Foreign keys enforce referential integrity with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL` constraints.
5. **Security & Row-Level Access Segmentation**: Tables are categorized into **Public-Read**, **Customer-Owned (RLS)**, and **Owner / Admin-Only (Restricted)**.

---

## 2. Access Control & Ownership Taxonomy

| Access Class | Access Policy Description | Associated Tables |
| :--- | :--- | :--- |
| **Public-Read (Storefront)** | Anyone (guest or authenticated) can SELECT active rows. Only Admins/Owner can INSERT, UPDATE, DELETE. | `categories`, `brands`, `products`, `product_images`, `product_variants`, `product_attributes`, `reviews` (approved only), `promotions`, `promotion_products`, `coupons` (active lookup), `delivery_zones`, `site_settings` (public keys), `homepage_sections`, `hero_slides`, `cms_pages`, `navigation_items`, `media_assets` (public), `testimonials`. |
| **Customer-Owned (Self RLS)** | Customers can read/write ONLY their own records (`auth.uid() = user_id` or `customer_id`). Admins have full oversight. | `profiles`, `addresses`, `cart_items`, `wishlists`, `wishlist_items`, `orders`, `order_items`, `reviews` (author can create/edit their own), `contact_messages` (submit only). |
| **Owner / Staff-Restricted** | Strictly accessible to authenticated users with `admin` or `owner` role claims. No anonymous or standard customer access. | `inventory`, `inventory_movements`, `site_settings` (internal keys), `newsletter_subscribers`, `audit_logs`. |

---

## 3. Relational Entity Relationship Topology

```
                  ┌─────────────────┐
                  │   auth.users    │
                  └────────┬────────┘
                           │ 1:1
                           ▼
                  ┌─────────────────┐
                  │    profiles     │◀─────────────────────────┐
                  └────────┬────────┘                          │
                           │ 1:N                               │
         ┌─────────────────┼─────────────────┐                 │
         │ 1:N             │ 1:N             │ 1:N             │
         ▼                 ▼                 ▼                 │
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
  │  addresses  │   │  wishlists  │   │ cart_items  │          │
  └─────────────┘   └──────┬──────┘   └──────┬──────┘          │
                           │ 1:N             │                 │
                           ▼                 │                 │
                    ┌─────────────┐          │                 │
                    │wishlist_item│          │                 │
                    └──────┬──────┘          │                 │
                           │                 │                 │
                           │                 ▼                 │
                           │          ┌─────────────┐          │
                           └─────────▶│  products   │◀─────────┤
                                      └──────┬──────┘          │
                                             │                 │
     ┌──────────────────┬────────────────────┼─────────────────┤
     │ 1:N              │ 1:N                │ 1:N             │ 1:N
     ▼                  ▼                    ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  ┌─────────────┐
│product_image│  │product_varian│  │product_attributes│  │   reviews   │
└─────────────┘  └──────────────┘  └──────────────────┘  └─────────────┘
                                             ▲
                                             │
                                      ┌──────┴──────┐
                                      │ order_items │
                                      └──────▲──────┘
                                             │ 1:N
                                      ┌──────┴──────┐
                                      │   orders    │──────────┘
                                      └─────────────┘
```

---

## 4. Comprehensive Schema Definitions

---

### Table 1: `profiles`
*User profile extending Supabase Auth (`auth.users`), storing customer & staff identity, role, and contact information.*

- **Columns**:
  - `id` (UUID, PK, FK -> `auth.users(id)` ON DELETE CASCADE)
  - `email` (TEXT, NOT NULL)
  - `full_name` (TEXT, NOT NULL)
  - `phone` (TEXT, NULL)
  - `role` (TEXT, NOT NULL, DEFAULT `'customer'`) -- `'customer'`, `'staff'`, `'admin'`, `'owner'`
  - `company_name` (TEXT, NULL)
  - `tax_pin` (TEXT, NULL)
  - `avatar_url` (TEXT, NULL)
  - `is_b2b` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_profiles_email` (B-tree on `email`)
  - `idx_profiles_role` (B-tree on `role`)
- **Ownership**: Customer-owned (self-profile access) + Owner/Admin read-all.

---

### Table 2: `categories`
*Product taxonomy categories (e.g., Cookware, Knives, Commercial Ovens, Bakeware).*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `name` (TEXT, NOT NULL)
  - `slug` (TEXT, NOT NULL, UNIQUE)
  - `description` (TEXT, NULL)
  - `image_url` (TEXT, NULL)
  - `parent_id` (UUID, NULL, FK -> `categories(id)` ON DELETE SET NULL)
  - `icon_name` (TEXT, NULL)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `parent_id` REFERENCES `categories(id)` ON DELETE SET NULL
- **Unique Constraints**: `slug`
- **Indexes**:
  - `idx_categories_slug` (UNIQUE on `slug`)
  - `idx_categories_parent_id` (B-tree on `parent_id`)
  - `idx_categories_active_order` (B-tree on `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 3: `brands`
*Global culinary manufacturers and authorized distributor brand profiles.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `name` (TEXT, NOT NULL)
  - `slug` (TEXT, NOT NULL, UNIQUE)
  - `logo_url` (TEXT, NULL)
  - `description` (TEXT, NULL)
  - `website_url` (TEXT, NULL)
  - `country_of_origin` (TEXT, NULL)
  - `is_authorized_distributor` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Unique Constraints**: `slug`
- **Indexes**:
  - `idx_brands_slug` (UNIQUE on `slug`)
  - `idx_brands_active_order` (B-tree on `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 4: `products`
*Master commercial and retail culinary product catalog.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `category_id` (UUID, NULL, FK -> `categories(id)` ON DELETE SET NULL)
  - `brand_id` (UUID, NULL, FK -> `brands(id)` ON DELETE SET NULL)
  - `name` (TEXT, NOT NULL)
  - `slug` (TEXT, NOT NULL, UNIQUE)
  - `sku` (TEXT, NULL, UNIQUE)
  - `barcode` (TEXT, NULL)
  - `short_description` (TEXT, NULL)
  - `description` (TEXT, NULL)
  - `price` (NUMERIC(12, 2), NOT NULL, DEFAULT `0.00`)
  - `compare_at_price` (NUMERIC(12, 2), NULL)
  - `wholesale_price` (NUMERIC(12, 2), NULL)
  - `cost_price` (NUMERIC(12, 2), NULL)
  - `unit` (TEXT, NOT NULL, DEFAULT `'piece'`) -- `'piece'`, `'set'`, `'pack'`, `'unit'`, `'box'`, `'kg'`
  - `primary_image_url` (TEXT, NULL)
  - `stock_quantity` (INTEGER, NOT NULL, DEFAULT `0`)
  - `low_stock_threshold` (INTEGER, NOT NULL, DEFAULT `5`)
  - `in_stock` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `is_featured` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_trending` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_new_arrival` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_best_seller` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_commercial` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `rating` (NUMERIC(3, 2), NOT NULL, DEFAULT `5.00`)
  - `review_count` (INTEGER, NOT NULL, DEFAULT `0`)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `meta_title` (TEXT, NULL)
  - `meta_description` (TEXT, NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `category_id` REFERENCES `categories(id)` ON DELETE SET NULL
  - `brand_id` REFERENCES `brands(id)` ON DELETE SET NULL
- **Unique Constraints**: `slug`, `sku`
- **Indexes**:
  - `idx_products_slug` (UNIQUE on `slug`)
  - `idx_products_sku` (UNIQUE on `sku`)
  - `idx_products_category_id` (B-tree on `category_id`)
  - `idx_products_brand_id` (B-tree on `brand_id`)
  - `idx_products_active_featured` (B-tree on `is_active`, `is_featured`)
  - `idx_products_price` (B-tree on `price`)
- **Ownership**: Public-read / Owner-write.

---

### Table 5: `product_images`
*Secondary gallery imagery for products.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `image_url` (TEXT, NOT NULL)
  - `alt_text` (TEXT, NULL)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_primary` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_product_images_product_id` (B-tree on `product_id`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 6: `product_variants`
*Product variations (e.g., pan diameter, bowl capacity, knife blade length, electric voltage).*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `variant_name` (TEXT, NOT NULL)
  - `sku` (TEXT, NULL, UNIQUE)
  - `price_adjustment` (NUMERIC(12, 2), NOT NULL, DEFAULT `0.00`)
  - `sale_price` (NUMERIC(12, 2), NULL)
  - `stock_quantity` (INTEGER, NOT NULL, DEFAULT `0`)
  - `attributes` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`) -- e.g., `{"capacity": "35L", "material": "SS304", "voltage": "240V"}`
  - `is_default` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_product_variants_product_id` (B-tree on `product_id`)
  - `idx_product_variants_sku` (B-tree on `sku`)
- **Ownership**: Public-read / Owner-write.

---

### Table 7: `product_attributes` (Specifications)
*Normalized technical culinary specifications.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `attribute_name` (TEXT, NOT NULL) -- e.g., 'Material', 'Power Rating', 'Capacity', 'Dimensions', 'Warranty'
  - `attribute_value` (TEXT, NOT NULL) -- e.g., 'Food Grade 304 Stainless Steel', '1800W / 240V', '45 Litres'
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_product_attributes_product_id` (B-tree on `product_id`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 8: `inventory`
*Physical stock allocation across store branches and storage warehouses.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `variant_id` (UUID, NULL, FK -> `product_variants(id)` ON DELETE CASCADE)
  - `warehouse_name` (TEXT, NOT NULL, DEFAULT `'Main Nairobi Hub'`)
  - `storage_section` (TEXT, NULL)
  - `shelf_number` (TEXT, NULL)
  - `quantity_on_hand` (INTEGER, NOT NULL, DEFAULT `0`)
  - `quantity_reserved` (INTEGER, NOT NULL, DEFAULT `0`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `product_id` REFERENCES `products(id)` ON DELETE CASCADE
  - `variant_id` REFERENCES `product_variants(id)` ON DELETE CASCADE
- **Unique Constraints**: `(product_id, variant_id, warehouse_name)`
- **Indexes**:
  - `idx_inventory_product_lookup` (B-tree on `product_id`, `variant_id`)
- **Ownership**: Staff / Owner Restricted.

---

### Table 9: `inventory_movements`
*Audit ledger recording all stock movements (goods received, order deduction, adjustment, return).*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `variant_id` (UUID, NULL, FK -> `product_variants(id)` ON DELETE SET NULL)
  - `movement_type` (TEXT, NOT NULL) -- `'in'`, `'out'`, `'adjustment'`, `'return'`, `'damaged'`
  - `quantity` (INTEGER, NOT NULL)
  - `previous_stock` (INTEGER, NOT NULL)
  - `new_stock` (INTEGER, NOT NULL)
  - `reference_type` (TEXT, NULL) -- `'order'`, `'purchase_order'`, `'manual_audit'`, `'return'`
  - `reference_id` (TEXT, NULL)
  - `notes` (TEXT, NULL)
  - `created_by` (UUID, NULL, FK -> `profiles(id)` ON DELETE SET NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `product_id` REFERENCES `products(id)` ON DELETE CASCADE
  - `created_by` REFERENCES `profiles(id)` ON DELETE SET NULL
- **Indexes**:
  - `idx_inventory_movements_product_id` (B-tree on `product_id`, `created_at` DESC)
- **Ownership**: Staff / Owner Restricted.

---

### Table 10: `addresses`
*Saved customer billing and physical delivery addresses.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `user_id` (UUID, NOT NULL, FK -> `profiles(id)` ON DELETE CASCADE)
  - `address_type` (TEXT, NOT NULL, DEFAULT `'shipping'`) -- `'shipping'`, `'billing'`
  - `recipient_name` (TEXT, NOT NULL)
  - `phone_number` (TEXT, NOT NULL)
  - `street_address` (TEXT, NOT NULL)
  - `building_name` (TEXT, NULL)
  - `city` (TEXT, NOT NULL, DEFAULT `'Nairobi'`)
  - `county` (TEXT, NOT NULL, DEFAULT `'Nairobi County'`)
  - `postal_code` (TEXT, NULL)
  - `is_default` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_addresses_user_id` (B-tree on `user_id`)
- **Ownership**: Customer-owned.

---

### Table 11: `cart_items`
*Persistent shopping cart storage for logged-in users.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `user_id` (UUID, NOT NULL, FK -> `profiles(id)` ON DELETE CASCADE)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `variant_id` (UUID, NULL, FK -> `product_variants(id)` ON DELETE CASCADE)
  - `quantity` (INTEGER, NOT NULL, DEFAULT `1`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
  - `product_id` REFERENCES `products(id)` ON DELETE CASCADE
  - `variant_id` REFERENCES `product_variants(id)` ON DELETE CASCADE
- **Unique Constraints**: `(user_id, product_id, variant_id)`
- **Indexes**:
  - `idx_cart_items_user_id` (B-tree on `user_id`)
- **Ownership**: Customer-owned.

---

### Table 12: `wishlists`
*Customer wishlist containers.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `user_id` (UUID, NOT NULL, FK -> `profiles(id)` ON DELETE CASCADE)
  - `name` (TEXT, NOT NULL, DEFAULT `'My Wishlist'`)
  - `is_public` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_wishlists_user_id` (B-tree on `user_id`)
- **Ownership**: Customer-owned.

---

### Table 13: `wishlist_items`
*Individual products linked to a wishlist.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `wishlist_id` (UUID, NOT NULL, FK -> `wishlists(id)` ON DELETE CASCADE)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `wishlist_id` REFERENCES `wishlists(id)` ON DELETE CASCADE
  - `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- **Unique Constraints**: `(wishlist_id, product_id)`
- **Indexes**:
  - `idx_wishlist_items_wishlist_id` (B-tree on `wishlist_id`)
- **Ownership**: Customer-owned.

---

### Table 14: `orders`
*Customer sales orders and checkout transactions.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `order_number` (TEXT, NOT NULL, UNIQUE) -- e.g., `'MG-893012'`
  - `customer_id` (UUID, NULL, FK -> `profiles(id)` ON DELETE SET NULL)
  - `customer_name` (TEXT, NOT NULL)
  - `customer_email` (TEXT, NOT NULL)
  - `customer_phone` (TEXT, NOT NULL)
  - `subtotal` (NUMERIC(12, 2), NOT NULL)
  - `delivery_charge` (NUMERIC(12, 2), NOT NULL, DEFAULT `0.00`)
  - `discount_amount` (NUMERIC(12, 2), NOT NULL, DEFAULT `0.00`)
  - `total_amount` (NUMERIC(12, 2), NOT NULL)
  - `status` (TEXT, NOT NULL, DEFAULT `'pending'`) -- `'pending'`, `'confirmed'`, `'processing'`, `'dispatched'`, `'completed'`, `'cancelled'`
  - `payment_status` (TEXT, NOT NULL, DEFAULT `'pending'`) -- `'pending'`, `'paid'`, `'failed'`, `'refunded'`
  - `payment_method` (TEXT, NOT NULL, DEFAULT `'mpesa'`) -- `'mpesa'`, `'card'`, `'bank_transfer'`, `'cash_on_delivery'`
  - `payment_reference` (TEXT, NULL) -- M-Pesa transaction code
  - `delivery_zone_id` (UUID, NULL, FK -> `delivery_zones(id)` ON DELETE SET NULL)
  - `delivery_address` (TEXT, NULL)
  - `coupon_id` (UUID, NULL, FK -> `coupons(id)` ON DELETE SET NULL)
  - `notes` (TEXT, NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `customer_id` REFERENCES `profiles(id)` ON DELETE SET NULL
  - `delivery_zone_id` REFERENCES `delivery_zones(id)` ON DELETE SET NULL
  - `coupon_id` REFERENCES `coupons(id)` ON DELETE SET NULL
- **Unique Constraints**: `order_number`
- **Indexes**:
  - `idx_orders_order_number` (UNIQUE on `order_number`)
  - `idx_orders_customer_id` (B-tree on `customer_id`)
  - `idx_orders_status` (B-tree on `status`)
  - `idx_orders_created_at` (B-tree on `created_at` DESC)
- **Ownership**: Customer-owned (view own orders) + Owner/Staff full access.

---

### Table 15: `order_items`
*Line items associated with an order.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `order_id` (UUID, NOT NULL, FK -> `orders(id)` ON DELETE CASCADE)
  - `product_id` (UUID, NULL, FK -> `products(id)` ON DELETE SET NULL)
  - `variant_id` (UUID, NULL, FK -> `product_variants(id)` ON DELETE SET NULL)
  - `product_name` (TEXT, NOT NULL)
  - `sku` (TEXT, NULL)
  - `unit_price` (NUMERIC(12, 2), NOT NULL)
  - `quantity` (INTEGER, NOT NULL, DEFAULT `1`)
  - `line_total` (NUMERIC(12, 2), NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `order_id` REFERENCES `orders(id)` ON DELETE CASCADE
  - `product_id` REFERENCES `products(id)` ON DELETE SET NULL
  - `variant_id` REFERENCES `product_variants(id)` ON DELETE SET NULL
- **Indexes**:
  - `idx_order_items_order_id` (B-tree on `order_id`)
- **Ownership**: Inherited from `orders`.

---

### Table 16: `reviews`
*Customer verified product ratings and feedback.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `user_id` (UUID, NULL, FK -> `profiles(id)` ON DELETE SET NULL)
  - `author_name` (TEXT, NOT NULL)
  - `author_email` (TEXT, NOT NULL)
  - `rating` (INTEGER, NOT NULL CHECK (rating >= 1 AND rating <= 5))
  - `title` (TEXT, NULL)
  - `comment` (TEXT, NOT NULL)
  - `is_verified_purchase` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_approved` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `product_id` REFERENCES `products(id)` ON DELETE CASCADE
  - `user_id` REFERENCES `profiles(id)` ON DELETE SET NULL
- **Indexes**:
  - `idx_reviews_product_approved` (B-tree on `product_id`, `is_approved`)
- **Ownership**: Public-read (approved) / Customer-write (own) / Owner-moderate.

---

### Table 17: `promotions`
*Site-wide promotional campaigns, flash sales, and banner triggers.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `title` (TEXT, NOT NULL)
  - `subtitle` (TEXT, NULL)
  - `promo_type` (TEXT, NOT NULL, DEFAULT `'banner'`) -- `'banner'`, `'flash_sale'`, `'featured'`, `'popup'`
  - `image_url` (TEXT, NULL)
  - `link_url` (TEXT, NULL)
  - `link_text` (TEXT, NULL, DEFAULT `'Shop Now'`)
  - `discount_percent` (INTEGER, NULL)
  - `position` (TEXT, NOT NULL, DEFAULT `'hero_bottom'`)
  - `start_date` (TIMESTAMPTZ, NULL)
  - `end_date` (TIMESTAMPTZ, NULL)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Indexes**:
  - `idx_promotions_active_position` (B-tree on `is_active`, `position`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 18: `promotion_products`
*Junction mapping products to specific sales promotions.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `promotion_id` (UUID, NOT NULL, FK -> `promotions(id)` ON DELETE CASCADE)
  - `product_id` (UUID, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**:
  - `promotion_id` REFERENCES `promotions(id)` ON DELETE CASCADE
  - `product_id` REFERENCES `products(id)` ON DELETE CASCADE
- **Unique Constraints**: `(promotion_id, product_id)`
- **Ownership**: Public-read / Owner-write.

---

### Table 19: `coupons`
*Discount promo codes.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `code` (TEXT, NOT NULL, UNIQUE)
  - `coupon_type` (TEXT, NOT NULL, DEFAULT `'percentage'`) -- `'percentage'`, `'fixed'`
  - `discount_value` (NUMERIC(10, 2), NOT NULL)
  - `min_order_value` (NUMERIC(10, 2), NULL)
  - `max_uses` (INTEGER, NULL)
  - `current_uses` (INTEGER, NOT NULL, DEFAULT `0`)
  - `start_date` (TIMESTAMPTZ, NULL)
  - `end_date` (TIMESTAMPTZ, NULL)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Unique Constraints**: `code`
- **Indexes**:
  - `idx_coupons_code` (UNIQUE on `code`)
- **Ownership**: Public-validate / Owner-write.

---

### Table 20: `delivery_zones`
*Regional delivery zones and shipping rates across Kenya.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `zone_name` (TEXT, NOT NULL) -- e.g., 'Nairobi CBD & Westlands', 'Nairobi Environs', 'Mombasa & Coastal', 'Upcountry East Africa'
  - `regions` (TEXT[], NOT NULL, DEFAULT `'{}'::text[]`)
  - `base_charge` (NUMERIC(10, 2), NOT NULL, DEFAULT `0.00`)
  - `free_delivery_minimum` (NUMERIC(10, 2), NULL)
  - `estimated_days` (TEXT, NOT NULL, DEFAULT `'1-2 business days'`)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Indexes**:
  - `idx_delivery_zones_active` (B-tree on `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 21: `site_settings`
*Key-value dynamic site configuration, contacts, SEO defaults, and branding JSONB.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `setting_key` (TEXT, NOT NULL, UNIQUE) -- e.g., `'site_info'`, `'contact'`, `'social_links'`, `'seo_defaults'`, `'footer'`
  - `setting_value` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Unique Constraints**: `setting_key`
- **Indexes**:
  - `idx_site_settings_key` (UNIQUE on `setting_key`)
- **Ownership**: Public-read (public keys) / Owner-write.

---

### Table 22: `homepage_sections`
*Configurable homepage layout builder sections.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `section_key` (TEXT, NOT NULL, UNIQUE) -- e.g., `'hero'`, `'services'`, `'categories'`, `'products'`, `'reviews'`, `'cta'`
  - `section_type` (TEXT, NOT NULL)
  - `title` (TEXT, NULL)
  - `subtitle` (TEXT, NULL)
  - `content` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Unique Constraints**: `section_key`
- **Indexes**:
  - `idx_homepage_sections_active_order` (B-tree on `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 23: `hero_slides`
*Homepage hero banner slides with interactive CTA buttons.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `title` (TEXT, NOT NULL)
  - `subtitle` (TEXT, NULL)
  - `description` (TEXT, NULL)
  - `image_url` (TEXT, NOT NULL)
  - `button_text` (TEXT, NULL, DEFAULT `'Explore Catalog'`)
  - `button_link` (TEXT, NULL, DEFAULT `'/shop'`)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Indexes**:
  - `idx_hero_slides_active_order` (B-tree on `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 24: `cms_pages`
*Dynamic content management pages (e.g., About Us, Privacy Policy, Terms, Warranty, Commercial Kitchens).*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `slug` (TEXT, NOT NULL, UNIQUE)
  - `title` (TEXT, NOT NULL)
  - `content` (TEXT, NOT NULL)
  - `meta_title` (TEXT, NULL)
  - `meta_description` (TEXT, NULL)
  - `is_published` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Unique Constraints**: `slug`
- **Indexes**:
  - `idx_cms_pages_slug` (UNIQUE on `slug`)
- **Ownership**: Public-read / Owner-write.

---

### Table 25: `navigation_items`
*Header, mobile drawer, and footer navigation menu trees.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `menu_name` (TEXT, NOT NULL, DEFAULT `'main'`) -- `'main'`, `'mobile'`, `'footer'`
  - `label` (TEXT, NOT NULL)
  - `href` (TEXT, NOT NULL)
  - `parent_id` (UUID, NULL, FK -> `navigation_items(id)` ON DELETE CASCADE)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `open_in_new_tab` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `parent_id` REFERENCES `navigation_items(id)` ON DELETE CASCADE
- **Indexes**:
  - `idx_navigation_items_menu_order` (B-tree on `menu_name`, `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 26: `media_assets`
*Metadata index for binary media files stored in Supabase Storage buckets.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `filename` (TEXT, NOT NULL)
  - `file_url` (TEXT, NOT NULL)
  - `file_type` (TEXT, NULL)
  - `file_size` (INTEGER, NULL)
  - `width` (INTEGER, NULL)
  - `height` (INTEGER, NULL)
  - `alt_text` (TEXT, NULL)
  - `title` (TEXT, NULL)
  - `bucket_name` (TEXT, NOT NULL, DEFAULT `'media_assets'`)
  - `is_public` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `uploaded_by` (UUID, NULL, FK -> `profiles(id)` ON DELETE SET NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `uploaded_by` REFERENCES `profiles(id)` ON DELETE SET NULL
- **Indexes**:
  - `idx_media_assets_created_at` (B-tree on `created_at` DESC)
- **Ownership**: Public-read (public assets) / Owner-write.

---

### Table 27: `testimonials`
*Customer & commercial client testimonials.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `name` (TEXT, NOT NULL)
  - `role` (TEXT, NULL) -- e.g., 'Head Chef', 'Restaurant Owner', 'Culinary Enthusiast'
  - `company` (TEXT, NULL)
  - `content` (TEXT, NOT NULL)
  - `avatar_url` (TEXT, NULL)
  - `rating` (INTEGER, NOT NULL DEFAULT 5)
  - `display_order` (INTEGER, NOT NULL, DEFAULT `0`)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Indexes**:
  - `idx_testimonials_active_order` (B-tree on `is_active`, `display_order`)
- **Ownership**: Public-read / Owner-write.

---

### Table 28: `contact_messages`
*Inbound inquiries from the contact form and quotation requests.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `name` (TEXT, NOT NULL)
  - `email` (TEXT, NOT NULL)
  - `phone` (TEXT, NULL)
  - `company` (TEXT, NULL)
  - `subject` (TEXT, NULL)
  - `message` (TEXT, NOT NULL)
  - `status` (TEXT, NOT NULL, DEFAULT `'new'`) -- `'new'`, `'read'`, `'replied'`, `'archived'`
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Indexes**:
  - `idx_contact_messages_status` (B-tree on `status`, `created_at` DESC)
- **Ownership**: Anonymous-create / Owner-read-write.

---

### Table 29: `newsletter_subscribers`
*Email subscription list for product updates and culinary promotions.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `email` (TEXT, NOT NULL, UNIQUE)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `subscribed_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Unique Constraints**: `email`
- **Indexes**:
  - `idx_newsletter_subscribers_email` (UNIQUE on `email`)
- **Ownership**: Anonymous-create / Owner-read.

---

### Table 30: `audit_logs`
*Comprehensive audit ledger of administrative modifications, logins, and inventory changes.*

- **Columns**:
  - `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
  - `action` (TEXT, NOT NULL) -- e.g., `'product.create'`, `'order.status_update'`, `'settings.update'`
  - `entity_type` (TEXT, NULL)
  - `entity_id` (TEXT, NULL)
  - `actor_id` (UUID, NULL, FK -> `profiles(id)` ON DELETE SET NULL)
  - `details` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `ip_address` (TEXT, NULL)
  - `user_agent` (TEXT, NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`)
- **Primary Key**: `id`
- **Foreign Keys**: `actor_id` REFERENCES `profiles(id)` ON DELETE SET NULL
- **Indexes**:
  - `idx_audit_logs_created_at` (B-tree on `created_at` DESC)
  - `idx_audit_logs_actor_id` (B-tree on `actor_id`)
- **Ownership**: Owner / Staff Restricted.

---

## 5. Summary Matrix & Blueprint Verification

| Table Name | Entity Count / Scope | Key Relationships | Access Level |
| :--- | :--- | :--- | :--- |
| **`profiles`** | Identity / Users | 1:1 `auth.users` | Customer Owned / Owner Read |
| **`categories`** | Catalog Taxonomy | 1:N self (`parent_id`) | Public Read / Owner Write |
| **`brands`** | Brand Partners | 1:N `products` | Public Read / Owner Write |
| **`products`** | Core Catalog | N:1 `categories`, N:1 `brands` | Public Read / Owner Write |
| **`product_images`** | Gallery Media | N:1 `products` | Public Read / Owner Write |
| **`product_variants`** | Sizes / Voltage | N:1 `products` | Public Read / Owner Write |
| **`product_attributes`** | Spec Key-Values | N:1 `products` | Public Read / Owner Write |
| **`inventory`** | Physical Stock | N:1 `products`, N:1 `variants` | Staff / Owner Restricted |
| **`inventory_movements`**| Stock Audit Ledger | N:1 `products`, N:1 `profiles` | Staff / Owner Restricted |
| **`addresses`** | Customer Addresses | N:1 `profiles` | Customer Owned |
| **`cart_items`** | Active Cart | N:1 `profiles`, N:1 `products` | Customer Owned |
| **`wishlists`** | Wishlist Trays | N:1 `profiles` | Customer Owned |
| **`wishlist_items`** | Saved Items | N:1 `wishlists`, N:1 `products`| Customer Owned |
| **`orders`** | Sales Orders | N:1 `profiles`, N:1 `delivery_zones` | Customer Owned / Owner Full |
| **`order_items`** | Line Items | N:1 `orders`, N:1 `products` | Customer Owned / Owner Full |
| **`reviews`** | Product Ratings | N:1 `products`, N:1 `profiles` | Public Read (Approved) |
| **`promotions`** | Marketing Banners | 1:N `promotion_products` | Public Read / Owner Write |
| **`promotion_products`** | Banner Items Junction | N:1 `promotions`, N:1 `products` | Public Read / Owner Write |
| **`coupons`** | Discount Codes | N:1 `orders` | Public Validate / Owner Write |
| **`delivery_zones`** | Shipping Rates | 1:N `orders` | Public Read / Owner Write |
| **`site_settings`** | Global Config | Key-Value JSONB | Public Read / Owner Write |
| **`homepage_sections`** | CMS Section Builder | Layout JSONB | Public Read / Owner Write |
| **`hero_slides`** | Carousel Hero | CTA Linkage | Public Read / Owner Write |
| **`cms_pages`** | Legal & Info Pages | Markdown / HTML | Public Read / Owner Write |
| **`navigation_items`** | Header & Footer Menus | 1:N self (`parent_id`) | Public Read / Owner Write |
| **`media_assets`** | Storage Asset Index | N:1 `profiles` | Public Read / Owner Write |
| **`testimonials`** | Social Proof | Customer Quotes | Public Read / Owner Write |
| **`contact_messages`** | Inbound Leads | CRM Inquiries | Public Create / Owner Read |
| **`newsletter_subscribers`**| Email Subscriptions | Unique Email Index | Public Create / Owner Read |
| **`audit_logs`** | Admin Audit Trail | N:1 `profiles` | Owner / Staff Restricted |
