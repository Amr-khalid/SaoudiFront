import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailView } from '../../../components/ProductDetailView';
import { api } from '../../../lib/api';
import { Product } from '../../../types';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  let product = await api.getProductById(id);

  if (!product) {
    const all = await api.getProducts({ limit: 100 });
    if (all && all.products) {
      product = all.products.find((p: Product) => p.id === id || (p as any)._id === id || p.name.toLowerCase() === id.toLowerCase()) || null;
    }
  }

  if (!product) {
    const { PRODUCTS } = await import('../../../data/products');
    product = PRODUCTS.find((p: Product) => p.id === id || p.id.toLowerCase() === id.toLowerCase()) || null;
  }

  if (!product) {
    return {
      title: 'المنتج غير موجود | SAOUDI WEAR',
    };
  }

  return {
    title: `${product.name} | SAOUDI WEAR ATELIER`,
    description: product.shortDescription || product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  let product = await api.getProductById(id);

  if (!product) {
    const all = await api.getProducts({ limit: 100 });
    if (all && all.products) {
      product = all.products.find((p: Product) => p.id === id || (p as any)._id === id || p.name.toLowerCase() === id.toLowerCase()) || null;
    }
  }

  if (!product) {
    const { PRODUCTS } = await import('../../../data/products');
    product = PRODUCTS.find((p: Product) => p.id === id || p.id.toLowerCase() === id.toLowerCase()) || null;
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailView initialProduct={product} productId={id} />;
}
