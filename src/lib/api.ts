// ============================================
// SAOUDI WEAR - Frontend API Service Client
// ============================================
// Connects Next.js Frontend to Node.js REST API
// Base URL: http://localhost:5000/api
// ============================================

import {
  Product,
  CartItem,
  AdminOrder,
  AdminCustomer,
  AdminNotificationItem,
  SizeStockItem,
  InventoryStats,
  InventoryMovementItem,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper for session ID for guest carts
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server-session';
  let sessionId = localStorage.getItem('saoudi_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('saoudi_session_id', sessionId);
  }
  return sessionId;
};

// Helper for auth headers
const getAuthHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId(),
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('saoudi_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const savedUser = localStorage.getItem('saoudi_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.email) headers['X-User-Email'] = u.email;
        if (u.phone) headers['X-User-Phone'] = u.phone;
      } catch (e) {}
    }
  }
  return headers;
};

// Helper to normalize Backend Product -> Frontend Product interface
export const normalizeProduct = (backendProduct: any): Product => {
  if (!backendProduct) return {} as Product;

  const categoryName = typeof backendProduct.category === 'object'
    ? backendProduct.category?.name
    : backendProduct.category || 'Timepieces';

  const brandName = typeof backendProduct.brand === 'object'
    ? backendProduct.brand?.name
    : backendProduct.brand || 'SAOUDI WEAR';

  // Primary image
  const primaryImage = backendProduct.thumbnail?.url ||
    (backendProduct.images && backendProduct.images[0]?.url) ||
    backendProduct.image ||
    '';

  // Secondary images
  const secondaryImages = backendProduct.images && backendProduct.images.length > 1
    ? backendProduct.images.slice(1).map((img: any) => typeof img === 'string' ? img : img.url)
    : backendProduct.secondaryImages || [];

  let currentPrice = Number(backendProduct.effectivePrice || backendProduct.price || backendProduct.discountPrice) || 0;
  let originalPrice = Number(backendProduct.discountPrice || backendProduct.compareAtPrice || backendProduct.originalPrice) || 0;

  // Handle standard strikethrough logic (if discountPrice was stored as the lower discounted price)
  if (originalPrice > 0 && originalPrice < currentPrice) {
    const temp = currentPrice;
    currentPrice = originalPrice;
    originalPrice = temp;
  } else if (originalPrice === currentPrice) {
    originalPrice = 0;
  }

  const rawSizes = backendProduct.sizes && backendProduct.sizes.length > 0 ? backendProduct.sizes : ['S', 'M', 'L', 'XL'];
  let rawStock = backendProduct.stock !== undefined ? Number(backendProduct.stock) : (backendProduct.stockQuantity !== undefined ? Number(backendProduct.stockQuantity) : 20);

  // SizeStock matrix calculation
  let sizeStock: SizeStockItem[] = [];
  if (backendProduct.sizeStock && Array.isArray(backendProduct.sizeStock) && backendProduct.sizeStock.length > 0) {
    sizeStock = backendProduct.sizeStock.map((s: any) => ({
      size: String(s.size),
      stock: Number(s.stock) || 0,
      sku: s.sku || `${backendProduct.sku || 'SW'}-${s.size}`,
      barcode: s.barcode || '',
    }));
    rawStock = sizeStock.reduce((acc, curr) => acc + curr.stock, 0);
  } else {
    const perSize = Math.floor(rawStock / rawSizes.length);
    const remainder = rawStock % rawSizes.length;
    sizeStock = rawSizes.map((sz: string, idx: number) => ({
      size: sz,
      stock: perSize + (idx === 0 ? remainder : 0),
      sku: `${backendProduct.sku || 'SW'}-${sz}`,
      barcode: '',
    }));
  }

  const computedStockStatus = rawStock === 0 ? 'Out of Stock' : rawStock <= 5 ? 'Low Stock' : 'In Stock';

  return {
    id: backendProduct._id || backendProduct.id || backendProduct.slug,
    _id: backendProduct._id || backendProduct.id,
    name: backendProduct.name || '',
    category: categoryName,
    brand: brandName,
    price: currentPrice,
    costPrice: backendProduct.costPrice || 0,
    discountPrice: originalPrice > currentPrice ? originalPrice : 0,
    description: backendProduct.description || '',
    shortDescription: backendProduct.shortDescription || '',
    image: primaryImage,
    secondaryImages,
    badge: backendProduct.badge || (backendProduct.featured ? null : backendProduct.newArrival ? 'New Arrival' : undefined),
    sizes: rawSizes,
    sizeStock,
    colors: backendProduct.colors && Array.isArray(backendProduct.colors) && backendProduct.colors.length > 0
      ? backendProduct.colors
          .map((c: any) => ({
            name: c.name || c.color || '',
            hex: c.hex || c.colorHex || '#141414',
            image: typeof c.image === 'object' ? c.image?.url : c.image || '',
          }))
          .filter((c: any) => Boolean(c.name && c.name.trim() !== ''))
      : [],
    caseFinishes: backendProduct.caseFinishes && Array.isArray(backendProduct.caseFinishes)
      ? backendProduct.caseFinishes
      : [],
    strapSizes: backendProduct.strapSizes || [],
    specs: backendProduct.specifications || backendProduct.specs || [],
    materials: backendProduct.materials,
    shippingInfo: backendProduct.shippingInfo,
    featured: backendProduct.featured ?? false,
    stock: rawStock,
    stockQuantity: rawStock,
    stockStatus: computedStockStatus,
    sku: backendProduct.sku || `SW-${(backendProduct._id || backendProduct.id || '000').slice(0, 8).toUpperCase()}`,
    status: backendProduct.status || 'active',
  };
};

// Helper to normalize Backend Order -> Frontend AdminOrder interface
export const normalizeOrder = (backendOrder: any): AdminOrder => {
  if (!backendOrder) return {} as AdminOrder;

  const orderId = backendOrder._id || backendOrder.id;

  // Map backend items
  const items = (backendOrder.items || []).map((item: any) => ({
    productName: item.productName || item.product?.name || item.name || 'منتج فاخر (Bespoke Item)',
    name: item.productName || item.product?.name || item.name || 'منتج فاخر (Bespoke Item)',
    quantity: Number(item.quantity) || 1,
    price: Number(item.price) || 0,
    unitPrice: Number(item.price) || 0,
    image: item.productImage || item.product?.thumbnail?.url || item.product?.images?.[0]?.url || item.image || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
    variantFinish: item.variant?.color || item.variantFinish || '',
    variantSize: item.variant?.size || item.variantSize || '',
    sku: item.variant?.sku || item.sku || '',
  }));

  // Map backend timeline
  const timeline = (backendOrder.timeline || []).map((t: any) => ({
    status: t.status || 'Status update',
    time: t.timestamp ? new Date(t.timestamp).toLocaleString('ar-SA') : (t.time || ''),
    timestamp: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
    note: t.note || '',
  }));

  const customerName = backendOrder.customerName || backendOrder.customer?.name || 'عميل المتجر';
  const customerEmail = backendOrder.customerEmail || backendOrder.customer?.email || 'client@saoudiwear.com';
  const customerPhone = backendOrder.customerPhone || backendOrder.customer?.phone || '';

  const shippingObj = backendOrder.shipping || {};
  const shippingAddress = shippingObj.address || backendOrder.shippingAddress || 'الرياض - المملكة العربية السعودية';
  const city = shippingObj.city || backendOrder.city || backendOrder.customerCity || 'الرياض';
  const country = shippingObj.country || backendOrder.country || 'المملكة العربية السعودية';

  return {
    id: orderId,
    _id: orderId,
    orderNumber: backendOrder.orderNumber || `SW-${orderId?.slice(0, 8).toUpperCase()}`,
    customerName,
    customerEmail,
    customerPhone,
    customerCity: city,
    city,
    country,
    zipCode: shippingObj.zipCode || backendOrder.zipCode || '11564',
    items,
    totalAmount: Number(backendOrder.total) || Number(backendOrder.subtotal) || 0,
    total: Number(backendOrder.total) || Number(backendOrder.subtotal) || 0,
    subtotal: Number(backendOrder.subtotal) || 0,
    taxAmount: Number(backendOrder.taxes) || 0,
    taxes: Number(backendOrder.taxes) || 0,
    status: backendOrder.status || 'pending',
    paymentMethod: backendOrder.paymentMethod || 'cod',
    paymentStatus: backendOrder.paymentStatus || 'pending',
    refundStatus: backendOrder.refundStatus || 'none',
    shippingMethod: shippingObj.method || backendOrder.shippingMethod || 'Express Air Courier (شحن جوي سريع)',
    shippingAddress,
    shipping: {
      method: shippingObj.method || 'Express Air Courier (شحن جوي سريع)',
      cost: Number(shippingObj.cost) || 0,
      address: shippingAddress,
      city,
      country,
      zipCode: shippingObj.zipCode || '11564',
    },
    coupon: backendOrder.coupon || undefined,
    courierCompany: backendOrder.shippingCompany || backendOrder.courierCompany || 'أسطول SAOUDI WEAR Express',
    trackingNumber: backendOrder.trackingNumber || `SW-TRK-${backendOrder.orderNumber?.replace(/\D/g, '') || Math.floor(100000 + Math.random() * 900000)}`,
    notes: backendOrder.customerNotes || backendOrder.adminNotes || backendOrder.notes || '',
    customerNotes: backendOrder.customerNotes || '',
    adminNotes: backendOrder.adminNotes || '',
    date: backendOrder.createdAt
      ? `${new Date(backendOrder.createdAt).getFullYear()}/${String(new Date(backendOrder.createdAt).getMonth() + 1).padStart(2, '0')}/${String(new Date(backendOrder.createdAt).getDate()).padStart(2, '0')} ${new Date(backendOrder.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
      : '---',
    createdAt: backendOrder.createdAt || new Date().toISOString(),
    timeline: timeline.length > 0 ? timeline : [
      {
        status: 'pending',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        note: 'تم تسجيل الطلب وتوثيقه في النظام وهو قيد المراجعة والتجهيز.',
      }
    ],
  };
};

// ============================================
// API Methods
// ============================================

export const api = {
  // Products
  async getProducts(params?: {
    category?: string | string[];
    brand?: string | string[];
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) {
        const catVal = Array.isArray(params.category) ? params.category.filter(c => c !== 'All' && c !== 'ALL').join(',') : params.category;
        if (catVal && catVal !== 'All' && catVal !== 'ALL') queryParams.append('category', catVal);
      }
      if (params?.brand) {
        const brandVal = Array.isArray(params.brand) ? params.brand.filter(b => b !== 'All' && b !== 'ALL').join(',') : params.brand;
        if (brandVal && brandVal !== 'All' && brandVal !== 'ALL') queryParams.append('brand', brandVal);
      }
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());

      const url = `${API_BASE_URL}/products?${queryParams.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      
      const rawDocs = data.data || [];
      const normalized = rawDocs.map(normalizeProduct);
      return {
        products: normalized,
        pagination: data.pagination,
      };
    } catch (error) {
      console.warn('API getProducts error, falling back:', error);
      return null;
    }
  },

  async getProductById(idOrSlug: string): Promise<Product | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${idOrSlug}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeProduct(data.data);
    } catch (error) {
      console.warn('API getProductById error:', error);
      return null;
    }
  },

  async createProduct(productData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const fieldErrs = err.errors && Array.isArray(err.errors) ? err.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ') : '';
        throw new Error(fieldErrs || err.message || 'Failed to create product');
      }
      const data = await res.json();
      return normalizeProduct(data.data);
    } catch (error) {
      console.error('API createProduct error:', error);
      throw error;
    }
  },

  async updateProduct(id: string, productData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const fieldErrs = err.errors && Array.isArray(err.errors) ? err.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ') : '';
        throw new Error(fieldErrs || err.message || 'Failed to update product');
      }
      const data = await res.json();
      return normalizeProduct(data.data);
    } catch (error) {
      console.error('API updateProduct error:', error);
      throw error;
    }
  },

  async deleteProduct(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete product');
      }
      return true;
    } catch (error) {
      console.error('API deleteProduct error:', error);
      throw error;
    }
  },

  async uploadProductImages(productId: string, files: File[]) {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('saoudi_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error('Image upload failed');
      const data = await res.json();
      return normalizeProduct(data.data);
    } catch (error) {
      console.error('API uploadProductImages error:', error);
      throw error;
    }
  },

  async uploadSingleImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const headers: Record<string, string> = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('saoudi_token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/products/upload-image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.url) {
          return data.data.url;
        }
      }
    } catch (err) {
      console.warn('Backend single image upload warning, fallback to base64 persistent data:', err);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  },

  // Cart
  async getCart(): Promise<CartItem[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.data || !data.data.items) return [];
      
      return data.data.items.map((item: any) => ({
        id: item._id,
        product: normalizeProduct(item.product),
        quantity: item.quantity,
        selectedFinish: item.variant?.color,
        selectedSize: item.variant?.size,
      }));
    } catch (error) {
      console.warn('API getCart error:', error);
      return null;
    }
  },

  async addToCart(productId: string, quantity = 1, variant?: { color?: string; size?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ product: productId, quantity, variant }),
      });
      return res.ok;
    } catch (error) {
      console.warn('API addToCart error:', error);
      return false;
    }
  },

  async updateCartItemQuantity(itemId: string, quantity: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });
      return res.ok;
    } catch (error) {
      console.warn('API updateCartItemQuantity error:', error);
      return false;
    }
  },

  async removeCartItem(itemId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch (error) {
      console.warn('API removeCartItem error:', error);
      return false;
    }
  },

  async clearCart() {
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch (error) {
      console.warn('API clearCart error:', error);
      return false;
    }
  },

  // Orders
  async createOrder(orderData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Order creation failed');
      }
      return await res.json();
    } catch (error) {
      console.error('API createOrder error:', error);
      throw error;
    }
  },

  async getMyOrders(): Promise<AdminOrder[]> {
    try {
      let queryStr = '';
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('saoudi_user');
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            const params = new URLSearchParams();
            if (u.email) params.append('email', u.email);
            if (u.phone) params.append('phone', u.phone);
            if (u._id || u.id) params.append('customerId', u._id || u.id);
            const qs = params.toString();
            if (qs) queryStr = `?${qs}`;
          } catch (e) {}
        }
      }
      const res = await fetch(`${API_BASE_URL}/orders/my-orders${queryStr}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = await res.json();
      const raw = data.data || [];
      return raw.map(normalizeOrder);
    } catch (error) {
      console.warn('API getMyOrders error:', error);
      return [];
    }
  },

  async trackOrder(orderNumber: string): Promise<AdminOrder | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/track/${encodeURIComponent(orderNumber)}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeOrder(data.data);
    } catch (error) {
      console.warn('API trackOrder error:', error);
      return null;
    }
  },

  async updateCustomerProfile(customerId: string, data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return await res.json();
    } catch (error) {
      console.error('API updateCustomerProfile error:', error);
      throw error;
    }
  },

  async addCustomerAddress(customerId: string, address: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(address),
      });
      if (!res.ok) throw new Error('Failed to add address');
      return await res.json();
    } catch (error) {
      console.error('API addCustomerAddress error:', error);
      throw error;
    }
  },

  async getAdminOrders(): Promise<AdminOrder[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const rawDocs = data.data?.docs || data.data || [];
      return rawDocs.map(normalizeOrder);
    } catch (error) {
      console.warn('API getAdminOrders error:', error);
      return null;
    }
  },

  async getAdminOrderById(orderId: string): Promise<AdminOrder | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeOrder(data.data);
    } catch (error) {
      console.warn('API getAdminOrderById error:', error);
      return null;
    }
  },

  async updateOrderStatus(orderId: string, status: string, note?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, note }),
      });
      return res.ok;
    } catch (error) {
      console.warn('API updateOrderStatus error:', error);
      return false;
    }
  },

  async updateOrderNotes(orderId: string, adminNotes: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/notes`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes }),
      });
      return res.ok;
    } catch (error) {
      console.warn('API updateOrderNotes error:', error);
      return false;
    }
  },

  async processRefund(orderId: string, amount: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/refund`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      return res.ok;
    } catch (error) {
      console.warn('API processRefund error:', error);
      return false;
    }
  },

  // Admin KPIs & Dashboard Intelligence
  async getAdminStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.warn('API getAdminStats error:', error);
      return null;
    }
  },

  async getDashboardRevenue() {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/revenue`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.warn('API getDashboardRevenue error:', error);
      return null;
    }
  },

  async getDashboardTopProducts(limit = 10) {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/top-products?limit=${limit}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = await res.json();
      const raw = data.data || [];
      return raw.map(normalizeProduct);
    } catch (error) {
      console.warn('API getDashboardTopProducts error:', error);
      return [];
    }
  },

  async getDashboardRecentOrders(limit = 10) {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/recent-orders?limit=${limit}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = await res.json();
      const raw = data.data || [];
      return raw.map(normalizeOrder);
    } catch (error) {
      console.warn('API getDashboardRecentOrders error:', error);
      return [];
    }
  },

  // Customers Management
  async getAdminCustomers(): Promise<AdminCustomer[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const docs = data.data?.docs || data.data || [];
      return docs.map((cust: any) => ({
        id: cust._id || cust.id,
        _id: cust._id || cust.id,
        name: cust.name || 'Patron Client',
        email: cust.email || '',
        phone: cust.phone || '',
        status: cust.status || 'Active',
        totalOrders: cust.totalOrders || 0,
        totalSpent: cust.totalSpent || 0,
        rewardPoints: cust.rewardPoints ?? cust.loyaltyPoints ?? 0,
        loyaltyPoints: cust.rewardPoints ?? cust.loyaltyPoints ?? 0,
        city: cust.addresses?.[0]?.city || cust.city || 'Riyadh',
        country: cust.addresses?.[0]?.country || cust.country || 'Saudi Arabia',
        avatar: cust.avatar?.url || cust.avatar || '',
        addresses: cust.addresses || [],
      }));
    } catch (error) {
      console.warn('API getAdminCustomers error:', error);
      return null;
    }
  },

  // ============================================
  // Inventory & Warehouse Management APIs
  // ============================================

  // 1. Get High-Level Overview KPI Stats
  async getInventoryStats(): Promise<InventoryStats | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/overview`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch (error) {
      console.warn('API getInventoryStats error:', error);
      return null;
    }
  },

  // 2. Get Products List with SizeStock Breakdown Matrix
  async getInventoryProducts(params: { search?: string; category?: string; stockStatus?: string } = {}): Promise<Product[]> {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category && params.category !== 'All') query.append('category', params.category);
      if (params.stockStatus && params.stockStatus !== 'all') query.append('stockStatus', params.stockStatus);

      const qs = query.toString();
      const url = `${API_BASE_URL}/inventory/products${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!res.ok) {
        // Fallback to standard product list
        const fallbackRes = await this.getProducts({ limit: 100 });
        return fallbackRes?.products || [];
      }

      const data = await res.json();
      const rawProducts = data.data || [];
      return rawProducts.map(normalizeProduct);
    } catch (error) {
      console.warn('API getInventoryProducts error:', error);
      const fallbackRes = await this.getProducts({ limit: 100 });
      return fallbackRes?.products || [];
    }
  },

  // 3. Update Product SizeStock Matrix
  async updateProductSizeStock(
    productId: string,
    sizeStock: SizeStockItem[],
    reason: string = 'تحديث شامل لجرد مقاسات المنتج',
    warehouseLocation: string = 'مستودع الرياض الرئيسي (Riyadh Central Hub)'
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/products/${productId}/stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sizeStock, reason, warehouseLocation }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update size stock');
      }
      return { success: true, product: normalizeProduct(data.data?.product || data.data) };
    } catch (error: any) {
      console.error('API updateProductSizeStock error:', error);
      return { success: false, error: error.message || 'Error updating stock' };
    }
  },

  // 4. Adjust Individual Stock or Size Stock
  async adjustInventoryStock(payload: {
    productId: string;
    size?: string;
    quantity?: number;
    type?: 'in' | 'out' | 'adjustment' | 'restock' | string;
    reason?: string;
    newExactStock?: number;
    location?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/adjust`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to adjust stock');
      }
      return { success: true, data: data.data };
    } catch (error: any) {
      console.error('API adjustInventoryStock error:', error);
      return { success: false, error: error.message || 'Error adjusting stock' };
    }
  },

  // 5. Batch Adjust Stock
  async batchAdjustInventory(adjustments: any[]): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/batch-adjust`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adjustments }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to batch adjust stock');
      }
      return { success: true, results: data.data };
    } catch (error: any) {
      console.error('API batchAdjustInventory error:', error);
      return { success: false, error: error.message };
    }
  },

  // 6. Get Inventory Movements Audit Log
  async getInventoryMovements(params: {
    page?: number;
    limit?: number;
    type?: string;
    productId?: string;
    search?: string;
  } = {}): Promise<{ docs: InventoryMovementItem[]; total: number; page: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.type && params.type !== 'all') query.append('type', params.type);
      if (params.productId) query.append('productId', params.productId);
      if (params.search) query.append('search', params.search);

      const qs = query.toString();
      const res = await fetch(`${API_BASE_URL}/inventory/movements${qs ? `?${qs}` : ''}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!res.ok) {
        return { docs: [], total: 0, page: 1, totalPages: 1 };
      }

      const data = await res.json();
      const rawDocs = data.data?.docs || data.data || [];
      const formattedDocs: InventoryMovementItem[] = rawDocs.map((item: any) => ({
        id: item._id || item.id,
        _id: item._id || item.id,
        product: item.product,
        productName: item.product?.name || item.productName || 'Luxury Item',
        sku: item.product?.sku || item.sku || `SW-${(item._id || '').slice(0, 6).toUpperCase()}`,
        size: item.size || item.variant?.size || 'All Sizes',
        type: item.type || 'adjustment',
        quantity: item.quantity || 0,
        previousStock: item.previousStock ?? 0,
        newStock: item.newStock ?? 0,
        previousSizeStock: item.previousSizeStock,
        newSizeStock: item.newSizeStock,
        reason: item.reason || 'تسوية روتينية',
        warehouseLocation: item.warehouseLocation || 'مستودع الرياض الرئيسي (Riyadh Central Hub)',
        costPrice: item.costPrice || 0,
        unitPrice: item.unitPrice || 0,
        performedBy: item.performedBy || { name: 'مسؤول النظام (Admin)' },
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      return {
        docs: formattedDocs,
        total: data.data?.total || formattedDocs.length,
        page: data.data?.page || 1,
        totalPages: data.data?.totalPages || 1,
      };
    } catch (error) {
      console.warn('API getInventoryMovements error:', error);
      return { docs: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  // 7. Get Low Stock Alerts
  async getInventoryAlerts(threshold: number = 5): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/alerts?threshold=${threshold}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map(normalizeProduct);
    } catch (error) {
      console.warn('API getInventoryAlerts error:', error);
      return [];
    }
  },

  // Legacy getAdminInventory backward compatibility
  async getAdminInventory() {
    const res = await this.getInventoryMovements({ limit: 50 });
    return res.docs;
  },

  // Notifications
  async getNotifications(): Promise<AdminNotificationItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      const docs = data.data?.docs || data.data || [];
      return docs.map((n: any) => ({
        id: n._id || n.id,
        _id: n._id || n.id,
        title: n.title || 'Notification',
        message: n.message || '',
        type: n.type || 'system',
        read: n.read || false,
        time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      }));
    } catch (error) {
      console.warn('API getNotifications error:', error);
      return [];
    }
  },

  async markNotificationRead(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch (error) {
      console.warn('API markNotificationRead error:', error);
      return false;
    }
  },

  // Search
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/search/products?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = await res.json();
      const rawDocs = data.data?.docs || data.data || [];
      return rawDocs.map(normalizeProduct);
    } catch (error) {
      console.warn('API searchProducts error:', error);
      return [];
    }
  },

  // Categories & Brands
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.docs || data.data || [];
    } catch (error) {
      console.warn('API getCategories error:', error);
      return [];
    }
  },

  async createCategory(categoryData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create category');
      }
      const data = await res.json();
      return data.data;
    } catch (error: any) {
      console.error('API createCategory error:', error);
      if (error?.message === 'Failed to fetch') {
        throw new Error('فشل الاتصال بالسيرفر. يرجى التأكد من تشغيل الباك إند على Port 5000.');
      }
      throw error;
    }
  },

  async updateCategory(id: string, categoryData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || err.message?.toLowerCase().includes('token')) {
          localStorage.removeItem('saoudi_token');
          throw new Error('انتهت جلسة التوكن الإداري. يرجى تحديث الصفحة وإعادة تسجيل الدخول للوحة التحكم.');
        }
        throw new Error(err.message || 'Failed to update category');
      }
      const data = await res.json();
      return data.data;
    } catch (error: any) {
      console.error('API updateCategory error:', error);
      if (error?.message === 'Failed to fetch') {
        throw new Error('فشل الاتصال بالسيرفر. يرجى التأكد من تشغيل الباك إند على Port 5000.');
      }
      throw error;
    }
  },

  async deleteCategory(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete category');
      }
      return true;
    } catch (error: any) {
      console.error('API deleteCategory error:', error);
      if (error?.message === 'Failed to fetch') {
        throw new Error('فشل الاتصال بالسيرفر. يرجى التأكد من تشغيل الباك إند على Port 5000.');
      }
      throw error;
    }
  },

  async getBrands() {
    try {
      const res = await fetch(`${API_BASE_URL}/brands`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.docs || data.data || [];
    } catch (error) {
      console.warn('API getBrands error:', error);
      return [];
    }
  },



  // Settings
  async getStoreSettings() {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.warn('API getStoreSettings error:', error);
      return null;
    }
  },

  async updateStoreSettings(settings: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      return res.ok;
    } catch (error) {
      console.warn('API updateStoreSettings error:', error);
      return false;
    }
  },

  // Auth Methods
  async login(email: string, password: string) {
    // Try customer login first, fallback to user/admin login
    let res = await fetch(`${API_BASE_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    let data = await res.json();

    if (!res.ok) {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      data = await res.json();
    }

    if (!res.ok) throw new Error(data.message || 'Login failed. Please verify email and password.');
    if (data.data?.accessToken) {
      localStorage.setItem('saoudi_token', data.data.accessToken);
    }
    return data.data;
  },

  async adminLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Admin authentication failed');
    if (data.data?.accessToken) {
      localStorage.setItem('saoudi_token', data.data.accessToken);
    }
    return data.data;
  },

  async register(name: string, email: string, password: string, additionalData?: { phone?: string; city?: string; address?: string }) {
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: additionalData?.phone?.trim() || '',
      city: additionalData?.city?.trim() || 'الرياض',
      address: additionalData?.address?.trim() || '',
      addresses: additionalData?.address ? [{ street: additionalData.address.trim(), city: additionalData?.city || 'الرياض', country: 'Saudi Arabia', isDefault: true }] : [],
    };

    const res = await fetch(`${API_BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.errors?.[0]?.message || data.message || 'فشل التسجيل. يرجى التأكد من كتابة بريد صحيح وكلمة مرور من 6 أحرف على الأقل.';
      throw new Error(msg);
    }
    if (data.data?.accessToken) {
      localStorage.setItem('saoudi_token', data.data.accessToken);
    }
    return data.data;
  },

  async getMyProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/profile`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.warn('API getMyProfile error:', error);
      return null;
    }
  },



  async getCurrentUser() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.warn('API getCurrentUser error:', error);
      return null;
    }
  },

  async updateAdminProfile(data: { name?: string; email?: string; phone?: string; avatar?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل تحديث بيانات الحساب');
      return resData.data;
    } catch (error) {
      console.error('API updateAdminProfile error:', error);
      throw error;
    }
  },

  async changeAdminPassword(currentPassword: string, newPassword: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل تغيير كلمة المرور');
      return resData.data;
    } catch (error) {
      console.error('API changeAdminPassword error:', error);
      throw error;
    }
  },

  // Homepage CMS
  async getHomepage() {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage`, { headers: getAuthHeaders(), cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.warn('API getHomepage error:', error);
      return null;
    }
  },

  async updateHeroSlider(slides: any[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/hero-slider`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ slides }),
      });
      if (!res.ok) throw new Error('Failed to update hero slider');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateHeroSlider error:', error);
      throw error;
    }
  },

  async updateOffers(offers: any[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/offers`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ offers }),
      });
      if (!res.ok) throw new Error('Failed to update offers');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateOffers error:', error);
      throw error;
    }
  },

  async updateBanners(mainBanner?: any, promotionalBanner?: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/banners`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mainBanner, promotionalBanner }),
      });
      if (!res.ok) throw new Error('Failed to update banners');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateBanners error:', error);
      throw error;
    }
  },

  async updateHomepageSection(sectionName: string, productIds: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/sections/${sectionName}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productIds }),
      });
      if (!res.ok) throw new Error('Failed to update homepage section');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateHomepageSection error:', error);
      throw error;
    }
  },

  async updateFlashSale(flashSaleData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/flash-sale`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(flashSaleData),
      });
      if (!res.ok) throw new Error('Failed to update flash sale');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateFlashSale error:', error);
      throw error;
    }
  },

  async updateSectionVisibility(visibility: Record<string, boolean>) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/visibility`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ visibility }),
      });
      if (!res.ok) throw new Error('Failed to update section visibility');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateSectionVisibility error:', error);
      throw error;
    }
  },

  async updateSectionOrder(sectionOrder: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/section-order`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sectionOrder }),
      });
      if (!res.ok) throw new Error('Failed to update section order');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateSectionOrder error:', error);
      throw error;
    }
  },

  async updateLimitedOffers(limitedOffers: any[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/limited-offers`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ limitedOffers }),
      });
      if (!res.ok) throw new Error('Failed to update limited offers');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateLimitedOffers error:', error);
      throw error;
    }
  },

  async updateBentoCollections(collections: any[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/bento-collections`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ collections }),
      });
      if (!res.ok) throw new Error('Failed to update bento collections');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateBentoCollections error:', error);
      throw error;
    }
  },

  async updateHeritage(heritage: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/homepage/heritage`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ heritage }),
      });
      if (!res.ok) throw new Error('Failed to update heritage section');
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API updateHeritage error:', error);
      throw error;
    }
  },

  async uploadHomepageImage(file: File) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('saoudi_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('لم يتم العثور على توكن الإدارة. يرجى تسجيل الدخول كـ Admin.');
      }

      const res = await fetch(`${API_BASE_URL}/homepage/upload-image`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || errData.message?.toLowerCase().includes('token')) {
          throw new Error('انتهت جلسة التوكن الإداري. يرجى تسجيل الدخول مجدداً.');
        }
        throw new Error(errData.message || `فشل رفع الصورة (${res.status})`);
      }
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('API uploadHomepageImage error:', error);
      throw error;
    }
  },

  // ============================================
  // Coupons API
  // ============================================
  async getAdminCoupons(query?: any) {
    try {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      const res = await fetch(`${API_BASE_URL}/coupons${qs}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.items || data.data || [];
    } catch (error) {
      console.error('API getAdminCoupons error:', error);
      return [];
    }
  },

  async getCouponStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch (error) {
      console.error('API getCouponStats error:', error);
      return null;
    }
  },

  async validateCoupon(code: string, subtotal?: number, email?: string) {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('saoudi_customer_token') || localStorage.getItem('saoudi_token')
          : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'كوبون الخصم غير صالح أو منتهي');
      return data.data;
    } catch (error) {
      console.error('API validateCoupon error:', error);
      throw error;
    }
  },

  async createCoupon(couponData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إنشاء الكوبون');
      return data.data;
    } catch (error) {
      console.error('API createCoupon error:', error);
      throw error;
    }
  },

  async updateCoupon(id: string, couponData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تحديث الكوبون');
      return data.data;
    } catch (error) {
      console.error('API updateCoupon error:', error);
      throw error;
    }
  },

  async resetCouponUsage(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/${id}/reset-usage`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تصفير عداد استخدام الكوبون');
      return data.data;
    } catch (error) {
      console.error('API resetCouponUsage error:', error);
      throw error;
    }
  },

  async duplicateCoupon(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/${id}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تكرار الكوبون');
      return data.data;
    } catch (error) {
      console.error('API duplicateCoupon error:', error);
      throw error;
    }
  },

  async bulkDeleteCoupons(ids: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/bulk-delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حذف الكوبونات المحددة');
      return data.data;
    } catch (error) {
      console.error('API bulkDeleteCoupons error:', error);
      throw error;
    }
  },

  async bulkStatusCoupons(ids: string[], status: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/bulk-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تحديث حالة الكوبونات');
      return data.data;
    } catch (error) {
      console.error('API bulkStatusCoupons error:', error);
      throw error;
    }
  },

  async deleteCoupon(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حذف الكوبون');
      return data.data;
    } catch (error) {
      console.error('API deleteCoupon error:', error);
      throw error;
    }
  },

  // ============================================
  // Reviews API
  // ============================================
  async getAdminReviews(query?: any) {
    try {
      const qs = query ? '?' + new URLSearchParams(query).toString() : '';
      const res = await fetch(`${API_BASE_URL}/reviews${qs}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.items || data.data || [];
    } catch (error) {
      console.error('API getAdminReviews error:', error);
      return [];
    }
  },

  async getReviewStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch (error) {
      console.error('API getReviewStats error:', error);
      return null;
    }
  },

  async getProductReviews(productId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.items || data.data || [];
    } catch (error) {
      console.error('API getProductReviews error:', error);
      return [];
    }
  },

  async createReview(reviewData: {
    product: string;
    customerName?: string;
    customerEmail?: string;
    rating: number;
    comment?: string;
    isVerifiedPurchase?: boolean;
  }) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('saoudi_customer_token') || localStorage.getItem('saoudi_token')
          : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال التقييم');
      return data.data;
    } catch (error) {
      console.error('API createReview error:', error);
      throw error;
    }
  },

  async approveReview(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل اعتماد التقييم');
      return data.data;
    } catch (error) {
      console.error('API approveReview error:', error);
      throw error;
    }
  },

  async rejectReview(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/reject`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل رفض التقييم');
      return data.data;
    } catch (error) {
      console.error('API rejectReview error:', error);
      throw error;
    }
  },

  async bulkApproveReviews(ids: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/bulk-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل اعتماد التقييمات المحددة');
      return data.data;
    } catch (error) {
      console.error('API bulkApproveReviews error:', error);
      throw error;
    }
  },

  async bulkRejectReviews(ids: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/bulk-reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حجب التقييمات المحددة');
      return data.data;
    } catch (error) {
      console.error('API bulkRejectReviews error:', error);
      throw error;
    }
  },

  async toggleFeaturedReview(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/toggle-featured`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تحديث حالة تمييز التقييم');
      return data.data;
    } catch (error) {
      console.error('API toggleFeaturedReview error:', error);
      throw error;
    }
  },

  async updateReview(id: string, updateData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تعديل التقييم');
      return data.data;
    } catch (error) {
      console.error('API updateReview error:', error);
      throw error;
    }
  },

  async replyReview(id: string, text: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال الرد على التقييم');
      return data.data;
    } catch (error) {
      console.error('API replyReview error:', error);
      throw error;
    }
  },

  async deleteReview(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حذف التقييم');
      return data.data;
    } catch (error) {
      console.error('API deleteReview error:', error);
      throw error;
    }
  },

  async bulkDeleteReviews(ids: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/bulk-delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل حذف التقييمات المحددة');
      return data.data;
    } catch (error) {
      console.error('API bulkDeleteReviews error:', error);
      throw error;
    }
  },

  async getAdminStaff() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.items || data.data || [];
    } catch (error) {
      console.error('API getAdminStaff error:', error);
      return [];
    }
  },
};
