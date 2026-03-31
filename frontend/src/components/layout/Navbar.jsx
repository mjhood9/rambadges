import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import ramLogo from '../../assets/img/ramlogo.png';
import oneworldLogo from '../../assets/img/oneworld.png';
import { redirectByRole } from '../../hooks/useAuth';
import '../../assets/styles/Navbar.css';

const roleLabels = {
    DEMANDEUR: 'Demandeur',
    ADMIN_ENTITE: 'Directeur',
    ADMIN_FONCTIONNEL: 'Correspondant de Sûreté',
    ADMIN: 'Admin'
};

const NavbarCenter = ({ role }) => {

    switch (role) {
        case 'DEMANDEUR':
            return <div className="navbar-center"></div>;

        case 'ADMIN_ENTITE':
            return (
                <div className="navbar-center">
                    <NavLink to="/directeur/demandes" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-list-ul'></i>
                        Les Demandes
                    </NavLink>
                    <NavLink to="/directeur/laissez-passer" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-badge-check'></i>
                        Laissez passer
                    </NavLink>
                </div>
            );

        case 'ADMIN_FONCTIONNEL':
            return (
                <div className="navbar-center">
                    <NavLink to="/correspondantdesurete/demandes" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-list-ul'></i>
                        Les Demandes
                    </NavLink>
                    <NavLink to="/correspondantdesurete/laissez-passer" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-badge-check'></i>
                        Laissez passer
                    </NavLink>
                </div>
            );

        case 'ADMIN':
            return (
                <div className="navbar-center">
                    <NavLink to="/admin/demandes" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-list-ul'></i>
                        Les Demandes
                    </NavLink>
                    <NavLink to="/admin/laissez-passer" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-badge-check'></i>
                        Laissez passer
                    </NavLink>
                    <NavLink to="/admin/entites" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-buildings'></i>
                        Entités
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `navbar-btn ${isActive ? 'active' : ''}`}>
                        <i className='bx bx-group'></i>
                        Admin
                    </NavLink>
                </div>
            );

        default:
            return null;
    }
};

const Navbar = () => {
    const { user, logout, setCurrentRole } = useAuthContext();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    const hasMultipleRoles = user?.roles?.length > 1;
    const currentRole = user?.currentRole || user?.roles?.[0];

    const handleRoleSelect = (role) => {
        setDropdownOpen(false);
        setCurrentRole(role);
        redirectByRole(role, navigate);
    };

    return (
        <nav className="navbar-ram">
            <div className="navbar-logo">
                <img src={ramLogo} alt="Royal Air Maroc" className="navbar-ram-img"/>
            </div>

            <img src={oneworldLogo} alt="OneWorld" className="navbar-oneworld-img"/>

            {/* Dynamic navbar center based on current role */}
            <NavbarCenter role={currentRole} />

            <div className="navbar-right">
                <div className="navbar-user-control">
                    <div className="navbar-user">
                        <span className="navbar-user-name">{user?.fullName}</span>

                        {/* Single role — no dropdown */}
                        {!hasMultipleRoles && (
                            <span className="navbar-user-role fw-bolder">
                                {roleLabels[currentRole]}
                            </span>
                        )}

                        {/* Multiple roles — show dropdown */}
                        {hasMultipleRoles && (
                            <div className="navbar-role-dropdown">
                                <button
                                    className="navbar-user-role clickable fw-bolder"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    {roleLabels[currentRole]}
                                    <i
                                        className={`bx ${dropdownOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`}
                                        style={{ color: '#c20831' }}
                                    ></i>
                                </button>

                                {dropdownOpen && (
                                    <div className="navbar-dropdown-menu">
                                        {user.roles.map((role) => (
                                            <button
                                                key={role}
                                                className={`navbar-dropdown-item ${role === currentRole ? 'active' : ''}`}
                                                onClick={() => handleRoleSelect(role)}
                                            >
                                                {roleLabels[role]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button className="navbar-logout" onClick={handleLogout}>
                        <i className='bx bx-log-out'></i>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;