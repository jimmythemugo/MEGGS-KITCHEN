/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  subcategory_id?: string | null;
  subcategory?: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  cost_price?: number | null;
  selling_price?: number | null;
  wholesale_price?: number | null;
  discount_price?: number | null;
  tax_rate?: number | null;
  sale_price?: number | null;
  compare_at_price?: number | null;
  unit: string;
  image_url: string | null;
  gallery_urls: string[];
  featured: boolean;
  is_featured?: boolean;
  rating?: number;
  is_trending?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_clearance?: boolean;
  in_stock: boolean;
  stock_status?: string;
  inventory_quantity?: number;
  display_order: number;
  is_active: boolean;
  brand_id: string | null;
  supplier_id?: string | null;
  warehouse_id?: string | null;
  storage_section?: string | null;
  shelf_number?: string | null;
  sku: string | null;
  barcode?: string | null;
  qr_code?: string | null;
  origin_country?: string | null;
  material?: string | null;
  colour?: string | null;
  capacity?: string | null;
  collection?: string | null;
  thickness_mm?: number | string | null;
  weight_kg?: number | string | null;
  dimensions?: string | null;
  pack_size?: string | null;
  coverage_per_unit?: string | null;
  installation_method?: string | null;
  is_indoor?: boolean;
  is_outdoor?: boolean;
  room_suitability?: string | string[] | null;
  slip_rating?: string | null;
  water_resistance?: string | null;
  abrasion_rating?: string | null;
  fire_rating?: string | null;
  warranty_years?: number | null;
  warranty_description?: string | null;
  meta_title: string | null;
  meta_description: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  minimum_stock?: number | null;
  maximum_stock?: number | null;
  reorder_level?: number | null;
  expiration_date?: string | null;
  has_serial_number?: boolean;
  has_batch_number?: boolean;
  serial_numbers?: string[];
  batch_numbers?: string[];
  related_products: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
  brand?: ProductBrand;
  supplier?: Supplier;
  warehouse?: Warehouse;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  variants?: ProductVariant[];
  documents?: ProductDocument[];
  tags?: ProductTag[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductSpecification {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  price_adjustment: number;
  sale_price?: number | null;
  stock_quantity: number;
  low_stock_threshold?: number;
  attributes: Record<string, any>;
  is_active: boolean;
  is_default?: boolean;
  display_order: number;
}

export interface ProductDocument {
  id: string;
  product_id: string;
  document_name: string;
  document_url: string;
  document_type: string;
  display_order: number;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  notes: string | null;
  delivery_zone_id: string | null;
  delivery_address: string | null;
  delivery_charge: number;
  coupon_id: string | null;
  discount_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  delivery?: Delivery;
  delivery_zone?: DeliveryZone;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  avatar_url: string | null;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  description?: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Quotation {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  project_type: string | null;
  area_size: string | null;
  location: string | null;
  message: string | null;
  status: QuotationStatus;
  quotation_number: string | null;
  valid_until: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  pdf_url: string | null;
  sent_at: string | null;
  responded_at: string | null;
  converted_order_id: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  items?: QuotationItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

// New types for production features
export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NavigationMenu {
  id: string;
  menu_name: string;
  location: string;
  label: string;
  href: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
}

export interface ThemeSetting {
  id: string;
  theme_name: string;
  preset: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  button_style: string;
  border_radius: number;
  spacing_scale: number;
  layout_style: 'classic' | 'showcase';
  is_active: boolean;
}

export interface HomepageSection {
  id: string;
  section_type: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  display_order: number;
  is_active: boolean;
  background_color: string | null;
  background_image: string | null;
  padding: string;
}

export interface DeliveryZone {
  id: string;
  zone_name: string;
  regions: string[];
  base_charge: number;
  free_delivery_minimum: number | null;
  estimated_days: string;
  is_active: boolean;
  display_order: number;
}

export interface Delivery {
  id: string;
  order_id: string;
  zone_id: string | null;
  tracking_number: string | null;
  status: 'pending' | 'processing' | 'dispatched' | 'in_transit' | 'delivered' | 'failed';
  delivery_address: string | null;
  delivery_notes: string | null;
  scheduled_date: string | null;
  delivered_at: string | null;
  driver_name: string | null;
  driver_phone: string | null;
}

export interface Promotion {
  id: string;
  promo_type: 'banner' | 'flash_sale' | 'featured' | 'announcement' | 'popup';
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  button_link?: string | null;
  link_text: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  position: string;
  background_color: string | null;
  text_color: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  coupon_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  current_uses: number;
  start_date: string | null;
  end_date: string | null;
  applies_to: 'all' | 'products' | 'categories';
  is_active: boolean;
}

export interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
}

export interface MediaFile {
  id: string;
  folder_id: string | null;
  filename: string;
  original_name: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  title: string | null;
  is_public: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  service_type: string | null;
  category: string | null;
  location: string | null;
  project_date: string | null;
  completion_date: string | null;
  project_value: number | null;
  area_size: string | null;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  images?: ProjectImage[];
}

export interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  image_type: 'before' | 'after' | 'progress' | 'other';
  caption: string | null;
  display_order: number;
}

export interface SeoPage {
  id: string;
  page_type: string;
  page_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  structured_data: Record<string, any> | null;
  no_index: boolean;
  no_follow: boolean;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number | null;
  new_stock: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  product?: Product;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  variant_id: string | null;
  alert_type: string;
  threshold: number;
  current_stock: number;
  is_resolved: boolean;
  resolved_at: string | null;
  product?: Product;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================
// CRM
// ============================================================
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiating' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  customer_name?: string | null;
  company_name?: string | null;
  lead_stage?: string | null;
  preferred_contact_method?: string | null;
  budget_range?: string | null;
  project_location?: string | null;
  project_address?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  lead_number?: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: LeadStatus;
  estimated_value: number | null;
  lost_reason: string | null;
  assigned_to: string | null;
  converted_customer_id: string | null;
  converted_quotation_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead_notes?: LeadNote[];
  lead_reminders?: LeadReminder[];
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface LeadReminder {
  id: string;
  lead_id: string;
  due_at: string;
  note: string | null;
  completed: boolean;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

// ============================================================
// Quotations (upgraded)
// ============================================================
export type QuotationStatus =
  | 'new' | 'contacted' | 'quoted' | 'won' | 'lost' // legacy values
  | 'draft' | 'sent' | 'negotiating' | 'accepted' | 'rejected' | 'converted';

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  display_order: number;
}

// ============================================================
// Invoicing
// ============================================================
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'mpesa' | 'bank_transfer' | 'card' | 'cheque' | 'other';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  order_id: string | null;
  quotation_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  billing_address: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  due_date: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  display_order: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

// ============================================================
// Retail ERP & Inventory Module Upgrades
// ============================================================

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number?: string | null;
  products_supplied?: string | string[] | null;
  purchase_history_count?: number;
  outstanding_balance?: number;
  performance_rating?: number; // 1 to 5
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'ordered' | 'received' | 'closed' | 'cancelled' | 'sent' | 'partial';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  status: PurchaseOrderStatus;
  total_amount?: number;
  expected_date: string | null;
  notes: string | null;
  created_by: string | null;
  pdf_url?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total?: number;
  product?: Product;
}

export interface Warehouse {
  id: string;
  name: string;
  manager_name: string | null;
  location: string | null;
  storage_sections: string[]; // e.g. ["Section A", "Section B", "Cold Storage"]
  shelf_numbers: string[]; // e.g. ["A-01", "A-02", "B-01"]
  capacity_units: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  section: string | null;
  shelf: string | null;
  quantity: number;
  reserved_quantity: number;
  updated_at: string;
  warehouse?: Warehouse;
  product?: Product;
}

export interface GoodsReceivedNote {
  id: string;
  grn_number: string;
  po_id: string | null;
  supplier_id: string | null;
  warehouse_id: string;
  received_date: string;
  received_by: string;
  status: 'received' | 'verified' | 'discrepancy' | 'rejected';
  notes: string | null;
  created_at: string;
  items?: GRNItem[];
  supplier?: Supplier;
  warehouse?: Warehouse;
  po?: PurchaseOrder;
}

export interface GRNItem {
  id: string;
  grn_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_damaged: number;
  storage_section: string | null;
  shelf_number: string | null;
  unit_cost: number;
  notes: string | null;
  product?: Product;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  source_warehouse_id: string;
  target_warehouse_id: string;
  product_id: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  reason: string | null;
  transfer_date: string;
  created_by: string;
  notes: string | null;
  created_at: string;
  source_warehouse?: Warehouse;
  target_warehouse?: Warehouse;
  product?: Product;
}

export interface DamagedStock {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reason: 'damaged' | 'expired' | 'broken_in_transit' | 'defective' | 'other';
  cost_price: number;
  reported_by: string;
  reported_at: string;
  action_taken: 'scrapped' | 'returned_to_supplier' | 'discounted_sale' | 'pending';
  status: 'pending' | 'approved' | 'resolved';
  notes: string | null;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface StockReturn {
  id: string;
  return_number: string;
  return_type: 'customer_return' | 'supplier_return';
  order_id?: string | null;
  po_id?: string | null;
  customer_name?: string | null;
  supplier_name?: string | null;
  product_id: string;
  quantity: number;
  condition: 'resellable' | 'damaged' | 'refurbished' | 'scrapped';
  refund_amount: number;
  reason: string;
  status: 'pending' | 'inspected' | 'approved' | 'processed' | 'rejected';
  processed_by?: string | null;
  created_at: string;
  product?: Product;
}

export type ERPUserRole =
  | 'Administrator'
  | 'Inventory Manager'
  | 'Warehouse Staff'
  | 'Sales Staff'
  | 'Customer Support'
  | 'Accountant'
  | 'Owner';

export interface RolePermission {
  id: string;
  role: ERPUserRole;
  description: string;
  permissions: string[]; // e.g. ["inventory.read", "inventory.write", "po.approve"]
  is_custom: boolean;
  user_count: number;
  updated_at: string;
}

export type OrderFulfilmentStage =
  | 'order_received'
  | 'reserve_stock'
  | 'picking'
  | 'packing'
  | 'dispatch'
  | 'delivered'
  | 'completed';

export interface OrderFulfilmentLog {
  id: string;
  order_id: string;
  stage: OrderFulfilmentStage;
  previous_stage: string | null;
  updated_by: string;
  notes: string | null;
  stock_deducted: boolean;
  timestamp: string;
}

