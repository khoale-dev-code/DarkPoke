/** Generated from the SQL migrations supplied for Dark Poke (including Admin V1 and Trade-in V3).
 * Refresh against the live Supabase schema with scripts/update-db-types.ps1 after external changes.
 * This snapshot was not generated from a connection to your production database. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Database = { public: { Tables: {
  profiles: { Row: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
  }; Insert: {
    id: string
    full_name?: string | null
    email?: string | null
    phone?: string | null
    avatar_url?: string | null
    created_at?: string
    updated_at?: string
  }; Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>; Relationships: [
  ] }
  staff: { Row: {
    id: string
    user_id: string | null
    email: string
    full_name: string
    role: Database["public"]["Enums"]["staff_role"]
    allow_google: boolean
    active: boolean
    pos_pin_hash: string | null
    created_at: string
    updated_at: string
  }; Insert: {
    id?: string
    user_id?: string | null
    email: string
    full_name?: string
    role?: Database["public"]["Enums"]["staff_role"]
    allow_google?: boolean
    active?: boolean
    pos_pin_hash?: string | null
    created_at?: string
    updated_at?: string
  }; Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>; Relationships: [
  ] }
  settings: { Row: {
    key: string
    value: Json
    is_public: boolean
    updated_at: string
  }; Insert: {
    key: string
    value?: Json
    is_public?: boolean
    updated_at?: string
  }; Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>; Relationships: [
  ] }
  product_types: { Row: {
    id: string
    code: string
    name: string
    description: string
    track_inventory: boolean
    is_unique: boolean
    has_variants: boolean
    allow_preorder: boolean
    allow_tradein: boolean
    hold_in_cart: boolean
    sort: number
    created_at: string
    updated_at: string
  }; Insert: {
    id?: string
    code: string
    name: string
    description?: string
    track_inventory?: boolean
    is_unique?: boolean
    has_variants?: boolean
    allow_preorder?: boolean
    allow_tradein?: boolean
    hold_in_cart?: boolean
    sort?: number
    created_at?: string
    updated_at?: string
  }; Update: Partial<Database["public"]["Tables"]["product_types"]["Insert"]>; Relationships: [
  ] }
  attribute_defs: { Row: {
    id: string
    type_id: string
    code: string
    name: string
    kind: Database["public"]["Enums"]["attr_kind"]
    options: string[]
    required: boolean
    filterable: boolean
    visible: boolean
    sort: number
  }; Insert: {
    id?: string
    type_id: string
    code: string
    name: string
    kind?: Database["public"]["Enums"]["attr_kind"]
    options?: string[]
    required?: boolean
    filterable?: boolean
    visible?: boolean
    sort?: number
  }; Update: Partial<Database["public"]["Tables"]["attribute_defs"]["Insert"]>; Relationships: [
    {foreignKeyName: "attribute_defs_type_id_fkey", columns: ["type_id"], isOneToOne: false, referencedRelation: "product_types", referencedColumns: ["id"]},
  ] }
  categories: { Row: {
    id: string
    parent_id: string | null
    name: string
    slug: string
    depth: number
    sort: number
    visible: boolean
    created_at: string
  }; Insert: {
    id?: string
    parent_id?: string | null
    name: string
    slug: string
    depth?: number
    sort?: number
    visible?: boolean
    created_at?: string
  }; Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>; Relationships: [
    {foreignKeyName: "categories_parent_id_fkey", columns: ["parent_id"], isOneToOne: false, referencedRelation: "categories", referencedColumns: ["id"]},
  ] }
  brands: { Row: {
    id: string
    name: string
    slug: string
    created_at: string
  }; Insert: {
    id?: string
    name: string
    slug: string
    created_at?: string
  }; Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>; Relationships: [
  ] }
  collections: { Row: {
    id: string
    name: string
    slug: string
    description: string
    visible: boolean
    sort: number
    created_at: string
  }; Insert: {
    id?: string
    name: string
    slug: string
    description?: string
    visible?: boolean
    sort?: number
    created_at?: string
  }; Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>; Relationships: [
  ] }
  products: { Row: {
    id: string
    type_id: string
    category_id: string | null
    brand_id: string | null
    name: string
    slug: string
    sku: string
    description: string
    unit: string
    price: number
    compare_at_price: number | null
    cost: number | null
    status: Database["public"]["Enums"]["product_status"]
    online: boolean
    pos: boolean
    is_featured: boolean
    attrs: Json
    tags: string[]
    thumbnail: string | null
    weight_g: number | null
    min_stock: number
    purchase_limit: number | null
    allow_preorder: boolean
    preorder_deposit_pct: number | null
    preorder_release_date: string | null
    preorder_slots: number | null
    preorder_closes_at: string | null
    stock_total: number
    min_price: number | null
    max_price: number | null
    variant_count: number
    seo_title: string | null
    seo_description: string | null
    search_text: string | null
    published_at: string | null
    created_at: string
    updated_at: string
  }; Insert: {
    id?: string
    type_id: string
    category_id?: string | null
    brand_id?: string | null
    name: string
    slug: string
    sku: string
    description?: string
    unit?: string
    price: number
    compare_at_price?: number | null
    cost?: number | null
    status?: Database["public"]["Enums"]["product_status"]
    online?: boolean
    pos?: boolean
    is_featured?: boolean
    attrs?: Json
    tags?: string[]
    thumbnail?: string | null
    weight_g?: number | null
    min_stock?: number
    purchase_limit?: number | null
    allow_preorder?: boolean
    preorder_deposit_pct?: number | null
    preorder_release_date?: string | null
    preorder_slots?: number | null
    preorder_closes_at?: string | null
    stock_total?: number
    min_price?: number | null
    max_price?: number | null
    variant_count?: number
    seo_title?: string | null
    seo_description?: string | null
    search_text?: never
    published_at?: string | null
    created_at?: string
    updated_at?: string
  }; Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>; Relationships: [
    {foreignKeyName: "products_type_id_fkey", columns: ["type_id"], isOneToOne: false, referencedRelation: "product_types", referencedColumns: ["id"]},
    {foreignKeyName: "products_category_id_fkey", columns: ["category_id"], isOneToOne: false, referencedRelation: "categories", referencedColumns: ["id"]},
    {foreignKeyName: "products_brand_id_fkey", columns: ["brand_id"], isOneToOne: false, referencedRelation: "brands", referencedColumns: ["id"]},
  ] }
  product_images: { Row: {
    id: string
    product_id: string
    url: string
    alt: string
    sort: number
  }; Insert: {
    id?: string
    product_id: string
    url: string
    alt?: string
    sort?: number
  }; Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>; Relationships: [
    {foreignKeyName: "product_images_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"]},
  ] }
  product_options: { Row: {
    id: string
    product_id: string
    name: string
    values: string[]
    sort: number
  }; Insert: {
    id?: string
    product_id: string
    name: string
    values?: string[]
    sort?: number
  }; Update: Partial<Database["public"]["Tables"]["product_options"]["Insert"]>; Relationships: [
    {foreignKeyName: "product_options_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"]},
  ] }
  variants: { Row: {
    id: string
    product_id: string
    sku: string
    title: string
    option_values: string[]
    price: number | null
    stock: number
    active: boolean
    image_url: string | null
    sort: number
    created_at: string
  }; Insert: {
    id?: string
    product_id: string
    sku: string
    title?: string
    option_values?: string[]
    price?: number | null
    stock?: number
    active?: boolean
    image_url?: string | null
    sort?: number
    created_at?: string
  }; Update: Partial<Database["public"]["Tables"]["variants"]["Insert"]>; Relationships: [
    {foreignKeyName: "variants_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"]},
  ] }
  product_collections: { Row: {
    product_id: string
    collection_id: string
  }; Insert: {
    product_id: string
    collection_id: string
  }; Update: Partial<Database["public"]["Tables"]["product_collections"]["Insert"]>; Relationships: [
    {foreignKeyName: "product_collections_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"]},
    {foreignKeyName: "product_collections_collection_id_fkey", columns: ["collection_id"], isOneToOne: false, referencedRelation: "collections", referencedColumns: ["id"]},
  ] }
  orders: { Row: {
    id: string
    code: string
    access_token: string
    user_id: string | null
    kind: Database["public"]["Enums"]["order_kind"]
    channel: Database["public"]["Enums"]["order_channel"]
    status: Database["public"]["Enums"]["order_status"]
    payment_method: Database["public"]["Enums"]["payment_method"]
    fulfillment: Database["public"]["Enums"]["fulfillment_method"]
    customer_name: string
    phone: string
    email: string | null
    province: string | null
    address: string | null
    note: string | null
    subtotal: number
    shipping_fee: number
    discount: number
    total: number
    amount_due: number
    paid_amount: number
    deposit_pct: number | null
    payment_ref: string | null
    proof_path: string | null
    customer_confirmed_at: string | null
    expires_at: string | null
    paid_at: string | null
    cancelled_at: string | null
    cancel_reason: string | null
    shift_id: string | null
    created_by: string | null
    created_at: string
    updated_at: string
    search_text: string | null
  }; Insert: {
    id?: string
    code?: string
    access_token?: string
    user_id?: string | null
    kind?: Database["public"]["Enums"]["order_kind"]
    channel?: Database["public"]["Enums"]["order_channel"]
    status?: Database["public"]["Enums"]["order_status"]
    payment_method?: Database["public"]["Enums"]["payment_method"]
    fulfillment?: Database["public"]["Enums"]["fulfillment_method"]
    customer_name: string
    phone: string
    email?: string | null
    province?: string | null
    address?: string | null
    note?: string | null
    subtotal?: number
    shipping_fee?: number
    discount?: number
    total?: number
    amount_due?: number
    paid_amount?: number
    deposit_pct?: number | null
    payment_ref?: string | null
    proof_path?: string | null
    customer_confirmed_at?: string | null
    expires_at?: string | null
    paid_at?: string | null
    cancelled_at?: string | null
    cancel_reason?: string | null
    shift_id?: string | null
    created_by?: string | null
    created_at?: string
    updated_at?: string
    search_text?: never
  }; Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>; Relationships: [
    {foreignKeyName: "orders_created_by_fkey", columns: ["created_by"], isOneToOne: false, referencedRelation: "staff", referencedColumns: ["id"]},
  ] }
  order_items: { Row: {
    id: string
    order_id: string
    product_id: string | null
    variant_id: string | null
    name: string
    variant_title: string
    sku: string
    image_url: string | null
    unit_price: number
    qty: number
    line_total: number
    is_preorder: boolean
    stock_deducted: boolean
  }; Insert: {
    id?: string
    order_id: string
    product_id?: string | null
    variant_id?: string | null
    name: string
    variant_title?: string
    sku: string
    image_url?: string | null
    unit_price: number
    qty: number
    line_total: number
    is_preorder?: boolean
    stock_deducted?: boolean
  }; Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>; Relationships: [
    {foreignKeyName: "order_items_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"]},
    {foreignKeyName: "order_items_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"]},
    {foreignKeyName: "order_items_variant_id_fkey", columns: ["variant_id"], isOneToOne: false, referencedRelation: "variants", referencedColumns: ["id"]},
  ] }
  order_events: { Row: {
    id: number
    order_id: string
    status: Database["public"]["Enums"]["order_status"] | null
    message: string
    actor: string
    created_at: string
  }; Insert: {
    id?: never
    order_id: string
    status?: Database["public"]["Enums"]["order_status"] | null
    message: string
    actor?: string
    created_at?: string
  }; Update: Partial<Database["public"]["Tables"]["order_events"]["Insert"]>; Relationships: [
    {foreignKeyName: "order_events_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"]},
  ] }
  tradein_requests: { Row: {
    id: string
    code: string
    user_id: string | null
    customer_name: string
    phone: string
    email: string | null
    method: string
    payout: string
    items: Json
    photos: Json
    note: string | null
    status: Database["public"]["Enums"]["tradein_status"]
    quoted_total: number | null
    quote_expires_at: string | null
    staff_note: string | null
    handled_by: string | null
    created_at: string
    updated_at: string
  }; Insert: {
    id?: string
    code?: string
    user_id?: string | null
    customer_name: string
    phone: string
    email?: string | null
    method?: string
    payout?: string
    items?: Json
    photos?: Json
    note?: string | null
    status?: Database["public"]["Enums"]["tradein_status"]
    quoted_total?: number | null
    quote_expires_at?: string | null
    staff_note?: string | null
    handled_by?: string | null
    created_at?: string
    updated_at?: string
  }; Update: Partial<Database["public"]["Tables"]["tradein_requests"]["Insert"]>; Relationships: [
    {foreignKeyName: "tradein_requests_handled_by_fkey", columns: ["handled_by"], isOneToOne: false, referencedRelation: "staff", referencedColumns: ["id"]},
  ] }
  tradein_upload_sessions: { Row: {
    id: string; token_hash: string; fingerprint: string; user_id: string | null; payload: Json; manifest: Json; ready_slots: number[]; completed_code: string | null; created_at: string; expires_at: string
  }; Insert: {
    id?: string; token_hash: string; fingerprint: string; user_id?: string | null; payload: Json; manifest?: Json; ready_slots?: number[]; completed_code?: string | null; created_at?: string; expires_at?: string
  }; Update: Partial<Database["public"]["Tables"]["tradein_upload_sessions"]["Insert"]>; Relationships: [] }
  pos_shifts: { Row: {
    id: string
    staff_id: string
    opened_at: string
    closed_at: string | null
    opening_cash: number
    closing_cash: number | null
    note: string | null
  }; Insert: {
    id?: string
    staff_id: string
    opened_at?: string
    closed_at?: string | null
    opening_cash?: number
    closing_cash?: number | null
    note?: string | null
  }; Update: Partial<Database["public"]["Tables"]["pos_shifts"]["Insert"]>; Relationships: [
    {foreignKeyName: "pos_shifts_staff_id_fkey", columns: ["staff_id"], isOneToOne: false, referencedRelation: "staff", referencedColumns: ["id"]},
  ] }
}; Views: {
  customer_summary: { Row: { phone: string; customer_name: string; email: string | null; has_account: boolean; order_count: number; total_spent: number; last_order_at: string }; Relationships: [] }
  admin_product_inventory: { Row: Database["public"]["Tables"]["products"]["Row"] & { is_low_stock: boolean }; Relationships: Database["public"]["Tables"]["products"]["Relationships"] }
}; Functions: {
  f_unaccent: { Args: { arg0: string | null }; Returns: string }
  current_staff_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["staff_role"] }
  is_staff: { Args: Record<PropertyKey, never>; Returns: boolean }
  is_manager: { Args: Record<PropertyKey, never>; Returns: boolean }
  is_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
  claim_staff: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["staff_role"] }
  refresh_product_rollup: { Args: { p_product_id: string | null }; Returns: undefined }
  place_order: { Args: { p_items: Json | null; p_customer: Json | null; p_fulfillment?: Database["public"]["Enums"]["fulfillment_method"] | null; p_note?: string | null }; Returns: { order_code: string; order_token: string; order_total: number; order_amount_due: number }[] }
  get_order_public: { Args: { p_code: string | null; p_token: string | null }; Returns: Json }
  confirm_transfer: { Args: { p_code: string | null; p_token: string | null }; Returns: boolean }
  restock_order: { Args: { p_order_id: string | null }; Returns: undefined }
  admin_set_order_status: { Args: { p_order_id: string | null; p_status: Database["public"]["Enums"]["order_status"] | null; p_note?: string | null }; Returns: undefined }
  mark_order_paid: { Args: { p_code: string | null; p_amount: number | null; p_ref: string | null }; Returns: string }
  cancel_expired_orders: { Args: Record<PropertyKey, never>; Returns: number }
  pos_create_sale: { Args: { p_items: Json | null; p_payment: Database["public"]["Enums"]["payment_method"] | null; p_discount?: number | null; p_customer?: Json | null; p_shift_id?: string | null }; Returns: string }
  admin_save_product: { Args: { p: Json | null }; Returns: string }
  prepare_tradein_upload: { Args: { p_payload: Json; p_files: Json; p_user_id: string | null; p_fingerprint: string; p_token_hash: string }; Returns: string }
  mark_tradein_photo_ready: { Args: { p_session: string; p_token_hash: string; p_slot: number }; Returns: undefined }
  complete_tradein_upload: { Args: { p_session: string; p_token_hash: string }; Returns: string }
  submit_tradein: { Args: { p: Json | null }; Returns: string }
  admin_dashboard: { Args: Record<PropertyKey, never>; Returns: Json }
  admin_order_counts_v1: { Args: { p_kind?: string | null; p_channel?: string | null; p_search?: string | null }; Returns: Json }
  admin_catalog_counts_v1: { Args: { p_dimension: string | null }; Returns: Json }
}; Enums: {
  staff_role: "owner" | "manager" | "cashier" | "staff"
  product_status: "draft" | "active" | "hidden" | "archived"
  attr_kind: "text" | "number" | "select" | "boolean" | "date"
  order_kind: "order" | "preorder"
  order_channel: "online" | "pos"
  order_status: "pending_payment" | "paid" | "packing" | "shipping" | "ready_pickup" | "completed" | "cancelled"
  payment_method: "bank_transfer" | "cash" | "card"
  fulfillment_method: "delivery" | "pickup"
  tradein_status: "new" | "quoted" | "accepted" | "received" | "paid" | "rejected" | "expired"
}; CompositeTypes: Record<string, never> } }
