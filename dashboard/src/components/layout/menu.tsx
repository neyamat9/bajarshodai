import type { ReactNode } from "react";
import {
  LayoutDashboard, ShoppingBag, PlusCircle, RotateCcw, Users, Boxes, PackagePlus, Warehouse, FolderTree, Handshake, Images,
  TicketPercent, GalleryHorizontal, BellRing, Star, MessageCircleQuestion, LifeBuoy, Mail, Newspaper, BarChart3,
  Bell, Settings, History, ShieldCheck, UserCircle, Ruler, CalendarClock, UserCog, Truck, Bike, Pill,
} from "lucide-react";
import type { AttentionSummary } from "@/api/notifications";
import type { AdminUser } from "@/api/client";
import { can, canDeliver, isAdminRole, type Permission } from "@/lib/access";
import { tr } from "@/i18n";

export interface MenuItem {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
  badge?: (s: AttentionSummary) => number;
  /** shown to people who hold any one of these (admins always). Leave out = every signed-in person. */
  needs?: Permission[];
  /** only for people who can be sent to deliver */
  rider?: boolean;
  /** only for admins and super admins */
  adminOnly?: boolean;
}
export interface MenuSection {
  title: string;
  items: MenuItem[];
}

const i = (C: typeof LayoutDashboard) => <C size={18} />;

export const menu: MenuSection[] = [
  { title: tr("Overview"), items: [{ label: tr("Dashboard"), to: "/", icon: i(LayoutDashboard), end: true, needs: ["reports.view"] }] },
  {
    title: tr("Delivery"),
    items: [
      { label: tr("My deliveries"), to: "/my-deliveries", icon: i(Bike), rider: true },
      { label: tr("Delivery board"), to: "/deliveries", icon: i(Truck), needs: ["delivery.manage", "orders.assign"] },
    ],
  },
  {
    title: tr("Sales"),
    items: [
      { label: tr("Orders"), to: "/orders", icon: i(ShoppingBag), end: true, badge: (s) => s.pendingOrders, needs: ["orders.view"] },
      { label: tr("Create order"), to: "/orders/new", icon: i(PlusCircle), needs: ["orders.manage"] },
      { label: tr("Returns"), to: "/returns", icon: i(RotateCcw), badge: (s) => s.pendingReturns, needs: ["orders.view"] },
      { label: tr("Customers"), to: "/customers", icon: i(Users), needs: ["customers.view"] },
    ],
  },
  {
    title: tr("Catalog"),
    items: [
      { label: tr("Products"), to: "/products", icon: i(Boxes), end: true, needs: ["products.view"] },
      { label: tr("Add product"), to: "/products/new", icon: i(PackagePlus), needs: ["products.manage"] },
      { label: tr("Daily prices & stock"), to: "/daily-sheet", icon: i(CalendarClock), needs: ["inventory.manage", "products.manage"] },
      { label: tr("Medicine Hub & Sync"), to: "/medicine-sync", icon: i(Pill), needs: ["products.view"] },
      { label: tr("Inventory"), to: "/inventory", icon: i(Warehouse), badge: (s) => s.lowStockItems + s.outOfStockItems, needs: ["inventory.manage", "products.view"] },
      { label: tr("Categories"), to: "/categories", icon: i(FolderTree), needs: ["products.view"] },
      { label: tr("Units"), to: "/units", icon: i(Ruler), needs: ["products.view"] },
      { label: tr("Brands"), to: "/brands", icon: i(Handshake), needs: ["products.view"] },
      { label: tr("Media library"), to: "/media", icon: i(Images), needs: ["products.view", "products.manage"] },
    ],
  },
  {
    title: tr("Marketing"),
    items: [
      { label: tr("Coupons"), to: "/coupons", icon: i(TicketPercent), adminOnly: true },
      { label: tr("Banners"), to: "/banners", icon: i(GalleryHorizontal), adminOnly: true },
      { label: tr("Back in stock"), to: "/back-in-stock", icon: i(BellRing), adminOnly: true },
    ],
  },
  {
    title: tr("Customer care"),
    items: [
      { label: tr("Reviews"), to: "/reviews", icon: i(Star), adminOnly: true },
      { label: tr("Questions"), to: "/questions", icon: i(MessageCircleQuestion), badge: (s) => s.unansweredQuestions, adminOnly: true },
      { label: tr("Support tickets"), to: "/support", icon: i(LifeBuoy), badge: (s) => s.openTickets, adminOnly: true },
      { label: tr("Contact messages"), to: "/contact", icon: i(Mail), badge: (s) => s.newContactMessages, adminOnly: true },
      { label: tr("Newsletter"), to: "/newsletter", icon: i(Newspaper), adminOnly: true },
    ],
  },
  { title: tr("Insights"), items: [{ label: tr("Reports"), to: "/reports", icon: i(BarChart3), needs: ["reports.view"] }] },
  {
    title: tr("System"),
    items: [
      { label: tr("Staff"), to: "/staff", icon: i(UserCog), needs: ["staff.manage"] },
      { label: tr("Notifications"), to: "/notifications", icon: i(Bell), badge: (s) => s.unreadNotifications },
      { label: tr("Settings"), to: "/settings", icon: i(Settings), needs: ["settings.manage"] },
      { label: tr("Activity log"), to: "/activity", icon: i(History), needs: ["logs.view"] },
      { label: tr("Audit log"), to: "/audit", icon: i(ShieldCheck), needs: ["logs.view"] },
      { label: tr("My profile"), to: "/profile", icon: i(UserCircle) },
    ],
  },
];

/** Can this person open this menu item? */
export function allowed(item: MenuItem, user: AdminUser | null): boolean {
  if (!user) return false;
  if (item.adminOnly) return isAdminRole(user);
  if (item.rider) return canDeliver(user);
  return item.needs ? can(user, ...item.needs) : true;
}

/** The menu this person sees: only what they may open, and no empty sections. */
export function menuFor(user: AdminUser | null): MenuSection[] {
  return menu.map((s) => ({ ...s, items: s.items.filter((it) => allowed(it, user)) })).filter((s) => s.items.length > 0);
}
