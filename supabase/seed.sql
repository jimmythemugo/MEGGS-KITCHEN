-- ============================================================================
-- MEGGS KITCHEN — AUTHORITATIVE SEED SCRIPT
-- File: supabase/seed.sql
-- Description: Controlled seed data for MEGGS KITCHEN development & production
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, image_url, icon_name, display_order, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Commercial Cooking Equipment', 'commercial-cooking-equipment', 'Heavy-duty commercial ranges, deep fryers, griddles, and combi ovens.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80', 'Flame', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Commercial Refrigeration', 'commercial-refrigeration', 'Upright chillers, under-counter freezers, display coolers, and ice machines.', 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=800&q=80', 'Snowflake', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Bakery & Pastry Equipment', 'bakery-pastry-equipment', 'Spiral dough mixers, planetary mixers, deck ovens, and bread slicers.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 'Cake', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Food Preparation Machines', 'food-preparation-machines', 'Meat mincers, bone saws, vegetable cutters, planetary mixers, and blenders.', 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80', 'Utensils', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Stainless Steel Fabrication', 'stainless-steel-fabrication', 'Custom prep tables, double-bowl sink units, wall shelves, and exhaust hoods.', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80', 'Layers', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'Professional Cookware & Pans', 'professional-cookware-pans', 'Gastronorm pans, stainless steel stockpots, cast iron skillets, and woks.', 'https://images.unsplash.com/photo-1584990347449-39906663f736?w=800&q=80', 'ChefHat', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Chef Knives & Cutlery', 'chef-knives-cutlery', 'German steel chef knives, cleavers, sharpening stones, and cutting boards.', 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80', 'Scissors', 7, true),
  ('c1000000-0000-0000-0000-000000000008', 'Beverage & Bar Systems', 'beverage-bar-systems', 'Commercial espresso machines, slush machines, juice dispensers, and blenders.', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80', 'Coffee', 8, true),
  ('c1000000-0000-0000-0000-000000000009', 'Buffet & Catering Equipment', 'buffet-catering-equipment', 'Chafing dishes, soup warmers, banquet hot boxes, and polycarbonate dispensers.', 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80', 'Award', 9, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order;

-- ----------------------------------------------------------------------------
-- 2. BRANDS
-- ----------------------------------------------------------------------------
INSERT INTO brands (id, name, slug, logo_url, description, country_of_origin, is_authorized_distributor, display_order, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Citronic Commercial', 'citronic-commercial', 'https://images.unsplash.com/photo-1581291518655-9523c93269c3?w=400&q=80', 'Heavy duty commercial kitchen ranges and food processing machinery.', 'United Kingdom', true, 1, true),
  ('b1000000-0000-0000-0000-000000000002', 'Blinkmax Premium Glassware', 'blinkmax-premium-glassware', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', 'Commercial barware, tumblers, decanters, and buffet service glass.', 'Germany', true, 2, true),
  ('b1000000-0000-0000-0000-000000000003', 'KAL Commercial Refrigeration', 'kal-commercial-refrigeration', 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&q=80', 'High-efficiency tropicalized chillers, display freezers, and cold rooms.', 'Italy', true, 3, true),
  ('b1000000-0000-0000-0000-000000000004', 'Master Baker Industrial', 'master-baker-industrial', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', 'Industrial bakery deck ovens, rotary ovens, and heavy spiral mixers.', 'Turkey', true, 4, true),
  ('b1000000-0000-0000-0000-000000000005', 'Royal Stainless Steel Fab', 'royal-stainless-steel-fab', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400&q=80', 'Commercial Grade SS304 prep tables, sinks, and custom extraction canopies.', 'Kenya', true, 5, true),
  ('b1000000-0000-0000-0000-000000000006', 'ThermoFrost Cold Chain', 'thermofrost-cold-chain', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', 'Commercial ice makers, blast chillers, and refrigerated prep counters.', 'Italy', true, 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- Also seed product_brands table
INSERT INTO product_brands (id, name, slug, logo_url, description, country_of_origin, is_active, display_order)
SELECT id, name, slug, logo_url, description, country_of_origin, is_active, display_order FROM brands
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
INSERT INTO products (
  id, category_id, brand_id, name, slug, sku, price, compare_at_price, cost_price, unit,
  primary_image_url, stock_quantity, low_stock_threshold, in_stock, is_featured, is_trending,
  is_new_arrival, is_best_seller, is_commercial, rating, review_count, short_description, description
) VALUES
  (
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'Heavy Duty 6-Burner Commercial Gas Range with Oven',
    'heavy-duty-6-burner-commercial-gas-range-oven',
    'MG-CK-6B-001',
    185000.00,
    210000.00,
    135000.00,
    'unit',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
    14,
    3,
    true,
    true,
    true,
    false,
    true,
    true,
    4.95,
    28,
    'Heavy duty 6-burner commercial gas cooker with large capacity static oven, crafted in SS304 stainless steel.',
    'Engineered for rigorous hotel and restaurant kitchen operations. Features heavy cast iron trivets, high-output cast burners with pilot lights, flame failure safety valves, and a high-efficiency insulated gas oven capable of holding 2/1 Gastronorm pans.'
  ),
  (
    'p1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000003',
    'Commercial Double Door Upright Stainless Chiller (1200L)',
    'commercial-double-door-upright-stainless-chiller-1200l',
    'MG-RF-2D-002',
    245000.00,
    275000.00,
    180000.00,
    'unit',
    'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=800&q=80',
    8,
    2,
    true,
    true,
    false,
    true,
    true,
    true,
    4.90,
    19,
    '1200 Litre twin door commercial upright chiller with ventilated cooling and digital Carel controller.',
    'Heavy duty tropicalized commercial refrigerator rated for +43°C ambient temperature. Includes fan-assisted cooling for uniform temperature, self-closing doors with magnetic gaskets, and adjustable epoxy-coated shelving.'
  ),
  (
    'p1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000004',
    'Industrial 30-Litre Double Speed Spiral Dough Mixer',
    'industrial-30-litre-double-speed-spiral-dough-mixer',
    'MG-BK-SM-003',
    165000.00,
    190000.00,
    115000.00,
    'unit',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    12,
    3,
    true,
    true,
    true,
    false,
    false,
    true,
    4.88,
    15,
    'Double action spiral dough mixer for high-yield bakeries, pizzerias, and commercial kitchens.',
    'Heavy-duty cast iron body with high-grade stainless steel bowl and spiral arm. Two-speed motor with reverse bowl rotation and digital timer for consistent dough texture and maximum gluten development.'
  ),
  (
    'p1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000001',
    'Commercial Heavy Duty Electric Meat Mincer & Grinder #32',
    'commercial-electric-meat-mincer-grinder-32',
    'MG-FP-MM-004',
    78000.00,
    89000.00,
    52000.00,
    'unit',
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80',
    22,
    5,
    true,
    false,
    true,
    false,
    true,
    true,
    4.85,
    34,
    'High output electric meat mincer with 1.5kW pure copper motor and reverse gear functionality.',
    'Capable of grinding up to 320kg of meat per hour. Made with food grade polished aluminum-magnesium alloy body and hardened stainless steel cutting plate and knife.'
  ),
  (
    'p1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000005',
    'b1000000-0000-0000-0000-000000000005',
    'Commercial SS304 Stainless Steel Worktable (6ft x 2.5ft)',
    'commercial-ss304-stainless-steel-worktable-6ft',
    'MG-SS-WT-005',
    38500.00,
    45000.00,
    24000.00,
    'unit',
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80',
    35,
    8,
    true,
    true,
    false,
    false,
    true,
    true,
    4.96,
    42,
    'Heavy gauge 1.2mm Food Grade SS304 central prep table with reinforced undershelf.',
    'Built to withstand heavy chopping, plating, and preparation. Reinforced sound deadening underside with heavy duty galvanized tubular legs and adjustable bullet leveling feet.'
  ),
  (
    'p1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000006',
    'b1000000-0000-0000-0000-000000000001',
    'Tri-Ply Stainless Steel Professional Stockpot with Lid (45L)',
    'tri-ply-stainless-steel-professional-stockpot-45l',
    'MG-CW-SP-006',
    18500.00,
    22000.00,
    11000.00,
    'piece',
    'https://images.unsplash.com/photo-1584990347449-39906663f736?w=800&q=80',
    40,
    10,
    true,
    false,
    true,
    false,
    true,
    false,
    4.92,
    61,
    'Commercial 45-Litre tri-ply clad stockpot engineered for induction, gas, and electric ranges.',
    'Heavy impact-bonded aluminum encapsulated base ensures rapid and uniform heat distribution with zero hot spots. Stay-cool riveted ergonomic handles designed for safety during kitchen service.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity;

-- ----------------------------------------------------------------------------
-- 4. PRODUCT SPECIFICATIONS & VARIANTS
-- ----------------------------------------------------------------------------
INSERT INTO product_attributes (product_id, attribute_name, attribute_value, display_order)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Fuel Type', 'LPG / Natural Gas', 1),
  ('p1000000-0000-0000-0000-000000000001', 'Burner Count', '6 x High Power Cast Burners', 2),
  ('p1000000-0000-0000-0000-000000000001', 'Material', 'Food Grade SS304 Stainless Steel', 3),
  ('p1000000-0000-0000-0000-000000000001', 'Dimensions', '1200 x 900 x 850 + 100mm Splashback', 4),
  ('p1000000-0000-0000-0000-000000000001', 'Warranty', '2 Years Comprehensive Commercial Warranty', 5),
  ('p1000000-0000-0000-0000-000000000002', 'Gross Capacity', '1200 Litres', 1),
  ('p1000000-0000-0000-0000-000000000002', 'Temperature Range', '-2°C to +8°C', 2),
  ('p1000000-0000-0000-0000-000000000002', 'Refrigerant', 'Eco-friendly R290 Hydrocarbon', 3),
  ('p1000000-0000-0000-0000-000000000002', 'Controller', 'Digital Carel Microprocessor with LED Display', 4);

-- Also insert into product_specifications for backward compatibility
INSERT INTO product_specifications (product_id, spec_name, spec_value, display_order)
SELECT product_id, attribute_name, attribute_value, display_order FROM product_attributes;

-- ----------------------------------------------------------------------------
-- 5. DELIVERY ZONES
-- ----------------------------------------------------------------------------
INSERT INTO delivery_zones (id, zone_name, regions, base_charge, free_delivery_minimum, estimated_days, display_order, is_active)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Nairobi CBD & Inner Environs', ARRAY['Nairobi CBD', 'Westlands', 'Kilimani', 'Upper Hill', 'Parklands', 'Industrial Area'], 500.00, 20000.00, 'Same Day / 24 Hours', 1, true),
  ('d1000000-0000-0000-0000-000000000002', 'Greater Nairobi & Suburbs', ARRAY['Karen', 'Runda', 'Lavington', 'Kasarani', 'Thika Road', 'Syokimau', 'Rongai'], 1000.00, 35000.00, '1 Business Day', 2, true),
  ('d1000000-0000-0000-0000-000000000003', 'Coast Region (Mombasa, Malindi, Diani)', ARRAY['Mombasa', 'Nyali', 'Diani', 'Malindi', 'Kilifi'], 2500.00, 80000.00, '2-3 Business Days', 3, true),
  ('d1000000-0000-0000-0000-000000000004', 'Rift Valley & Western Kenya', ARRAY['Nakuru', 'Eldoret', 'Kisumu', 'Kakamega', 'Kericho'], 2500.00, 80000.00, '2-3 Business Days', 4, true),
  ('d1000000-0000-0000-0000-000000000005', 'East Africa Regional (Uganda, Tanzania, Rwanda)', ARRAY['Kampala', 'Dar es Salaam', 'Arusha', 'Kigali'], 7500.00, 250000.00, '4-7 Business Days', 5, true)
ON CONFLICT (id) DO UPDATE SET
  zone_name = EXCLUDED.zone_name,
  base_charge = EXCLUDED.base_charge;

-- ----------------------------------------------------------------------------
-- 6. PROMOTIONS & COUPONS
-- ----------------------------------------------------------------------------
INSERT INTO coupons (code, coupon_type, discount_value, min_order_value, max_uses, is_active)
VALUES
  ('WELCOME10', 'percentage', 10.00, 5000.00, 1000, true),
  ('CHEF2026', 'percentage', 15.00, 25000.00, 500, true),
  ('MEGGS5000', 'fixed', 5000.00, 100000.00, 200, true)
ON CONFLICT (code) DO UPDATE SET discount_value = EXCLUDED.discount_value;

INSERT INTO promotions (id, title, subtitle, promo_type, discount_percent, position, display_order, is_active)
VALUES
  ('pr100000-0000-0000-0000-000000000001', 'Commercial Kitchen Mega Sale', 'Up to 25% off industrial ranges and bakery equipment', 'banner', 25, 'hero_bottom', 1, true),
  ('pr100000-0000-0000-0000-000000000002', 'Free Nationwide Delivery on Bulk Commercial Orders', 'Applies to orders exceeding KES 100,000 across Kenya', 'banner', 0, 'top_bar', 2, true)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- ----------------------------------------------------------------------------
-- 7. CMS PAGES & SITE SETTINGS
-- ----------------------------------------------------------------------------
INSERT INTO cms_pages (slug, title, content, is_published)
VALUES
  (
    'about',
    'About MEGGS KITCHEN',
    '# About MEGGS KITCHEN\n\nMEGGS KITCHEN is East Africa’s premier distributor and fabricator of professional commercial kitchen equipment, catering supplies, and industrial bakery machinery.\n\n### Our Mission\nTo empower chefs, restaurateurs, hoteliers, and culinary artisans with world-class, reliable kitchen infrastructure tailored for the African culinary industry.',
    true
  ),
  (
    'commercial-kitchens',
    'Commercial Kitchen Turnkey Solutions',
    '# Commercial Kitchen Turnkey Solutions\n\nFrom concept layout design to MEP engineering, custom SS304 fabrication, equipment delivery, professional installation, and ongoing preventive maintenance.',
    true
  ),
  (
    'warranty',
    'Warranty & Service Policy',
    '# Warranty & Preventive Maintenance\n\nAll commercial machinery supplied by MEGGS KITCHEN comes backed with a minimum 1 to 2 year manufacturer warranty and guaranteed genuine spare parts availability in Nairobi.',
    true
  ),
  (
    'privacy-policy',
    'Privacy Policy',
    '# Privacy Policy\n\nMEGGS KITCHEN respects your privacy and complies with the Kenya Data Protection Act 2019.',
    true
  ),
  (
    'terms',
    'Terms & Conditions',
    '# Terms of Service & Commercial Conditions\n\nBy accessing MEGGS KITCHEN or placing orders, you agree to our standard trade and commercial terms.',
    true
  )
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

INSERT INTO site_settings (setting_key, setting_value)
VALUES
  ('site_info', '{
    "company_name": "MEGGS KITCHEN",
    "tagline": "East Africa’s Premier Commercial Kitchen Equipment & Culinary Store",
    "phone": "+254 700 000 000",
    "email": "info@meggskitchen.com",
    "address": "Commercial Street, Industrial Area, Nairobi, Kenya",
    "currency": "KES",
    "currency_symbol": "KES"
  }'::jsonb),
  ('contact', '{
    "hotline": "+254 700 000 000",
    "whatsapp": "+254 700 000 000",
    "sales_email": "sales@meggskitchen.com",
    "support_email": "support@meggskitchen.com",
    "showroom_hours": "Mon - Sat: 8:00 AM - 6:00 PM"
  }'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- ----------------------------------------------------------------------------
-- 8. TESTIMONIALS
-- ----------------------------------------------------------------------------
INSERT INTO testimonials (name, role, company, content, rating, display_order, is_active)
VALUES
  ('Chef Marcus Kamau', 'Executive Head Chef', 'Serena Hotels Nairobi', 'MEGGS KITCHEN outfitted our entire banquet kitchen with heavy-duty 6-burner ranges and custom stainless steel tables. The build quality and after-sales support have been exceptional.', 5, 1, true),
  ('Sarah Wanjiku', 'Managing Director', 'Artisan Crust Bakery', 'The industrial spiral mixers and deck ovens we purchased have run non-stop for 18 months without a single hitch. Reliable equipment and fast delivery.', 5, 2, true),
  ('David Omondi', 'Operations Manager', 'Java House East Africa', 'Their commercial refrigeration units hold temperature accurately even in peak tropical heat. Highly recommended for commercial culinary operations.', 5, 3, true);

-- ----------------------------------------------------------------------------
-- 9. PROFILES (AUTH USERS)
-- ----------------------------------------------------------------------------
INSERT INTO profiles (id, email, full_name, phone, role, company_name, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'owner@meggskitchen.test', 'Meggs Kitchen Owner', '+254 700 000 001', 'owner', 'MEGGS KITCHEN HQ', true),
  ('00000000-0000-0000-0000-000000000002', 'staff@meggskitchen.test', 'Sales & Inventory Staff', '+254 700 000 002', 'staff', 'MEGGS KITCHEN Operations', true),
  ('00000000-0000-0000-0000-000000000003', 'customer@meggskitchen.test', 'Commercial Kitchens Client', '+254 700 000 003', 'customer', 'Savannah Bistro & Grill', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  company_name = EXCLUDED.company_name;

