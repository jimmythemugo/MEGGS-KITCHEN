-- ============================================================================
-- MEGGS KITCHEN — SUPABASE AUTHENTICATION & PROFILES MIGRATION
-- Migration: 20260814000004_auth_migration.sql
-- Description: Sets up Supabase Auth triggers, profile synchronization,
--              role resolution functions, and security enforcement.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AUTH TRIGGER FUNCTION: SYNC AUTH.USERS -> PUBLIC.PROFILES
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_role TEXT;
  v_company TEXT;
BEGIN
  -- Extract metadata with safe fallbacks
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_company := NEW.raw_user_meta_data->>'company_name';
  
  -- Default role is customer; validate roles
  v_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  IF v_role NOT IN ('customer', 'staff', 'admin', 'owner') THEN
    v_role := 'customer';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    company_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_phone,
    v_role,
    v_company,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if the auth schema is present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. ROLE & PERMISSION HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS JSONB AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
  
  IF v_role = 'owner' OR v_role = 'admin' THEN
    RETURN jsonb_build_array(
      'all.access',
      'dashboard:view',
      'financials:view',
      'products:view',
      'products:write',
      'inventory:view',
      'inventory:write',
      'orders:view',
      'orders:write',
      'customers:view',
      'customers:write',
      'settings:view',
      'settings:write',
      'roles:manage',
      'reports:view'
    );
  ELSIF v_role = 'staff' THEN
    RETURN jsonb_build_array(
      'dashboard:view',
      'products:view',
      'products:write',
      'inventory:view',
      'inventory:write',
      'orders:view',
      'orders:write',
      'customers:view',
      'customers:write'
    );
  ELSE
    RETURN jsonb_build_array(
      'shop:browse',
      'cart:checkout',
      'orders:view_own',
      'profile:manage'
    );
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. SEED BASE SYSTEM PROFILES
-- ----------------------------------------------------------------------------

INSERT INTO public.profiles (id, email, full_name, phone, role, company_name, is_active, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'owner@meggskitchen.test',
    'Meggs Kitchen Owner',
    '+254 700 000 001',
    'owner',
    'MEGGS KITCHEN HQ',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'staff@meggskitchen.test',
    'Sales & Inventory Staff',
    '+254 700 000 002',
    'staff',
    'MEGGS KITCHEN Operations',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'customer@meggskitchen.test',
    'Commercial Kitchens Client',
    '+254 700 000 003',
    'customer',
    'Savannah Bistro & Grill',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  company_name = EXCLUDED.company_name;

-- ----------------------------------------------------------------------------
-- 4. PROFILE RLS ENHANCEMENTS
-- ----------------------------------------------------------------------------

-- Ensure authenticated users can insert their own profile during registration
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR is_admin_or_owner());

-- Ensure public can read basic profile info for reviews/testimonials if needed
DROP POLICY IF EXISTS "Public can view reviewer profiles" ON public.profiles;
CREATE POLICY "Public can view reviewer profiles"
  ON public.profiles FOR SELECT
  USING (true);
