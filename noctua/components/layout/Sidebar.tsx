'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  ClipboardList,
  ChefHat,
  Package,
  CalendarDays,
  LogOut,
  Menu,
  X,
  History,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/hooks/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard/mesas', icon: UtensilsCrossed, label: 'Mesas' },
  { href: '/dashboard/pedido', icon: ClipboardList, label: 'Pedidos' },
  { href: '/dashboard/cocina', icon: ChefHat, label: 'Cocina' },
  { href: '/dashboard/historial', icon: History, label: 'Historial' },
  { href: '/dashboard/stock', icon: Package, label: 'Stock' },
  { href: '/dashboard/reservas', icon: CalendarDays, label: 'Reservas' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const usuario = useAuthStore((s) => s.usuario);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0d0d0d] border border-[#222] rounded-lg text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Abrir menú"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <motion.aside
        initial={false}
        animate={
          typeof window !== 'undefined' && window.innerWidth < 1024
            ? { x: mobileOpen ? 0 : -280 }
            : { x: 0 }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-[#080808] border-r border-[#1a1a1a] flex flex-col z-40',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-6 py-8 border-b border-[#1a1a1a]">
          <h1 className="font-display text-4xl font-black tracking-[0.15em] text-white leading-none">
            NOCTUA
          </h1>
          <p className="text-[#676B67] text-xs mt-1 tracking-widest uppercase">Panel de Gestión</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1" role="navigation" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-white text-black'
                    : 'text-[#676B67] hover:text-white hover:bg-white/5'
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-black' : 'text-[#676B67] group-hover:text-white'
                  )}
                />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 bg-black rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-5 border-t border-[#1a1a1a]">
          {usuario && (
            <div className="mb-3 px-1">
              <p className="text-white text-sm font-semibold">{usuario.nombre}</p>
              <p className="text-[#676B67] text-xs capitalize">{usuario.rol}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#676B67] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </motion.aside>
    </>
  );
}
