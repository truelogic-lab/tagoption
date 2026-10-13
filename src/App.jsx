import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Public
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

// Guard + app shell
import RequireAuth from "./components/guards/RequireAuth";
import AppLayout from "./components/app/AppLayout";
import Trade from "./pages/app/Trade";
import Positions from "./pages/app/Positions";
import Account from "./pages/app/Account";
import Deposit from "./pages/app/Deposit";
import Withdraw from "./pages/app/Withdraw";
import History from "./pages/app/History";
import Refer from "./pages/app/Refer";
import PaymentCallback from "./pages/app/PaymentCallback";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
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

        {/* Authed app */}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
