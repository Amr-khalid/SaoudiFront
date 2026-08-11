'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CartItem, ToastNotification, ModalAlertOptions, Language } from '../types';
import { translations, TranslationDictionary } from '../translations';
import { api } from '../lib/api';

interface AppContextType {
  lang: Language;
  toggleLanguage: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  products: Product[];
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  cartItems: CartItem[];
  addToCart: (product: Product, finish?: string, size?: string) => void;
  buyNow: (product: Product, finish?: string, size?: string) => void;
  updateQuantity: (id: string, newQty: number) => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;
  wishlistIds: string[];
  toggleWishlist: (product: Product) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isLookbookOpen: boolean;
  setIsLookbookOpen: (open: boolean) => void;
  isSizeGuideOpen: boolean;
  setIsSizeGuideOpen: (open: boolean) => void;
  is360Open: boolean;
  setIs360Open: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  modalState: ModalAlertOptions;
  closeModal: () => void;
  showAlert: (options: string | { title?: string; message: string; type?: 'danger' | 'warning' | 'success' | 'info'; icon?: string; confirmText?: string }) => Promise<void>;
  showConfirm: (options: string | { title?: string; message: string; type?: 'danger' | 'warning' | 'success' | 'info' | 'question'; icon?: string; confirmText?: string; cancelText?: string }) => Promise<boolean>;
  user: any;
  setUser: (user: any) => void;
  isAdmin: boolean;
  logout: () => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  categories: any[];
  brands: any[];
  t: TranslationDictionary;
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;
  whatsappPhone: string;
  setWhatsappPhone: (phone: string) => void;
  getWhatsAppLink: (text?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  // Products State (100% Live REST API)
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart State (Persisted in localStorage + Synced with REST API)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartInitialized, setIsCartInitialized] = useState(false);

  // Wishlist State (Persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isWishlistInitialized, setIsWishlistInitialized] = useState(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Toast System
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Luxury Modal Alert & Confirm System
  const [modalState, setModalState] = useState<ModalAlertOptions>({
    isOpen: false,
    message: '',
  });

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const showAlert = (options: string | { title?: string; message: string; type?: 'danger' | 'warning' | 'success' | 'info'; icon?: string; confirmText?: string }): Promise<void> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      setModalState({
        isOpen: true,
        title: opts.title || 'إشعار',
        message: opts.message,
        type: opts.type || 'info',
        icon: opts.icon,
        confirmText: opts.confirmText || 'حسناً، فهمت',
        isConfirm: false,
        onConfirm: () => {
          resolve();
        },
        onCancel: () => {
          resolve();
        },
      });
    });
  };

  const showConfirm = (options: string | { title?: string; message: string; type?: 'danger' | 'warning' | 'success' | 'info' | 'question'; icon?: string; confirmText?: string; cancelText?: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      const isDestructive = opts.message.includes('حذف') || opts.message.includes('تفريغ') || opts.message.includes('خروج') || opts.message.includes('مسح');
      setModalState({
        isOpen: true,
        title: opts.title || 'تأكيد الإجراء',
        message: opts.message,
        type: opts.type || (isDestructive ? 'danger' : 'question'),
        icon: opts.icon,
        confirmText: opts.confirmText || 'تأكيد',
        cancelText: opts.cancelText || 'إلغاء',
        isConfirm: true,
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  };

  // Store WhatsApp & Contact Phone State (Live from Backend / Admin Profile)
  const [whatsappPhone, setWhatsappPhoneState] = useState<string>('');

  const setWhatsappPhone = (newPhone: string) => {
    if (!newPhone) return;
    setWhatsappPhoneState(newPhone);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saoudi_admin_phone', newPhone);
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = Math.random().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current: ToastNotification | null) => (current?.id === id ? null : current));
    }, 4000);
  };

  // 1. Initial Load from LocalStorage for Cart & Wishlist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('saoudi_cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not parse cart from localStorage:', e);
      } finally {
        setIsCartInitialized(true);
      }

      try {
        const savedWishlist = localStorage.getItem('saoudi_wishlist');
        if (savedWishlist) {
          const parsed = JSON.parse(savedWishlist);
          if (Array.isArray(parsed)) {
            setWishlistIds(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not parse wishlist from localStorage:', e);
      } finally {
        setIsWishlistInitialized(true);
      }
    }
  }, []);

  // 2. Persist Cart to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (isCartInitialized && typeof window !== 'undefined') {
      localStorage.setItem('saoudi_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isCartInitialized]);

  // 3. Persist Wishlist to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (isWishlistInitialized && typeof window !== 'undefined') {
      localStorage.setItem('saoudi_wishlist', JSON.stringify(wishlistIds));
    }
  }, [wishlistIds, isWishlistInitialized]);

  const refreshProducts = async () => {
    try {
      const res = await api.getProducts({ limit: 100 });
      if (res && res.products && res.products.length > 0) {
        setProducts(res.products);
      }
    } catch (err) {
      console.warn('Failed to refresh products:', err);
    }
  };

  // Fetch Live Products & Backend Data
  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = async () => {
      setIsLoadingProducts(true);
      const res = await api.getProducts({ limit: 100 });
      if (isMounted && res && res.products.length > 0) {
        setProducts(res.products);
        setSelectedProduct(res.products[0]);
      }
      if (isMounted) setIsLoadingProducts(false);
    };

    fetchLiveProducts();
    return () => { isMounted = false; };
  }, []);

  // Language state ('en' | 'ar')
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saoudi_lang') as Language;
      if (saved === 'ar' || saved === 'en') {
        setLang(saved);
      }
    }
  }, []);

  const t = translations[lang];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saoudi_lang', lang);
      if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
      }
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev: Language) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saoudi_theme') as 'dark' | 'light';
      const initialTheme = (saved === 'dark' || saved === 'light') ? saved : 'dark';
      setTheme(initialTheme);
      const root = document.documentElement;
      const body = document.body;
      if (initialTheme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        body.classList.add('light');
        body.classList.remove('dark');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        body.classList.remove('light');
        body.classList.add('dark');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saoudi_theme', theme);
      const root = document.documentElement;
      const body = document.body;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        body.classList.add('light');
        body.classList.remove('dark');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        body.classList.remove('light');
        body.classList.add('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Cart Actions
  const addToCart = (product: Product, finish?: string, size?: string) => {
    const itemFinish = finish && finish.trim() !== '' && finish !== 'الافتراضي' && finish !== 'Default'
      ? finish
      : (product.colors && product.colors.length > 0 ? product.colors[0].name : undefined);

    const itemSize = size && size.trim() !== '' && size !== 'الافتراضي' && size !== 'Default'
      ? size
      : (product.sizes && product.sizes.length > 0 ? product.sizes[0] : (product.strapSizes && product.strapSizes.length > 0 ? product.strapSizes[0] : undefined));

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedFinish === itemFinish && item.selectedSize === itemSize
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity: 1,
          selectedFinish: itemFinish,
          selectedSize: itemSize,
        },
      ];
    });

    // Sync with backend in background
    api.addToCart(product.id, 1, { color: itemFinish, size: itemSize }).catch(() => {});

    showToast(lang === 'ar' ? `تمت إضافة "${product.name}" إلى حقيبة التسوق.` : `Added "${product.name}" to your Shopping Bag.`);
    setIsCartOpen(true);
  };

  const buyNow = (product: Product, finish?: string, size?: string) => {
    addToCart(product, finish, size);
    setIsCartOpen(false);
    router.push('/checkout');
  };

  const toggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      if (prev.includes(product.id)) {
        showToast(lang === 'ar' ? `تمت إزالة "${product.name}" من المفضلات.` : `Removed "${product.name}" from Wishlist.`);
        return prev.filter((id) => id !== product.id);
      } else {
        showToast(lang === 'ar' ? `تم حفظ "${product.name}" في المفضلات.` : `Saved "${product.name}" to Wishlist.`);
        return [...prev, product.id];
      }
    });
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(id);
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
    api.updateCartItemQuantity(id, newQty).catch(() => {});
  };

  const removeCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    api.removeCartItem(id).catch(() => {});
    showToast(lang === 'ar' ? 'تمت إزالة المنتج من الحقيبة.' : 'Item removed from Shopping Bag.');
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saoudi_cart');
    }
    api.clearCart().catch(() => {});
    showToast(lang === 'ar' ? 'تم تفريغ حقيبة التسوق بالكامل.' : 'Shopping bag cleared completely.');
  };

  // User & Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('saoudi_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && isMounted) setUser(parsed);
        } catch (e) {}
      }
    }

    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('saoudi_admin_phone');
      if (savedPhone) setWhatsappPhoneState(savedPhone);
    }

    api.getStoreSettings().then((st) => {
      if (isMounted && st) {
        if (st.whatsappPhone || st.phone) {
          const ph = st.whatsappPhone || st.phone;
          setWhatsappPhoneState(ph);
          if (typeof window !== 'undefined') localStorage.setItem('saoudi_admin_phone', ph);
        }
      }
    }).catch(() => {});

    api.getCurrentUser().then((usr) => {
      if (isMounted && usr) {
        setUser(usr);
        if (usr.phone) {
          setWhatsappPhoneState(usr.phone);
          if (typeof window !== 'undefined') localStorage.setItem('saoudi_admin_phone', usr.phone);
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('saoudi_user', JSON.stringify(usr));
        }
      }
    });
    api.getCategories().then((cats) => {
      if (isMounted && cats) setCategories(cats);
    });
    api.getBrands().then((bnds) => {
      if (isMounted && bnds) setBrands(bnds);
    });
    return () => { isMounted = false; };
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saoudi_token');
      localStorage.removeItem('saoudi_user');
    }
    setUser(null);
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح من SAOUDI WEAR' : 'Signed out of SAOUDI WEAR Atelier');
  };

  // Dynamic WhatsApp URL helper - 100% sourced from backend / live settings
  const getWhatsAppLink = (customText?: string) => {
    const rawNumber =
      whatsappPhone ||
      (user && user.phone) ||
      (typeof window !== 'undefined' ? localStorage.getItem('saoudi_admin_phone') : '') ||
      '';
    let clean = rawNumber.replace(/[^0-9]/g, '');
    if (!clean) return '#';

    // If starts with 00 (e.g. 002010... -> 2010...)
    if (clean.startsWith('00')) {
      clean = clean.slice(2);
    }
    // If Egyptian number starting with 01 (11 digits e.g. 01012345678)
    else if (clean.startsWith('01') && clean.length === 11) {
      clean = '2' + clean;
    }
    // If 10 digits starting with 0 (e.g. 0101234567)
    else if (clean.startsWith('0') && clean.length === 10) {
      clean = '2' + clean;
    }
    // If Saudi number starting with 5 (9 digits e.g. 501234567)
    else if (clean.startsWith('5') && clean.length === 9) {
      clean = '966' + clean;
    }
    // If Saudi number with leading 0 (0501234567)
    else if (clean.startsWith('05') && clean.length === 10) {
      clean = '966' + clean.slice(1);
    }
    // If Tunisian number (8 digits starting with 2, 5, or 9)
    else if ((clean.startsWith('2') || clean.startsWith('5') || clean.startsWith('9')) && clean.length === 8) {
      clean = '216' + clean;
    }

    return `https://wa.me/${clean}${customText ? `?text=${encodeURIComponent(customText)}` : ''}`;
  };

  // Reactive Admin Role Verification
  const isAdmin = Boolean(
    user &&
    (
      user.role === 'admin' ||
      user.role === 'superAdmin' ||
      user.role === 'manager' ||
      user.role === 'warehouse' ||
      user.role === 'customerSupport' ||
      user.isAdmin === true ||
      user.email === 'admin@saoudiwear.com' ||
      (typeof user.role === 'string' &&
        (user.role.toLowerCase().includes('admin') ||
          user.role.toLowerCase().includes('manager') ||
          user.role.toLowerCase().includes('staff')))
    )
  );

  return (
    <AppContext.Provider
      value={{
        lang,
        toggleLanguage,
        theme,
        toggleTheme,
        products,
        selectedProduct,
        setSelectedProduct,
        cartItems,
        addToCart,
        buyNow,
        updateQuantity,
        removeCartItem,
        clearCart,
        wishlistIds,
        toggleWishlist,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isSearchOpen,
        setIsSearchOpen,
        isLookbookOpen,
        setIsLookbookOpen,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        is360Open,
        setIs360Open,
        quickViewProduct,
        setQuickViewProduct,
        toast,
        showToast,
        modalState,
        closeModal,
        showAlert,
        showConfirm,
        user,
        setUser,
        isAdmin,
        logout,
        isAuthOpen,
        setIsAuthOpen,
        isProfileOpen,
        setIsProfileOpen,
        categories,
        brands,
        t,
        isLoadingProducts,
        refreshProducts,
        whatsappPhone,
        setWhatsappPhone,
        getWhatsAppLink,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
