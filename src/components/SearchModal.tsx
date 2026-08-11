import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export const SearchModal: React.FC = () => {
  const router = useRouter();
  const { isSearchOpen, setIsSearchOpen, products: defaultProducts, theme, t } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Backend Search with 300ms Debounce & Multi-field Smart Filter
  useEffect(() => {
    if (!query.trim()) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await api.searchProducts(query);
      if (results && results.length > 0) {
        setLiveResults(results);
      } else {
        // Smart multi-field local fallback matching (Name, Category, Description, Materials, Specs, Badge)
        const q = query.toLowerCase().trim();
        const matched = defaultProducts.filter((p) => {
          const nameMatch = p.name.toLowerCase().includes(q);
          const catMatch = p.category.toLowerCase().includes(q);
          const descMatch = (p.description || '').toLowerCase().includes(q);
          const shortDescMatch = (p.shortDescription || '').toLowerCase().includes(q);
          const matMatch = (p.materials || '').toLowerCase().includes(q);
          const badgeMatch = (p.badge || '').toLowerCase().includes(q);
          const specsMatch = (p.specs || []).some(
            (s) => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
          );

          return nameMatch || catMatch || descMatch || shortDescMatch || matMatch || badgeMatch || specsMatch;
        });

        setLiveResults(matched);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, defaultProducts]);

  // Dynamic Suggested Queries & Categories from Backend API
  const [dynamicQueries, setDynamicQueries] = useState<string[]>([
    'Rose Gold',
    'Cashmere',
    'Italian Wool',
    'Chronograph',
  ]);
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    let isMounted = true;
    const loadBackendSuggestions = async () => {
      try {
        const [cats, brands, prodsRes] = await Promise.all([
          api.getCategories(),
          api.getBrands(),
          api.getProducts({ limit: 12 }),
        ]);

        const suggestionsSet = new Set<string>();

        if (cats && Array.isArray(cats) && cats.length > 0) {
          const catNames = cats.map((c) => (typeof c === 'string' ? c : c.name || c.title)).filter(Boolean);
          if (isMounted && catNames.length > 0) {
            setCategories(['All', ...catNames]);
          }
          catNames.forEach((name) => suggestionsSet.add(name));
        }

        if (brands && Array.isArray(brands)) {
          brands.forEach((b) => {
            const name = typeof b === 'string' ? b : b.name;
            if (name) suggestionsSet.add(name);
          });
        }

        if (prodsRes && prodsRes.products) {
          prodsRes.products.forEach((p: Product) => {
            if (p.badge) suggestionsSet.add(p.badge);
            if (p.materials) {
              p.materials.split(',').forEach((m: string) => {
                const trimmed = m.trim();
                if (trimmed.length > 3 && trimmed.length < 25) suggestionsSet.add(trimmed);
              });
            }
          });
        }

        const list = Array.from(suggestionsSet).slice(0, 10);
        if (isMounted && list.length > 0) {
          setDynamicQueries(list);
        }
      } catch (err) {
        console.warn('Failed to load dynamic suggestions:', err);
      }
    };

    loadBackendSuggestions();
    return () => { isMounted = false; };
  }, []);

  if (!isSearchOpen) return null;

  const filteredResults = selectedCategory === 'All'
    ? liveResults
    : liveResults.filter((p) => p.category === selectedCategory);

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-2xl flex flex-col items-center pt-16 md:pt-24 px-4 md:px-8 animate-fade-in transition-colors duration-300 ${
        isDark ? 'bg-[#0D0D0D]/95 text-white' : 'bg-[#F4F4F6]/95 text-neutral-900'
      }`}
    >
      <div className="max-w-3xl w-full space-y-6">
        {/* Main Smart Search Input Box */}
        <div
          className={`relative border-2 border-[#D4AF37] rounded-xl p-3 md:p-4 shadow-2xl flex items-center gap-3 transition-colors duration-300 ${
            isDark ? 'bg-[#141414]' : 'bg-white shadow-xl'
          }`}
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl text-[#D4AF37]">search</span>
          
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, wool, cashmere, caliber, rose gold, specs, materials..."
            className={`w-full bg-transparent text-lg md:text-2xl font-garamond outline-none transition-colors ${
              isDark ? 'text-white placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'
            }`}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className={`p-1 text-xs uppercase font-label-caps transition-colors ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Clear
            </button>
          )}

          <button
            onClick={() => setIsSearchOpen(false)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'bg-[#262626] hover:bg-[#D4AF37] hover:text-neutral-950 text-neutral-300' : 'bg-neutral-100 hover:bg-[#D4AF37] hover:text-neutral-950 text-neutral-700'
            }`}
            aria-label="Close search"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Popular Luxury Tags */}
        {!query && (
          <div className="space-y-4 pt-2">
            <span className="font-label-caps text-xs text-[#D4AF37] uppercase tracking-[0.2em] font-bold">
              Suggested Smart Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              {dynamicQueries.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className={`px-4 py-2 border font-button text-xs uppercase rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-[#141414] border-[#262626] text-neutral-300'
                      : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]">auto_awesome</span>
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Area */}
        {query && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className={`flex flex-wrap items-center gap-2 border-b pb-3 ${isDark ? 'border-[#262626]' : 'border-neutral-200'}`}>
              <span className={`text-xs font-label-caps uppercase mr-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Filter Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-label-caps uppercase transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#D4AF37] text-neutral-950 font-bold'
                      : isDark
                      ? 'bg-[#1A1A1A] text-neutral-400 border border-[#262626] hover:text-white'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:text-neutral-900 shadow-xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Loading Indicator */}
            {isSearching ? (
              <div className="py-12 flex justify-center items-center text-[#D4AF37] gap-3">
                <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                <span className="text-xs font-label-caps uppercase tracking-widest">
                  Performing Multi-Field Smart AI Match...
                </span>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className={`py-12 text-center border rounded-xl space-y-3 ${isDark ? 'bg-[#141414] border-[#262626]' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <span className="material-symbols-outlined text-4xl text-[#D4AF37]">search_off</span>
                <p className={`text-base font-garamond font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                  No Atelier Assets match "{query}"
                </p>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                  Try searching for general terms like "wool", "cashmere", "rose gold", or "timepieces".
                </p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                <div className={`text-xs font-label-caps uppercase tracking-wider mb-2 flex justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  <span>Found {filteredResults.length} Matched Assets</span>
                  <span className="text-[#D4AF37]">Smart Multi-Field Match</span>
                </div>

                {filteredResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push(`/product/${product.id}`);
                    }}
                    className={`group flex items-center justify-between p-4 border hover:border-[#D4AF37] cursor-pointer rounded-xl transition-all ${
                      isDark
                        ? 'bg-[#141414] border-[#262626] text-white shadow-md'
                        : 'bg-white border-neutral-200 text-neutral-900 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] font-label-caps text-[9px] uppercase font-bold rounded">
                            {product.category}
                          </span>
                          {product.badge && (
                            <span className={`px-2 py-0.5 font-label-caps text-[9px] uppercase rounded ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700'}`}>
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <h4 className={`font-garamond text-lg group-hover:text-[#D4AF37] transition-colors font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {product.name}
                        </h4>
                        <p className={`text-xs line-clamp-1 font-light max-w-md ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {product.shortDescription || product.materials || product.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono text-base font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        ${product.price.toLocaleString()} USD
                      </span>
                      <span className="text-[10px] font-label-caps text-[#D4AF37] uppercase tracking-wider group-hover:underline flex items-center gap-1 justify-end mt-1">
                        <span>View Asset</span>
                        <span className="material-symbols-outlined text-xs rtl:rotate-180">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
