import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNotification } from "../context/NotificationContext";
import SignInPage from '../pages/SignInPage';
import SelectRolePage from '../pages/SelectRolePage';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Demandeur from "../pages/Demandeur";
import AdminDemande from "../pages/AdminDemande";
import AdminDashboard from "../pages/AdminDashboard";
import AdminEntite from "../pages/AdminEntite";
import AdminLaissezPasser from "../pages/AdminLaissezPasser";
import DemandeurDemande from "../pages/DemandeurDemande";
import DemandeurDashboard from "../pages/DemandeurDashboard";
import DirecteurDemande from "../pages/DirecteurDemande";
import DirecteurLaissezPasser from "../pages/DirecteurLaissezPasser";
import CorrespondantDemande from "../pages/CorrespondantDemande";
import CorrespondantLaissezPasser from "../pages/CorrespondantLaissezPasser";
import DemandeurDetails from "../pages/DemandeurDetails";
import DirecteurValidation from "../pages/DirecteurValidation";
import CorrespondantValidation from "../pages/CorrespondantValidation";
import AdminDemandeDetails from "../pages/AdminDemandeDetails";
import AdminLaissezPasserDetails from "../pages/AdminLaissezPasserDetails";
import CorrespondantLaissezPasserDetails from "../pages/CorrespondantLaissezPasserDetails";
import DirecteurLaissezPasserDetails from "../pages/DirecteurLaissezPasserDetails";
import DemandeurLaissezPasser from "../pages/DemandeurLaissezPasser";
import EditDemande from "../pages/EditDemande";
import CreateDemande from "../pages/CreateDemande";

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useAuthContext();

    if (!user) return <Navigate to="/signin" />;

    // Allow if user has the required role in their roles array
    if (requiredRole && !user.roles.includes(requiredRole)) {
        return <Navigate to="/signin" />;
    }

    return (
        <>
            <Navbar />
            {children}
        </>

    );
};

const AdminLayout = ({ children }) => (
    <ProtectedRoute requiredRole="ADMIN">
        {children}
    </ProtectedRoute>
);

const AdminEntiteLayout = ({ children }) => (
    <ProtectedRoute requiredRole="ADMIN_ENTITE">
        {children}
    </ProtectedRoute>
);

const AdminFonctionnelLayout = ({ children }) => (
    <ProtectedRoute requiredRole="ADMIN_FONCTIONNEL">
        {children}
    </ProtectedRoute>
);

const DemandeurLayout = ({ children }) => {

    const { addNotification } = useNotification();
    const hasRun = useRef(false);

    useEffect(() => {

        if (hasRun.current) return;
        hasRun.current = true;

        const checkExpirations = async () => {
            try {

                const token = localStorage.getItem("token");
                if (!token) return;

                const decoded = jwtDecode(token);
                const userId = decoded.sub;

                const res = await axios.get(
                    "http://localhost:8080/api/laissezpasser",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = res.data;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const shown = new Set();

                data
                    .filter(lp => lp.userId === userId) // ✅ ONLY CURRENT USER
                    .forEach(lp => {

                        if (!lp.dateExpiration) return;

                        // ✅ SAFE DATE PARSING (FIXED)
                        const [y, m, d] = lp.dateExpiration.split("-");
                        const expDate = new Date(y, m - 1, d);

                        const diffDays = Math.ceil(
                            (expDate - today) / (1000 * 60 * 60 * 24)
                        );

                        const label = lp.numLaissezPasser || lp.id;

                        const key =
                            lp.id + (diffDays <= 0 ? "-expired" : "-expiring");

                        if (shown.has(key)) return;
                        shown.add(key);

                        // ================= EXPIRED =================
                        if (diffDays <= 0) {
                            addNotification(
                                `❌ LP ${label} est expiré (${lp.dateExpiration})`,
                                "error"
                            );
                        }

                        // ================= EXPIRING =================
                        else if (diffDays <= 30) {
                            addNotification(
                                `⚠️ LP ${label} expire dans ${diffDays} jour(s)`,
                                "info"
                            );
                        }
                    });

            } catch (err) {
                console.error("Expiration check failed:", err);
            }
        };

        // run once immediately
        checkExpirations();

        // refresh every 6 hours
        const interval = setInterval(checkExpirations, 6 * 60 * 60 * 1000);

        return () => clearInterval(interval);

    }, []);

    return (
        <ProtectedRoute requiredRole="DEMANDEUR">
            {children}
        </ProtectedRoute>
    );
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/select-role" element={<SelectRolePage />} />

            {/* Demandeur */}
            <Route path="/demandeur" element={
                <DemandeurLayout>
                    <Demandeur />
                </DemandeurLayout>
            } />
            <Route path="/demandeur/demande" element={
                <DemandeurLayout>
                    <DemandeurDemande />
                </DemandeurLayout>
            } />
            <Route path="/demandeur/dashboard" element={
                <DemandeurLayout>
                    <DemandeurDashboard />
                </DemandeurLayout>
            } />
            <Route path="/demande/:id" element={
                <DemandeurLayout>
                    <DemandeurDetails />
                </DemandeurLayout>
            } />
            <Route path="/demande/laissez-passer/:id" element={
                <DemandeurLayout>
                    <DemandeurLaissezPasser />
                </DemandeurLayout>
            } />
            <Route path="/demande/edit/:id" element={
                <DemandeurLayout>
                    <EditDemande />
                </DemandeurLayout>
            } />
            <Route path="/demande/new" element={
                <DemandeurLayout>
                    <CreateDemande />
                </DemandeurLayout>
            } />

            {/* Admin Entité — all pages show ADMIN_ENTITE in navbar */}
            <Route path="/directeur/demandes" element={
                <AdminEntiteLayout>
                    <DirecteurDemande />
                </AdminEntiteLayout>
            } />
            <Route path="/directeur/demande/:id" element={
                <AdminEntiteLayout>
                    <DirecteurValidation />
                </AdminEntiteLayout>
            } />
            <Route path="/directeur/laissez-passer" element={
                <AdminEntiteLayout>
                    <DirecteurLaissezPasser />
                </AdminEntiteLayout>
            } />
            <Route path="/directeur/laissez-passer/:id" element={
                <AdminEntiteLayout>
                    <DirecteurLaissezPasserDetails />
                </AdminEntiteLayout>
            } />

            {/* Admin Fonctionnel — all pages show ADMIN_FONCTIONNEL in navbar */}
            <Route path="/correspondantdesurete/demandes" element={
                <AdminFonctionnelLayout>
                    <CorrespondantDemande />
                </AdminFonctionnelLayout>
            } />
            <Route path="/correspondantdesurete/laissez-passer" element={
                <AdminFonctionnelLayout>
                    <CorrespondantLaissezPasser />
                </AdminFonctionnelLayout>
            } />
            <Route path="/correspondantdesurete/laissez-passer/:id" element={
                <AdminFonctionnelLayout>
                    <CorrespondantLaissezPasserDetails />
                </AdminFonctionnelLayout>
            } />
            <Route path="/correspondantdesurete/demande/:id" element={
                <AdminFonctionnelLayout>
                    <CorrespondantValidation />
                </AdminFonctionnelLayout>
            } />

            {/* Admin — all pages show ADMIN in navbar */}
            <Route path="/admin/demandes" element={
                <AdminLayout>
                    <AdminDemande></AdminDemande>
                </AdminLayout>
            } />
            <Route path="/admin/demandes/:id" element={
                <AdminLayout>
                    <AdminDemandeDetails />
                </AdminLayout>
            } />
            <Route path="/admin/laissez-passer" element={
                <AdminLayout>
                    <AdminLaissezPasser></AdminLaissezPasser>
                </AdminLayout>
            } />
            <Route path="/admin/laissez-passer/:id" element={
                <AdminLayout>
                    <AdminLaissezPasserDetails />
                </AdminLayout>
            } />
            <Route path="/admin/entites" element={
                <AdminLayout>
                    <AdminEntite></AdminEntite>
                </AdminLayout>
            } />
            <Route path="/admin/users" element={
                <AdminLayout>
                    <AdminDashboard></AdminDashboard>
                </AdminLayout>
            } />

            <Route path="*" element={<Navigate to="/signin" />} />
        </Routes>
    );
};

export default AppRoutes;