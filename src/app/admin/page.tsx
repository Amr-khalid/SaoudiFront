'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminLoginGate } from '../../components/admin/AdminLoginGate';
import { DashboardOverview } from '../../components/admin/views/DashboardOverview';
import { ProductsManagement } from '../../components/admin/views/ProductsManagement';
import { OrdersManagement } from '../../components/admin/views/OrdersManagement';
import { CustomersManagement } from '../../components/admin/views/CustomersManagement';
import { InventoryManagement } from '../../components/admin/views/InventoryManagement';
import { ProductFormModal } from '../../components/admin/views/ProductFormModal';
import { OrderDetailDrawer } from '../../components/admin/views/OrderDetailDrawer';
import {
  ReviewsManagementView,
  CouponsManagementView,
  AnalyticsReportsView,
  StaffRolesView,
  SettingsView,
  CategoriesManagementView,
} from '../../components/admin/views/OtherAdminViews';
import { AdminProfileSettings } from '../../components/admin/views/AdminProfileSettings';
import { HomepageManagement } from '../../components/admin/views/HomepageManagement';
import { AdminOrder } from '../../types';

const VALID_TABS: AdminTab[] = [
  'dashboard',
  'orders',
  'products',
  'categories',
  'inventory',
  'customers',
  'homepage',
  'coupons',
  'reviews',
  'profile',
  'analytics',
  'staff',
  'settings',
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Restore saved tab from localStorage or URL hash on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash.replace('#', '') as AdminTab;
        const savedTab = localStorage.getItem('saoudi_admin_tab') as AdminTab;

        if (hash && VALID_TABS.includes(hash)) {
          setActiveTab(hash);
        } else if (savedTab && VALID_TABS.includes(savedTab)) {
          setActiveTab(savedTab);
        }
      } catch (e) {
        console.warn('Could not restore admin tab:', e);
      }
    }
  }, []);

  // 2. Persist active tab to localStorage and URL hash whenever it changes
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('saoudi_admin_tab', tab);
        window.history.replaceState(null, '', `#${tab}`);
      } catch (e) {
        console.warn('Could not save admin tab:', e);
      }
    }
  };

  const handleProductSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AdminLoginGate>
      <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100">
        {/* Left Sidebar Menu */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
          {/* Sticky Header Bar */}
          <AdminHeader
            activeTab={activeTab}
            setIsOpenMobile={setIsOpenMobile}
            onOpenAddProductModal={() => setIsAddProductOpen(true)}
            onNavigateTab={handleTabChange}
          />

          {/* View Component Renderer */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                onSelectOrder={(order) => setSelectedOrder(order)}
                onNavigateTab={(tab) => handleTabChange(tab as AdminTab)}
              />
            )}

            {activeTab === 'orders' && <OrdersManagement />}

            {activeTab === 'products' && (
              <ProductsManagement key={refreshTrigger} />
            )}

            {activeTab === 'categories' && <CategoriesManagementView />}

            {activeTab === 'inventory' && <InventoryManagement />}

            {activeTab === 'customers' && <CustomersManagement />}

            {activeTab === 'homepage' && <HomepageManagement />}

            {activeTab === 'coupons' && <CouponsManagementView />}

            {activeTab === 'reviews' && <ReviewsManagementView />}

            {activeTab === 'profile' && <AdminProfileSettings />}

            {activeTab === 'analytics' && <AnalyticsReportsView />}

            {activeTab === 'staff' && <StaffRolesView />}

            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* Global Quick Add Product Modal */}
        <ProductFormModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onSave={handleProductSaved}
        />

        {/* Global Order Detail Drawer */}
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={() => {}}
        />
      </div>
    </AdminLoginGate>
  );
}
