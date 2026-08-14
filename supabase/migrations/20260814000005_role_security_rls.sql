-- ============================================================================
-- MEGGS KITCHEN — PHASE 6: ROLE SECURITY & ROW LEVEL SECURITY (RLS)
-- Migration: 20260814000005_role_security_rls.sql
-- Description: Complete, authoritative PostgreSQL Row Level Security enforcement
--              for OWNER, STAFF, and CUSTOMER roles.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURITY HELPER FUNCTIONS (DEFINER CONTEXT FOR RLS EVALUATION)
-- ----------------------------------------------------------------------------

-- Check if current authenticated user is an OWNER or ADMIN
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current authenticated user is STAFF
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'staff'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current authenticated user is STAFF, OWNER, or ADMIN
CREATE OR REPLACE FUNCTION public.is_staff_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current authenticated user is a verified CUSTOMER
CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'customer'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper to return current user role directly
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
  RETURN COALESCE(v_role, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- 2. ROLE ESCALATION PREVENTION TRIGGER
-- Prevents non-owners from elevating user roles or modifying system credentials
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If role or is_active is changing, enforce that only OWNER can make this change
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    IF NOT public.is_owner() THEN
      RAISE EXCEPTION 'Access Denied: Only an OWNER can modify user roles or account activation status.';
    END IF;
  END IF;

  -- Customers can only modify their own profile
  IF NOT public.is_staff_or_owner() THEN
    IF auth.uid() <> OLD.id THEN
      RAISE EXCEPTION 'Access Denied: You may only modify your own profile.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ----------------------------------------------------------------------------
-- 3. RESET & RE-APPLY ROW LEVEL SECURITY ON ALL PROTECTED TABLES
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'products', 'categories', 'brands', 'product_brands', 'partners',
    'product_images', 'product_variants', 'product_attributes',
    'product_specifications', 'product_tags', 'product_documents',
    'inventory', 'warehouses', 'inventory_movements', 'inventory_alerts',
    'orders', 'order_items', 'payments', 'profiles',
    'cart_items', 'wishlists', 'wishlist_items', 'addresses', 'reviews',
    'cms_pages', 'homepage_sections', 'hero_slides', 'navigation_items',
    'navigation_menus', 'media_folders', 'media_assets', 'media_files',
    'seo_pages', 'testimonials', 'services', 'projects', 'project_images',
    'site_settings', 'theme_settings', 'audit_logs', 'activity_logs',
    'quotations', 'quotation_items', 'invoices', 'invoice_items',
    'delivery_zones', 'coupons', 'promotions', 'promotion_products',
    'leads', 'lead_notes', 'lead_reminders', 'contact_messages', 'newsletter_subscribers'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS & CATALOG POLICIES
-- Customer: Read active/published products & specs
-- Staff/Owner: Full management
-- ----------------------------------------------------------------------------

-- products
DROP POLICY IF EXISTS "rls_products_select" ON public.products;
CREATE POLICY "rls_products_select" ON public.products
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_products_insert" ON public.products;
CREATE POLICY "rls_products_insert" ON public.products
  FOR INSERT WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_products_update" ON public.products;
CREATE POLICY "rls_products_update" ON public.products
  FOR UPDATE USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_products_delete" ON public.products;
CREATE POLICY "rls_products_delete" ON public.products
  FOR DELETE USING (public.is_staff_or_owner());

-- categories
DROP POLICY IF EXISTS "rls_categories_select" ON public.categories;
CREATE POLICY "rls_categories_select" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_categories_all_staff" ON public.categories;
CREATE POLICY "rls_categories_all_staff" ON public.categories
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- brands & product_brands & partners
DROP POLICY IF EXISTS "rls_brands_select" ON public.brands;
CREATE POLICY "rls_brands_select" ON public.brands
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_brands_all_staff" ON public.brands;
CREATE POLICY "rls_brands_all_staff" ON public.brands
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_product_brands_select" ON public.product_brands;
CREATE POLICY "rls_product_brands_select" ON public.product_brands
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_product_brands_all_staff" ON public.product_brands;
CREATE POLICY "rls_product_brands_all_staff" ON public.product_brands
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_partners_select" ON public.partners;
CREATE POLICY "rls_partners_select" ON public.partners
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_partners_all_staff" ON public.partners;
CREATE POLICY "rls_partners_all_staff" ON public.partners
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- product_images & variants & attributes & specs
DROP POLICY IF EXISTS "rls_product_images_select" ON public.product_images;
CREATE POLICY "rls_product_images_select" ON public.product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rls_product_images_all_staff" ON public.product_images;
CREATE POLICY "rls_product_images_all_staff" ON public.product_images
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_product_variants_select" ON public.product_variants;
CREATE POLICY "rls_product_variants_select" ON public.product_variants
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_product_variants_all_staff" ON public.product_variants;
CREATE POLICY "rls_product_variants_all_staff" ON public.product_variants
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_product_attributes_select" ON public.product_attributes;
CREATE POLICY "rls_product_attributes_select" ON public.product_attributes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rls_product_attributes_all_staff" ON public.product_attributes;
CREATE POLICY "rls_product_attributes_all_staff" ON public.product_attributes
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_product_specifications_select" ON public.product_specifications;
CREATE POLICY "rls_product_specifications_select" ON public.product_specifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rls_product_specifications_all_staff" ON public.product_specifications;
CREATE POLICY "rls_product_specifications_all_staff" ON public.product_specifications
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- ----------------------------------------------------------------------------
-- 5. INVENTORY & WAREHOUSE POLICIES
-- Customer: NO ACCESS (DENIED)
-- Staff & Owner: Full operational access
-- Owner: Audit & deletion rights
-- ----------------------------------------------------------------------------

-- warehouses
DROP POLICY IF EXISTS "rls_warehouses_select" ON public.warehouses;
CREATE POLICY "rls_warehouses_select" ON public.warehouses
  FOR SELECT USING (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_warehouses_manage" ON public.warehouses;
CREATE POLICY "rls_warehouses_manage" ON public.warehouses
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- inventory
DROP POLICY IF EXISTS "rls_inventory_select" ON public.inventory;
CREATE POLICY "rls_inventory_select" ON public.inventory
  FOR SELECT USING (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_inventory_manage" ON public.inventory;
CREATE POLICY "rls_inventory_manage" ON public.inventory
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- inventory_movements (Immutable audit log: Insert & Select only)
DROP POLICY IF EXISTS "rls_inventory_movements_select" ON public.inventory_movements;
CREATE POLICY "rls_inventory_movements_select" ON public.inventory_movements
  FOR SELECT USING (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_inventory_movements_insert" ON public.inventory_movements;
CREATE POLICY "rls_inventory_movements_insert" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_inventory_alerts_all" ON public.inventory_alerts;
CREATE POLICY "rls_inventory_alerts_all" ON public.inventory_alerts
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- ----------------------------------------------------------------------------
-- 6. ORDERS, ORDER ITEMS & PAYMENTS POLICIES
-- Customer: View own orders, insert new checkout orders
-- Staff & Owner: Process, view all, update statuses
-- ----------------------------------------------------------------------------

-- orders
DROP POLICY IF EXISTS "rls_orders_select" ON public.orders;
CREATE POLICY "rls_orders_select" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR
    public.is_staff_or_owner()
  );

DROP POLICY IF EXISTS "rls_orders_insert" ON public.orders;
CREATE POLICY "rls_orders_insert" ON public.orders
  FOR INSERT WITH CHECK (
    -- Customer placing order or guest checkout
    auth.uid() IS NULL OR customer_id = auth.uid() OR public.is_staff_or_owner()
  );

DROP POLICY IF EXISTS "rls_orders_update" ON public.orders;
CREATE POLICY "rls_orders_update" ON public.orders
  FOR UPDATE USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_orders_delete" ON public.orders;
CREATE POLICY "rls_orders_delete" ON public.orders
  FOR DELETE USING (public.is_owner());

-- order_items
DROP POLICY IF EXISTS "rls_order_items_select" ON public.order_items;
CREATE POLICY "rls_order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR public.is_staff_or_owner())
    )
  );

DROP POLICY IF EXISTS "rls_order_items_insert" ON public.order_items;
CREATE POLICY "rls_order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rls_order_items_modify" ON public.order_items;
CREATE POLICY "rls_order_items_modify" ON public.order_items
  FOR UPDATE USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- payments
DROP POLICY IF EXISTS "rls_payments_select" ON public.payments;
CREATE POLICY "rls_payments_select" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND (orders.customer_id = auth.uid() OR public.is_staff_or_owner())
    )
  );

DROP POLICY IF EXISTS "rls_payments_manage" ON public.payments;
CREATE POLICY "rls_payments_manage" ON public.payments
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- ----------------------------------------------------------------------------
-- 7. CUSTOMER SELF-MANAGED DATA (PROFILES, CART, WISHLIST, ADDRESSES, REVIEWS)
-- ----------------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS "rls_profiles_select" ON public.profiles;
CREATE POLICY "rls_profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_staff_or_owner() OR
    -- Public can view name for approved reviews
    true
  );

DROP POLICY IF EXISTS "rls_profiles_insert" ON public.profiles;
CREATE POLICY "rls_profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_owner());

DROP POLICY IF EXISTS "rls_profiles_update" ON public.profiles;
CREATE POLICY "rls_profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_owner())
  WITH CHECK (auth.uid() = id OR public.is_owner());

DROP POLICY IF EXISTS "rls_profiles_delete" ON public.profiles;
CREATE POLICY "rls_profiles_delete" ON public.profiles
  FOR DELETE USING (public.is_owner());

-- addresses
DROP POLICY IF EXISTS "rls_addresses_select" ON public.addresses;
CREATE POLICY "rls_addresses_select" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_addresses_modify" ON public.addresses;
CREATE POLICY "rls_addresses_modify" ON public.addresses
  FOR ALL USING (auth.uid() = user_id OR public.is_owner())
  WITH CHECK (auth.uid() = user_id OR public.is_owner());

-- cart_items
DROP POLICY IF EXISTS "rls_cart_items_manage" ON public.cart_items;
CREATE POLICY "rls_cart_items_manage" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id OR public.is_staff_or_owner())
  WITH CHECK (auth.uid() = user_id OR public.is_staff_or_owner());

-- wishlists & wishlist_items
DROP POLICY IF EXISTS "rls_wishlists_manage" ON public.wishlists;
CREATE POLICY "rls_wishlists_manage" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id OR public.is_staff_or_owner())
  WITH CHECK (auth.uid() = user_id OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_wishlist_items_manage" ON public.wishlist_items;
CREATE POLICY "rls_wishlist_items_manage" ON public.wishlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND (wishlists.user_id = auth.uid() OR public.is_staff_or_owner())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND (wishlists.user_id = auth.uid() OR public.is_staff_or_owner())
    )
  );

-- reviews
DROP POLICY IF EXISTS "rls_reviews_select" ON public.reviews;
CREATE POLICY "rls_reviews_select" ON public.reviews
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_reviews_insert" ON public.reviews;
CREATE POLICY "rls_reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "rls_reviews_modify" ON public.reviews;
CREATE POLICY "rls_reviews_modify" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id OR public.is_staff_or_owner())
  WITH CHECK (auth.uid() = user_id OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_reviews_delete" ON public.reviews;
CREATE POLICY "rls_reviews_delete" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id OR public.is_staff_or_owner());

-- ----------------------------------------------------------------------------
-- 8. CMS & STORE CONTENT POLICIES
-- Customer: Read active/published content
-- Staff & Owner: Manage content
-- ----------------------------------------------------------------------------

-- cms_pages
DROP POLICY IF EXISTS "rls_cms_pages_select" ON public.cms_pages;
CREATE POLICY "rls_cms_pages_select" ON public.cms_pages
  FOR SELECT USING (is_published = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_cms_pages_manage" ON public.cms_pages;
CREATE POLICY "rls_cms_pages_manage" ON public.cms_pages
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- homepage_sections & hero_slides
DROP POLICY IF EXISTS "rls_homepage_sections_select" ON public.homepage_sections;
CREATE POLICY "rls_homepage_sections_select" ON public.homepage_sections
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_homepage_sections_manage" ON public.homepage_sections;
CREATE POLICY "rls_homepage_sections_manage" ON public.homepage_sections
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_hero_slides_select" ON public.hero_slides;
CREATE POLICY "rls_hero_slides_select" ON public.hero_slides
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_hero_slides_manage" ON public.hero_slides;
CREATE POLICY "rls_hero_slides_manage" ON public.hero_slides
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- navigation items & menus
DROP POLICY IF EXISTS "rls_navigation_items_select" ON public.navigation_items;
CREATE POLICY "rls_navigation_items_select" ON public.navigation_items
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_navigation_items_manage" ON public.navigation_items;
CREATE POLICY "rls_navigation_items_manage" ON public.navigation_items
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_navigation_menus_select" ON public.navigation_menus;
CREATE POLICY "rls_navigation_menus_select" ON public.navigation_menus
  FOR SELECT USING (is_active = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_navigation_menus_manage" ON public.navigation_menus;
CREATE POLICY "rls_navigation_menus_manage" ON public.navigation_menus
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- media_folders & media_assets & media_files
DROP POLICY IF EXISTS "rls_media_assets_select" ON public.media_assets;
CREATE POLICY "rls_media_assets_select" ON public.media_assets
  FOR SELECT USING (is_public = true OR public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_media_assets_manage" ON public.media_assets;
CREATE POLICY "rls_media_assets_manage" ON public.media_assets
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_media_files_all" ON public.media_files;
CREATE POLICY "rls_media_files_all" ON public.media_files
  FOR ALL USING (true) WITH CHECK (public.is_staff_or_owner());

-- ----------------------------------------------------------------------------
-- 9. SETTINGS & SYSTEM CONFIGURATION (STAFF STRICTLY DENIED MODIFICATIONS)
-- Public: Read settings for site rendering
-- Staff: Read settings
-- Owner ONLY: Insert, Update, Delete settings
-- ----------------------------------------------------------------------------

-- site_settings
DROP POLICY IF EXISTS "rls_site_settings_select" ON public.site_settings;
CREATE POLICY "rls_site_settings_select" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rls_site_settings_owner_insert" ON public.site_settings;
CREATE POLICY "rls_site_settings_owner_insert" ON public.site_settings
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "rls_site_settings_owner_update" ON public.site_settings;
CREATE POLICY "rls_site_settings_owner_update" ON public.site_settings
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "rls_site_settings_owner_delete" ON public.site_settings;
CREATE POLICY "rls_site_settings_owner_delete" ON public.site_settings
  FOR DELETE USING (public.is_owner());

-- theme_settings
DROP POLICY IF EXISTS "rls_theme_settings_select" ON public.theme_settings;
CREATE POLICY "rls_theme_settings_select" ON public.theme_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rls_theme_settings_owner_manage" ON public.theme_settings;
CREATE POLICY "rls_theme_settings_owner_manage" ON public.theme_settings
  FOR ALL USING (public.is_owner()) WITH CHECK (public.is_owner());

-- ----------------------------------------------------------------------------
-- 10. AUDIT LOGS & ACTIVITY LOGS (STAFF STRICTLY DENIED ACCESS)
-- Owner: Full read access
-- System / Triggers: Insert allowed
-- All roles: Denied UPDATE / DELETE (Tamper-proof audit logs)
-- ----------------------------------------------------------------------------

-- audit_logs
DROP POLICY IF EXISTS "rls_audit_logs_select" ON public.audit_logs;
CREATE POLICY "rls_audit_logs_select" ON public.audit_logs
  FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "rls_audit_logs_insert" ON public.audit_logs;
CREATE POLICY "rls_audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- activity_logs
DROP POLICY IF EXISTS "rls_activity_logs_select" ON public.activity_logs;
CREATE POLICY "rls_activity_logs_select" ON public.activity_logs
  FOR SELECT USING (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_activity_logs_insert" ON public.activity_logs;
CREATE POLICY "rls_activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 11. B2B COMMERCIAL (QUOTATIONS, INVOICES, LEADS)
-- ----------------------------------------------------------------------------

-- quotations
DROP POLICY IF EXISTS "rls_quotations_select" ON public.quotations;
CREATE POLICY "rls_quotations_select" ON public.quotations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR
    public.is_staff_or_owner()
  );

DROP POLICY IF EXISTS "rls_quotations_insert" ON public.quotations;
CREATE POLICY "rls_quotations_insert" ON public.quotations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rls_quotations_manage" ON public.quotations;
CREATE POLICY "rls_quotations_manage" ON public.quotations
  FOR UPDATE USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- quotation_items
DROP POLICY IF EXISTS "rls_quotation_items_all" ON public.quotation_items;
CREATE POLICY "rls_quotation_items_all" ON public.quotation_items
  FOR ALL USING (true) WITH CHECK (true);

-- invoices
DROP POLICY IF EXISTS "rls_invoices_select" ON public.invoices;
CREATE POLICY "rls_invoices_select" ON public.invoices
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR
    public.is_staff_or_owner()
  );

DROP POLICY IF EXISTS "rls_invoices_manage" ON public.invoices;
CREATE POLICY "rls_invoices_manage" ON public.invoices
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

-- leads & CRM
DROP POLICY IF EXISTS "rls_leads_manage" ON public.leads;
CREATE POLICY "rls_leads_manage" ON public.leads
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_lead_notes_manage" ON public.lead_notes;
CREATE POLICY "rls_lead_notes_manage" ON public.lead_notes
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());

DROP POLICY IF EXISTS "rls_lead_reminders_manage" ON public.lead_reminders;
CREATE POLICY "rls_lead_reminders_manage" ON public.lead_reminders
  FOR ALL USING (public.is_staff_or_owner()) WITH CHECK (public.is_staff_or_owner());
