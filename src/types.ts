export interface SizeStockItem {
  size: string;
  stock: number;
  sku?: string;
  barcode?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  totalRetailValue: number;
  totalCostValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
  categoryDistribution?: { name: string; units: number; productsCount: number }[];
  totalMovementsCount?: number;
  recentMovements?: any[];
}

export interface InventoryMovementItem {
  id: string;
  _id?: string;
  product?: {
    id?: string;
    _id?: string;
    name?: string;
    sku?: string;
    thumbnail?: { url: string };
    image?: string;
    images?: Array<{ url: string } | string>;
    category?: any;
    price?: number;
    costPrice?: number;
  };
  productName?: string;
  sku?: string;
  size?: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'restock' | string;
  quantity: number;
  previousStock: number;
  newStock: number;
  previousSizeStock?: number;
  newSizeStock?: number;
  reason?: string;
  warehouseLocation?: string;
  costPrice?: number;
  unitPrice?: number;
  performedBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
  createdAt?: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  costPrice?: number;
  discountPrice?: number;
  description: string;
  shortDescription?: string;
  image: string;
  secondaryImages?: string[];
  badge?: string;
  sizes?: string[];
  sizeStock?: SizeStockItem[];
  colors?: { name: string; hex: string; image?: string }[];
  caseFinishes?: { id: string; name: string; hex: string; ringColor?: string }[];
  strapSizes?: string[];
  specs?: { label: string; value: string }[];
  materials?: string;
  shippingInfo?: string;
  featured?: boolean;
  stock?: number;
  stockQuantity?: number;
  stockStatus?: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
  sku?: string;
  status?: string;
  rating?: number;
  ratingsAverage?: number;
  reviewCount?: number;
  numReviews?: number;
  salesCount?: number;
  soldCount?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedFinish?: string;
}

export interface FilterState {
  categories: string[];
  brands: string[];
  color: string;
  size: string;
  priceMin: number;
  priceMax: number;
  inStockOnly?: boolean;
  searchQuery: string;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'most_reviewed';
}

export type ViewMode = 'home' | 'shop' | 'product' | 'checkout';

export type Language = 'en' | 'ar';

export interface ToastNotification {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error' | 'warning';
}

export interface ModalAlertOptions {
  isOpen?: boolean;
  title?: string;
  message: string;
  type?: 'danger' | 'warning' | 'success' | 'info' | 'question';
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const LOGO_URL = "/logo.png";

export interface AdminOrderItem {
  productName?: string;
  name?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  image?: string;
  productImage?: string;
  variantFinish?: string;
  variantSize?: string;
}

export interface AdminOrderTimeline {
  status: string;
  time?: string;
  timestamp?: string;
  note?: string;
}

export type BackendOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'packed'
  | 'shipped'
  | 'outForDelivery'
  | 'delivered'
  | 'cancelled'
  | 'refundRequested'
  | 'refunded'
  | 'returned'
  | 'Pending'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface AdminOrder {
  id: string;
  _id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCity?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  items: AdminOrderItem[];
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  taxAmount?: number;
  taxes?: number;
  status: BackendOrderStatus;
  paymentMethod: string;
  paymentStatus?: string;
  refundStatus?: string;
  shippingMethod?: string;
  shippingAddress: string;
  shipping?: {
    method?: string;
    cost?: number;
    address: string;
    city: string;
    country: string;
    zipCode?: string;
  };
  courierCompany?: string;
  trackingNumber?: string;
  notes?: string;
  customerNotes?: string;
  adminNotes?: string;
  coupon?: {
    code?: string;
    discount?: number;
    value?: number;
    type?: string;
  };
  date: string;
  createdAt?: string;
  timeline: AdminOrderTimeline[];
}

export interface AdminCustomer {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Active' | 'VIP' | 'Inactive' | 'Banned' | string;
  totalOrders: number;
  totalSpent: number;
  rewardPoints: number;
  loyaltyPoints?: number;
  city?: string;
  country?: string;
  avatar?: {
    url?: string;
  } | string;
  addresses?: Array<{
    street?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    isDefault?: boolean;
  }>;
}

export interface AdminNotificationItem {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'review' | 'system' | string;
  read: boolean;
  createdAt?: string;
  time?: string;
}
