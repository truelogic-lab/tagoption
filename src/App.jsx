import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* Public pages */
import Home from "./pages/Home";
import OnlineTrading from "./pages/OnlineTrading";
import Markets from "./pages/Markets";
import Tools from "./pages/Tools";
import Company from "./pages/Company";
import HelpCenter from "./pages/HelpCenter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Responsible from "./pages/Responsible";
import LiveChat from "./pages/LiveChat";
import Auth from "./pages/Auth";

/* Authed app shell */
import RequireAuth from "./components/guards/RequireAuth";
import RequireAdmin from "./components/guards/RequireAdmin";
import AppLayout from "./components/app/AppLayout";
import ScrollToTop from "./components/layout/ScrollToTop";
import Trade from "./pages/app/Trade";
import Positions from "./pages/app/Positions";
import Account from "./pages/app/Account";
import Deposit from "./pages/app/Deposit";
import Withdraw from "./pages/app/Withdraw";
import History from "./pages/app/History";
import Refer from "./pages/app/Refer";
import PaymentCallback from "./pages/app/PaymentCallback";

/* Admin shell */
import AdminLayout from "./components/admin/AdminLayout";

/*
 * The admin page routes are wired one at a time as the rebuild lands.
 * Each uncommented route below corresponds to a page file that exists
 * in src/pages/admin/. If a page is missing, its route is commented
 * and /admin shows only the shell with an empty outlet.
 */
import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import UserDetail from "./pages/admin/UserDetail";
import Trades from "./pages/admin/Trades";
import Transactions from "./pages/admin/Transactions";
import AdminMarkets from "./pages/admin/Markets";
import Withdrawals from "./pages/admin/Withdrawals";
// import Config from "./pages/admin/Config";
// import AdminSettings from "./pages/admin/Settings";
// import Audit from "./pages/admin/Audit";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/online-trading" element={<OnlineTrading />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/company" element={<Company />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/responsible" element={<Responsible />} />
        <Route path="/live-chat" element={<LiveChat />} />
        <Route path="/auth" element={<Auth />} />

        {/* ---------- Admin shell ---------- */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="trades" element={<Trades />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="markets" element={<AdminMarkets />} />
        </Route>

        {/* ---------- Authed app ---------- */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/trade" element={<Trade />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/account" element={<Account />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/history" element={<History />} />
          <Route path="/refer" element={<Refer />} />
          <Route path="/payments/callback" element={<PaymentCallback />} />
        </Route>

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
