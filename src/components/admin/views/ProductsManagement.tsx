'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Product } from '../../../types';
import { ProductFormModal } from './ProductFormModal';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

export const ProductsManagement: React.FC = () => {
  const { showAlert, showConfirm, showToast } = useApp();
  const [productList, setProductList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const fetchProducts = () => {
    setIsLoading(true);
    api
      .getProducts({ limit: 100 })
      .then((res) => {
        if (res && res.products && res.products.length > 0) {
          setProductList(res.products);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = [
    'All',
    'Timepieces',
    'Suits',
    'Coats & Jackets',
    'Knitwear',
    'Accessories',
    'Outerwear',
  ];

  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [productList, categoryFilter, searchQuery]);

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (product: Product) => {
    const duplicatedData = {
      ...product,
      name: `${product.name} (نسخة جديدة)`,
      sku: `SW-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    try {
      await api.createProduct(duplicatedData);
      fetchProducts();
      showToast('تم تكرار المنتج وإنشاء نسخة بنجاح!', 'success');
    } catch (err: any) {
      showAlert({
        title: 'فشل التكرار',
        message: err.message || 'فشلت عملية تكرار المنتج',
        type: 'danger',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await showConfirm({
      title: 'حذف المنتج نهائياً',
      message: 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من الكتالوج وقاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'نعم، حذف المنتج',
      cancelText: 'تراجع',
      type: 'danger',
      icon: 'delete_forever',
    });

    if (isConfirmed) {
      try {
        await api.deleteProduct(id);
        setProductList(productList.filter((p) => p.id !== id && (p as any)._id !== id));
        showToast('تم حذف المنتج بنجاح من قاعدة البيانات!', 'success');
      } catch (err: any) {
        showAlert({
          title: 'خطأ أثناء الحذف',
          message: err.message || 'حدث خطأ أثناء حذف المنتج.',
          type: 'danger',
        });
      }
    }
  };

  const handleSaveProduct = () => {
    fetchProducts();
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl">
      {/* Filters & Search Row */}
      <div className="bg-white dark:bg-[#151515] p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 md:w-80">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج، SKU، الخامات..."
              className="w-full pr-9 pl-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37]"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[#9A7B1C] dark:focus:border-[#D4AF37] cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                القسم: {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            عرض <strong>{filteredProducts.length}</strong> من {productList.length}
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-[#9A7B1C] via-[#D4AF37] to-[#9A7B1C] hover:brightness-105 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-[#151515] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedProductIds.length === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductIds(filteredProducts.map((p) => p.id));
                      } else {
                        setSelectedProductIds([]);
                      }
                    }}
                    className="accent-[#D4AF37]"
                  />
                </th>
                <th className="p-3.5">صورة المنتج والاسم</th>
                <th className="p-3.5">القسم</th>
                <th className="p-3.5">سعر البيع</th>
                <th className="p-3.5">المخزون المتوفر</th>
                <th className="p-3.5">حالة النشر</th>
                <th className="p-3.5 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    <span className="material-symbols-outlined animate-spin text-2xl text-[#D4AF37] block mb-2 mx-auto">
                      progress_activity
                    </span>
                    جاري تحميل كتالوج المنتجات الحية...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    لا توجد منتجات مطابقة لخيارات البحث.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const stockCount = product.stock ?? product.stockQuantity ?? 10;
                  return (
                    <tr
                      key={product.id || (product as any)._id}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? 'bg-amber-50/40 dark:bg-neutral-800/60' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds([...selectedProductIds, product.id]);
                            } else {
                              setSelectedProductIds(
                                selectedProductIds.filter((id) => id !== product.id)
                              );
                            }
                          }}
                          className="accent-[#D4AF37]"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-garamond text-sm font-bold text-neutral-950 dark:text-white leading-tight">
                              {product.name}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                              SKU: {product.sku || `SW-${(product.id || '').slice(0, 8).toUpperCase()}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-neutral-900 dark:text-white font-garamond text-sm">
                        ${(product.price || 0).toLocaleString()} USD
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            stockCount > 5
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {stockCount} قطع بالمخزن
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-[#9A7B1C] dark:text-[#D4AF37] border border-amber-300 dark:border-amber-700/40 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {product.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-[#9A7B1C] dark:hover:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="تعديل المنتج"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-[#9A7B1C] dark:hover:text-[#D4AF37] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="تكرار النسخة"
                          >
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id || (product as any)._id)}
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="حذف المنتج"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
        onSave={handleSaveProduct}
      />
    </div>
  );
};
