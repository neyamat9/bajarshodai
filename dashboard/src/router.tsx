import type { ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import AdminLayout from "@/components/layout/AdminLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/shared/AuthGuard";
import { L } from "@/components/shared/LazyPage";
import { Guard, HomeGate } from "@/components/shared/AccessGuard";
import NotFound from "@/pages/NotFound";
import { AuthLayout } from "@/pages/auth/AuthShell";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Login from "@/pages/auth/Login";
import ResetPassword from "@/pages/auth/ResetPassword";
import {
  CardListSkeleton,
  DetailPageSkeleton,
  FeedPageSkeleton,
  GridPageSkeleton,
  ListPageSkeleton,
  ReportsSkeleton,
} from "@/components/shared/skeletons";
import {
  BackInStockSkeleton,
  ContactSkeleton,
  CouponsSkeleton,
  CustomersSkeleton,
  DashboardSkeleton,
  InventorySkeleton,
  NewsletterSkeleton,
  OrdersSkeleton,
  PosSkeleton,
  ProductEditorSkeleton,
  ProductsSkeleton,
  ProfileSkeleton,
  QuestionsSkeleton,
  ReturnsSkeleton,
  ReviewsSkeleton,
  SettingsSkeleton,
  SupportSkeleton,
} from "@/components/shared/pageSkeletons";

const wrap = (el: ReactNode) => el;

export const router = createBrowserRouter([
  {
    // one frame for all three sign-in screens: it stays put while the form swaps
    element: <AuthLayout />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "/login", element: <Login /> },
          { path: "/forgot-password", element: <ForgotPassword /> },
        ],
      },
      { path: "/reset-password", element: <ResetPassword /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <HomeGate>{L(() => import("@/pages/dashboard/Dashboard"), <DashboardSkeleton />)}</HomeGate> },
          { path: "orders", element: <Guard needs={["orders.view"]}>{L(() => import("@/pages/orders/OrdersList"), <OrdersSkeleton />)}</Guard> },
          { path: "orders/new", element: <Guard needs={["orders.manage"]}>{L(() => import("@/pages/orders/OrderCreate"), <PosSkeleton />)}</Guard> },
          { path: "orders/:id", element: <Guard needs={["orders.view"]}>{L(() => import("@/pages/orders/OrderDetail"), <DetailPageSkeleton />)}</Guard> },
          { path: "products", element: <Guard needs={["products.view"]}>{L(() => import("@/pages/products/ProductsList"), <ProductsSkeleton />)}</Guard> },
          { path: "products/new", element: <Guard needs={["products.manage"]}>{L(() => import("@/pages/products/ProductEditor"), <ProductEditorSkeleton isNew />)}</Guard> },
          { path: "products/:id/edit", element: <Guard needs={["products.view"]}>{L(() => import("@/pages/products/ProductEditor"), <ProductEditorSkeleton />)}</Guard> },
          { path: "inventory", element: <Guard needs={["inventory.manage","products.view"]}>{L(() => import("@/pages/inventory/Inventory"), <InventorySkeleton />)}</Guard> },
          { path: "categories", element: <Guard needs={["products.view"]}>{L(() => import("@/pages/catalog/Categories"), <CardListSkeleton title="Categories" text="Drag to change the order shown on the website." action="New category" />)}</Guard> },
          { path: "units", element: <Guard needs={["products.view"]}>{L(() => import("@/pages/catalog/Units"), <CardListSkeleton title="Units" text="How products are sold: kg, piece, packet… Add any unit you need." action="New unit" />)}</Guard> },
          { path: "daily-sheet", element: <Guard needs={["inventory.manage","products.manage"]}>{L(() => import("@/pages/products/DailySheet"), <ProductsSkeleton />)}</Guard> },
          { path: "brands", element: <Guard needs={["products.view"]}>{L(() => import("@/pages/catalog/Brands"), <CardListSkeleton title="Brands" text="Drag to change the order shown on the website." action="New brand" />)}</Guard> },
          { path: "banners", element: <Guard adminOnly>{L(() => import("@/pages/catalog/Banners"), <CardListSkeleton title="Banners" text="Home page sliders and promotions. Drag inside a group to change the order." action="New banner" />)}</Guard> },
          { path: "media", element: <Guard needs={["products.view","products.manage"]}>{L(() => import("@/pages/catalog/Media"), <GridPageSkeleton />)}</Guard> },
          { path: "customers", element: <Guard needs={["customers.view"]}>{L(() => import("@/pages/customers/CustomersList"), <CustomersSkeleton />)}</Guard> },
          { path: "customers/password-reset-requests", element: <Guard needs={["customers.view"]}>{L(() => import("@/pages/customers/PasswordResetRequests"), <CustomersSkeleton />)}</Guard> },
          { path: "customers/:id", element: <Guard needs={["customers.view"]}>{L(() => import("@/pages/customers/CustomerDetail"), <DetailPageSkeleton />)}</Guard> },
          { path: "coupons", element: <Guard adminOnly>{L(() => import("@/pages/coupons/Coupons"), <CouponsSkeleton />)}</Guard> },
          { path: "reviews", element: <Guard adminOnly>{L(() => import("@/pages/care/Reviews"), <ReviewsSkeleton />)}</Guard> },
          { path: "questions", element: <Guard adminOnly>{L(() => import("@/pages/care/Questions"), <QuestionsSkeleton />)}</Guard> },
          { path: "returns", element: <Guard needs={["orders.view"]}>{L(() => import("@/pages/care/Returns"), <ReturnsSkeleton />)}</Guard> },
          { path: "support", element: <Guard adminOnly>{L(() => import("@/pages/care/Support"), <SupportSkeleton />)}</Guard> },
          { path: "support/:id", element: <Guard adminOnly>{L(() => import("@/pages/care/SupportDetail"), <DetailPageSkeleton />)}</Guard> },
          { path: "contact", element: <Guard adminOnly>{L(() => import("@/pages/care/Contact"), <ContactSkeleton />)}</Guard> },
          { path: "newsletter", element: <Guard adminOnly>{L(() => import("@/pages/care/Newsletter"), <NewsletterSkeleton />)}</Guard> },
          { path: "back-in-stock", element: <Guard adminOnly>{L(() => import("@/pages/care/BackInStock"), <BackInStockSkeleton />)}</Guard> },
          { path: "reports", element: <Guard needs={["reports.view"]}>{L(() => import("@/pages/reports/Reports"), <ReportsSkeleton />)}</Guard> },
          { path: "settings", element: <Guard needs={["settings.manage"]}>{L(() => import("@/pages/settings/Settings"), <SettingsSkeleton />)}</Guard> },
          { path: "profile", element: L(() => import("@/pages/account/Profile"), <ProfileSkeleton />) },
          { path: "notifications", element: L(() => import("@/pages/logs/Notifications"), <FeedPageSkeleton />) },
          { path: "activity", element: <Guard needs={["logs.view"]}>{L(() => import("@/pages/logs/ActivityLog"), <ListPageSkeleton stats={4} actions={1} filters={3} cols={5} />)}</Guard> },
          { path: "audit", element: <Guard needs={["logs.view"]}>{L(() => import("@/pages/logs/AuditLog"), <ListPageSkeleton actions={1} filters={3} cols={5} />)}</Guard> },
          { path: "staff", element: <Guard needs={["staff.manage"]}>{L(() => import("@/pages/staff/StaffList"), <ListPageSkeleton cols={5} actions={1} filters={2} />)}</Guard> },
          { path: "deliveries", element: <Guard needs={["delivery.manage", "orders.assign"]}>{L(() => import("@/pages/deliveries/Deliveries"), <ListPageSkeleton cols={5} actions={1} filters={2} />)}</Guard> },
          { path: "my-deliveries", element: <Guard rider>{L(() => import("@/pages/deliveries/MyDeliveries"), <FeedPageSkeleton />)}</Guard> },
          { path: "*", element: wrap(<NotFound />) },
        ],
      },
    ],
  },
]);
