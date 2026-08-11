import { AdminOrder } from '../types';

export { type AdminOrder };

export const ADMIN_KPI_STATS = {
  totalRevenue: 64200,
  totalOrders: 142,
  pendingOrders: 14,
  processingOrders: 18,
  shippedOrders: 42,
  deliveredOrders: 65,
  cancelledOrders: 3,
  totalProducts: 8,
  lowStockProducts: 2,
  outOfStockProducts: 1,
  totalCustomers: 890,
  newCustomersToday: 12,
  monthlyRevenue: 64200,
  weeklyRevenue: 18400,
  conversionRate: 3.42,
  averageOrderValue: 1450,
};

export const REVENUE_CHART_DATA = [
  { month: 'Jan', revenue: 42000, orders: 18 },
  { month: 'Feb', revenue: 58000, orders: 24 },
  { month: 'Mar', revenue: 61000, orders: 29 },
  { month: 'Apr', revenue: 51000, orders: 22 },
  { month: 'May', revenue: 73000, orders: 34 },
  { month: 'Jun', revenue: 64200, orders: 32 },
];

export const CATEGORY_SALES_SHARE = [
  { category: 'Timepieces', percentage: 45, color: '#D4AF37' },
  { category: 'Suits', percentage: 30, color: '#171717' },
  { category: 'Coats & Jackets', percentage: 15, color: '#525252' },
  { category: 'Accessories', percentage: 10, color: '#9A7B1C' },
];

export const MOCK_ADMIN_ORDERS: AdminOrder[] = [
  {
    id: 'ord-1001',
    orderNumber: 'SW-894102',
    customerName: 'H.R.H Prince Faisal Al-Saud',
    customerEmail: 'concierge@al-saud.sa',
    customerPhone: '+966 50 111 2233',
    customerCity: 'Riyadh',
    items: [{ name: 'The Obsidian Chronograph', quantity: 1, price: 2450 }],
    totalAmount: 2450,
    status: 'Processing',
    paymentMethod: 'Apple Pay (Mada)',
    date: '2026-08-04 14:20',
    shippingAddress: 'Al-Hada District, Villa 12, Riyadh, Saudi Arabia',
    timeline: [
      { status: 'Order Placed by Client', time: '2026-08-04 14:20' },
      { status: 'Payment Authorized via Mada Gateway', time: '2026-08-04 14:21' },
      { status: 'Horology Quality Control Initiated', time: '2026-08-04 14:35' },
    ],
  },
  {
    id: 'ord-1002',
    orderNumber: 'SW-894103',
    customerName: 'Lord Sterling Vance',
    customerEmail: 'sterling@vancecapital.co.uk',
    customerPhone: '+44 7700 900077',
    customerCity: 'London',
    items: [{ name: 'Bespoke Charcoal Suit', quantity: 1, price: 2100 }],
    totalAmount: 2100,
    status: 'Shipped',
    paymentMethod: 'Visa Black Card',
    date: '2026-08-03 11:15',
    shippingAddress: '14 Mayfair Square, W1J 8AJ, London, UK',
    timeline: [
      { status: 'Order Placed by Client', time: '2026-08-03 11:15' },
      { status: 'Dispatched via DHL Express Air', time: '2026-08-03 16:40' },
    ],
  },
];

export const MOCK_ADMIN_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'H.R.H Prince Faisal Al-Saud',
    email: 'concierge@al-saud.sa',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    status: 'VIP ROYAL',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    totalSpent: 48500,
    ordersCount: 12,
  },
  {
    id: 'cust-2',
    name: 'Lord Sterling Vance',
    email: 'sterling@vancecapital.co.uk',
    city: 'London',
    country: 'United Kingdom',
    status: 'ATELIER DIAMOND',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    totalSpent: 32100,
    ordersCount: 9,
  },
];

export const MOCK_ADMIN_INVENTORY = [
  {
    id: 'inv-1',
    productName: 'The Obsidian Chronograph (Rose Gold Edition)',
    sku: 'SW-OBS-ROSE-01',
    location: 'Riyadh Atelier Vault',
    stockLevel: 4,
    minThreshold: 5,
    barcode: '849201948102',
    status: 'Low Stock Alert',
  },
  {
    id: 'inv-2',
    productName: 'Charcoal Tailored Overcoat (Size L)',
    sku: 'SW-COAT-CHR-L',
    location: 'Dubai Logistics Hub',
    stockLevel: 18,
    minThreshold: 10,
    barcode: '849201948103',
    status: 'In Stock',
  },
];

export const MOCK_ADMIN_REVIEWS = [
  {
    id: 'rev-1',
    productName: 'The Obsidian Chronograph',
    customerName: 'Sheikh Tariq Al-Mansoor',
    rating: 5,
    status: 'Approved',
    comment: 'Exceptional craftsmanship. The Caliber SW500 mechanism is remarkably quiet and precise.',
    reply: 'Thank you Sheikh Tariq. It is an honor to serve your haute horology collection.',
  },
];

export const MOCK_ADMIN_COUPONS = [
  {
    id: 'coup-1',
    code: 'ATELIERVIP15',
    type: 'Percentage Discount',
    value: 15,
    minPurchase: 1000,
    usedCount: 42,
    usageLimit: 100,
    expiryDate: '2026-12-31',
    status: 'Active',
  },
];

export const MOCK_ADMIN_STAFF = [
  {
    id: 'st-1',
    name: 'Director Jean-Luc Laurent',
    email: 'admin@saoudiwear.com',
    role: 'Super Admin',
    status: 'Active',
  },
];

export const MOCK_ADMIN_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New High-Ticket Order Placed',
    message: 'Order #SW-894102 ($2,450 USD) placed by H.R.H Prince Faisal Al-Saud.',
    time: '5 mins ago',
    type: 'order',
  },
  {
    id: 'notif-2',
    title: 'Low Stock Warning',
    message: 'The Obsidian Chronograph has reached 4 units remaining in Riyadh Vault.',
    time: '25 mins ago',
    type: 'stock',
  },
];
