'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
export const WishlistDrawer: React.FC = () => {
  const router = useRouter();
  const {
    products,
    isWishlistOpen,
    setIsWishlistOpen,
    wishlistIds,
    toggleWishlist,
    addToCart,
    t,
  } = useApp();

  if (!isWishlistOpen) return null;

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#141414] border-l border-[#262626] h-full flex flex-col justify-between p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-[#262626]">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="material-symbols-outlined text-2xl text-[#D4AF37] fill">favorite</span>
            <h3 className="font-headline-md text-xl font-garamond text-[#E5E5E5]">
              {t.wishlist} ({wishlistProducts.length})
            </h3>
          </div>
          <button onClick={() => setIsWishlistOpen(false)} className="text-[#A3A3A3] hover:text-[#D4AF37] p-1 cursor-pointer">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-6 space-y-4 pr-1">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#262626]">favorite_border</span>
              <p className="font-body-md text-sm text-[#A3A3A3]">No items in your wishlist yet.</p>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="flex space-x-4 rtl:space-x-reverse p-3 bg-[#1D1D1D] border border-[#262626] rounded-xs items-center"
              >
                <div
                  onClick={() => {
                    setIsWishlistOpen(false);
                    router.push(`/product/${product.id}`);
                  }}
                  className="relative w-20 h-20 bg-[#141414] rounded-xs border border-[#262626] overflow-hidden flex-shrink-0 cursor-pointer"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h4
                    onClick={() => {
                      setIsWishlistOpen(false);
                      router.push(`/product/${product.id}`);
                    }}
                    className="font-garamond text-base text-[#E5E5E5] hover:text-[#D4AF37] cursor-pointer line-clamp-1"
                  >
                    {product.name}
                  </h4>
                  <p className="text-xs text-[#D4AF37] font-semibold">${product.price.toLocaleString()} USD</p>

                  <div className="flex items-center space-x-3 rtl:space-x-reverse pt-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="px-3 py-1 bg-[#D4AF37] text-[#0A0A0A] font-button text-[10px] uppercase font-bold tracking-wider hover:bg-[#E5C158] cursor-pointer"
                    >
                      Move to Bag
                    </button>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="text-[10px] text-[#A3A3A3] hover:text-red-400 underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => setIsWishlistOpen(false)}
          className="w-full py-3.5 border border-[#262626] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-button text-xs tracking-widest uppercase transition-colors cursor-pointer"
        >
          Close Wishlist
        </button>
      </div>
    </div>
  );
};
