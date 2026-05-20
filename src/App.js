import React from "react";
import "@/App.css";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

import Landing from "@/pages/Landing";
import About from "@/pages/About";
import Login from "@/pages/Login";
import UserLayout from "@/layouts/UserLayout";
import VendorLayout from "@/layouts/VendorLayout";
import UserDashboard from "@/pages/user/Dashboard";
import Holdings from "@/pages/user/Holdings";
import Trade from "@/pages/user/Trade";
import Physical from "@/pages/user/Physical";
import Transactions from "@/pages/user/Transactions";
import Profile from "@/pages/user/Profile";
import VendorDashboard from "@/pages/vendor/Dashboard";
import VendorBranches from "@/pages/vendor/Branches";
import VendorTransactions from "@/pages/vendor/Transactions";
import VendorProfile from "@/pages/vendor/Profile";

function PrivateRoute({ role, children }) {
    const { user, ready } = useAuth();
    if (!ready) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) {
        return (
            <Navigate
                to={user.role === "VENDOR" ? "/vendor" : "/app"}
                replace
            />
        );
    }
    return children;
}

function RootRedirect() {
    const { user, ready } = useAuth();
    if (!ready) return null;
    if (!user) return <Navigate to="/login" replace />;
    return (
        <Navigate
            to={user.role === "VENDOR" ? "/vendor" : "/app"}
            replace
        />
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Toaster
                        position="top-right"
                        richColors
                        closeButton
                    />
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/app"
                            element={
                                <PrivateRoute role="USER">
                                    <UserLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<UserDashboard />} />
                            <Route path="holdings" element={<Holdings />} />
                            <Route path="trade" element={<Trade />} />
                            <Route path="physical" element={<Physical />} />
                            <Route
                                path="transactions"
                                element={<Transactions />}
                            />
                            <Route path="profile" element={<Profile />} />
                        </Route>

                        <Route
                            path="/vendor"
                            element={
                                <PrivateRoute role="VENDOR">
                                    <VendorLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<VendorDashboard />} />
                            <Route
                                path="branches"
                                element={<VendorBranches />}
                            />
                            <Route
                                path="transactions"
                                element={<VendorTransactions />}
                            />
                            <Route
                                path="profile"
                                element={<VendorProfile />}
                            />
                        </Route>

                        <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                        />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
