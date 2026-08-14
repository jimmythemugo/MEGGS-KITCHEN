-- ============================================================================
-- MEGGS KITCHEN — ROW LEVEL SECURITY POLICIES
-- Migration: 20260814000002_row_level_security.sql
-- Description: Enable RLS and define granular access policies for
--              Public-Read, Customer-Owned, and Admin/Owner access.
-- ============================================================================

-- Helper function to check if current authenticated user is an Admin or Owner
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'owner', 'staff')
        AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL CORE TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_reminders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. PUBLIC STOREFRONT READ POLICIES
-- ----------------------------------------------------------------------------

-- Categories
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

-- Brands & Partners
CREATE POLICY "Public can view active brands"
  ON brands FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view product_brands"
  ON product_brands FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view partners"
  ON partners FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

-- Products & Specs
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Public can view product variants"
  ON product_variants FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view product attributes"
  ON product_attributes FOR SELECT
  USING (true);

CREATE POLICY "Public can view product specifications"
  ON product_specifications FOR SELECT
  USING (true);

CREATE POLICY "Public can view product tags"
  ON product_tags FOR SELECT
  USING (true);

CREATE POLICY "Public can view product documents"
  ON product_documents FOR SELECT
  USING (true);

-- Reviews & Testimonials
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true OR (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR is_admin_or_owner());

CREATE POLICY "Public can view active testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

-- Promotions & Coupons
CREATE POLICY "Public can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view promotion products"
  ON promotion_products FOR SELECT
  USING (true);

CREATE POLICY "Public can validate active coupons"
  ON coupons FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view active delivery zones"
  ON delivery_zones FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

-- Website CMS & Settings
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Public can view active theme"
  ON theme_settings FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view active homepage sections"
  ON homepage_sections FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view active hero slides"
  ON hero_slides FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view published cms pages"
  ON cms_pages FOR SELECT
  USING (is_published = true OR is_admin_or_owner());

CREATE POLICY "Public can view navigation items"
  ON navigation_items FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view navigation menus"
  ON navigation_menus FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view media assets"
  ON media_assets FOR SELECT
  USING (is_public = true OR is_admin_or_owner());

CREATE POLICY "Public can view media files"
  ON media_files FOR SELECT
  USING (true);

CREATE POLICY "Public can view services"
  ON services FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view projects"
  ON projects FOR SELECT
  USING (is_active = true OR is_admin_or_owner());

CREATE POLICY "Public can view project images"
  ON project_images FOR SELECT
  USING (true);

CREATE POLICY "Public can view seo pages"
  ON seo_pages FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 3. CUSTOMER SELF-MANAGED POLICIES
-- ----------------------------------------------------------------------------

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin_or_owner());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin_or_owner())
  WITH CHECK (auth.uid() = id OR is_admin_or_owner());

-- Addresses
CREATE POLICY "Users can manage their own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = user_id OR is_admin_or_owner())
  WITH CHECK (auth.uid() = user_id OR is_admin_or_owner());

-- Cart Items
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id OR is_admin_or_owner())
  WITH CHECK (auth.uid() = user_id OR is_admin_or_owner());

-- Wishlists
CREATE POLICY "Users can manage their own wishlists"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id OR is_admin_or_owner())
  WITH CHECK (auth.uid() = user_id OR is_admin_or_owner());

CREATE POLICY "Users can manage their wishlist items"
  ON wishlist_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_items.wishlist_id AND (user_id = auth.uid() OR is_admin_or_owner()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM wishlists WHERE id = wishlist_items.wishlist_id AND (user_id = auth.uid() OR is_admin_or_owner()))
  );

-- Orders & Order Items
CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id OR is_admin_or_owner());

CREATE POLICY "Public and Customers can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Customers can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (customer_id = auth.uid() OR is_admin_or_owner()))
  );

CREATE POLICY "Public and Customers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Reviews
CREATE POLICY "Authenticated users can submit reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Contact & Newsletter
CREATE POLICY "Public can submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Quotation Requests
CREATE POLICY "Public can submit quotation requests"
  ON quotations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can submit quotation items"
  ON quotation_items FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. OWNER / ADMIN FULL ACCESS POLICIES
-- ----------------------------------------------------------------------------

-- Admin full access macro for all management tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'profiles', 'categories', 'brands', 'product_brands', 'partners',
    'products', 'product_images', 'product_variants', 'product_attributes',
    'product_specifications', 'product_tags', 'product_documents',
    'warehouses', 'inventory', 'inventory_movements', 'inventory_alerts',
    'delivery_zones', 'coupons', 'orders', 'order_items', 'payments',
    'reviews', 'testimonials', 'promotions', 'promotion_products',
    'site_settings', 'theme_settings', 'homepage_sections', 'hero_slides',
    'cms_pages', 'navigation_items', 'navigation_menus', 'media_folders',
    'media_assets', 'media_files', 'contact_messages', 'newsletter_subscribers',
    'audit_logs', 'activity_logs', 'quotations', 'quotation_items',
    'invoices', 'invoice_items', 'services', 'projects', 'project_images',
    'seo_pages', 'leads', 'lead_notes', 'lead_reminders'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Admin full access on %I" ON %I;
      CREATE POLICY "Admin full access on %I"
        ON %I FOR ALL
        TO authenticated
        USING (is_admin_or_owner())
        WITH CHECK (is_admin_or_owner());
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;
