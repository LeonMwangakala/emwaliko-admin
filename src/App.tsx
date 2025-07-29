import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import EventTypes from "./pages/Settings/EventTypes";
import CardTypes from "./pages/Settings/CardTypes";
import CardClasses from "./pages/Settings/CardClasses";
import Packages from "./pages/Settings/Packages";
import Customers from "./pages/Settings/Customers";
import Events from "./pages/Events";
import ViewEvent from "./pages/ViewEvent";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AutoLogoutModal from "./components/auth/AutoLogoutModal";
import GeneralSettings from "./pages/Settings/General";
import PaymentSettings from "./pages/Settings/PaymentSettings";
import Users from "./pages/Users";
import Reports from "./pages/Reports";

function AppRoutes() {
  const { logout, showAutoLogoutModal, onStayLoggedIn } = useAuth();

  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Layout - Landing Page (No Auth Required) */}
          <Route path="/" element={
            <ProtectedRoute requireAuth={false}>
              <SignIn />
            </ProtectedRoute>
          } />
          <Route path="/signin" element={
            <ProtectedRoute requireAuth={false}>
              <SignIn />
            </ProtectedRoute>
          } />
          <Route path="/signup" element={
            <ProtectedRoute requireAuth={false}>
              <SignUp />
            </ProtectedRoute>
          } />

          {/* Dashboard Layout (Auth Required) */}
          <Route element={
            <ProtectedRoute requireAuth={true}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Home />} />

            {/* Events */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<ViewEvent />} />

            {/* Sales */}
            <Route path="/sales" element={<Sales />} />

            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />

            {/* Users */}
            <Route path="/users" element={<Users />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

            {/* Settings */}
            <Route path="/settings/profile" element={<UserProfiles />} />
            <Route path="/settings/event-types" element={<EventTypes />} />
            <Route path="/settings/card-types" element={<CardTypes />} />
            <Route path="/settings/card-classes" element={<CardClasses />} />
            <Route path="/settings/packages" element={<Packages />} />
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/settings/payment" element={<PaymentSettings />} />

            {/* Customers */}
            <Route path="/customers" element={<Customers />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>

      {/* Auto Logout Modal */}
      <AutoLogoutModal
        isOpen={showAutoLogoutModal}
        onStayLoggedIn={onStayLoggedIn}
        onLogout={logout}
        timeRemaining={60}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppRoutes />
      </ProfileProvider>
    </AuthProvider>
  );
}
