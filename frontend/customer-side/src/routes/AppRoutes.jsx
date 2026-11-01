import { Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from '../components/layout/MainLayout';
import { CustomerLayout } from '../components/customer/CustomerLayout';
import { AuthLayout } from '../components/auth/AuthLayout';

import { Account } from '../pages/Account';
import { AccountProfile } from '../pages/AccountProfile';
import { AccountSettings } from '../pages/AccountSettings';
import { HelpCenter } from '../pages/HelpCenter';
import { SupportChat } from '../pages/SupportChat';
import { Disputes } from '../pages/Disputes';
import { TowingChat } from '../pages/TowingChat';
import { Vehicles } from '../pages/Vehicles';
import { Updates } from '../pages/Updates';
import { PickupLocation } from '../pages/PickupLocation';
import { SignIn } from '../pages/auth/SignIn';
import { SignUp } from '../pages/auth/SignUp';
import { VerifyPhone } from '../pages/auth/VerifyPhone';
import { Permissions } from '../pages/auth/Permissions';
import { SafetyProfile } from '../pages/auth/SafetyProfile';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { AppHome } from '../pages/AppHome';
import { ConfirmLocation } from '../pages/ConfirmLocation';
import { ConfirmRequest } from '../pages/ConfirmRequest';
import { History } from '../pages/History';
import { Home } from '../pages/Home';
import { ProviderProfile } from '../pages/ProviderProfile';
import { ProviderFilters } from '../pages/ProviderFilters';
import { NotFound } from '../pages/NotFound';
import { Providers } from '../pages/Providers';
import { RequestAssistance } from '../pages/RequestAssistance';
import { RequestDetails } from '../pages/RequestDetails';
import { RequestMatching } from '../pages/RequestMatching';
import { MechanicRoutes } from './MechanicRoutes';
import { TowingRequest } from '../pages/TowingRequest';
import { ActiveService } from '../pages/ActiveService';
import { ProviderChat } from '../pages/ProviderChat';
import { PolicyPage } from '../pages/PolicyPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="terms" element={<PolicyPage kind="terms" />} />
      <Route path="privacy" element={<PolicyPage kind="privacy" />} />
      <Route path="start" element={<Navigate to="/" replace />} />

      <Route path="/mechanic/*" element={<MechanicRoutes />} />

      <Route element={<AuthLayout />}>
        <Route path="login" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="register" element={<Navigate to="/signup" replace />} />
        <Route path="verify" element={<VerifyPhone />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="profile" element={<SafetyProfile />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route path="app" element={<AppHome />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="account" element={<Account />} />
        <Route path="account/:section" element={<AccountProfile />} />
        <Route path="settings/:section" element={<AccountSettings />} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="help/chat" element={<SupportChat />} />
        <Route path="help/disputes" element={<Disputes />} />
        <Route path="bookings/:bookingId/towing-chat" element={<TowingChat />} />
        <Route path="bookings/:bookingId/service" element={<ActiveService />} />
        <Route path="bookings/:bookingId/provider-chat" element={<ProviderChat />} />
        <Route path="updates" element={<Updates />} />
        <Route path="location" element={<PickupLocation />} />
        <Route path="history" element={<History />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="request" element={<RequestAssistance />} />
        <Route path="request/towing" element={<TowingRequest />} />
        <Route path="request/details" element={<RequestDetails />} />
        <Route path="request/matching" element={<RequestMatching />} />
        <Route path="confirm-location" element={<ConfirmLocation />} />
        <Route path="confirm-request" element={<ConfirmRequest />} />
        <Route path="providers" element={<Providers />} />
        <Route path="provider-filters" element={<ProviderFilters />} />
        <Route path="providers/:providerId" element={<ProviderProfile />} />
        <Route
          path="no-providers"
          element={<Navigate to="/providers" replace />}
        />
        <Route
          path="services"
          element={<Navigate to="/app" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
