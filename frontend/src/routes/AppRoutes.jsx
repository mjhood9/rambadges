import { Routes, Route, Navigate } from 'react-router-dom';
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

const DemandeurLayout = ({ children }) => (
    <ProtectedRoute requiredRole="DEMANDEUR">
        {children}
    </ProtectedRoute>
);

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