import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { redirectByRole } from '../hooks/useAuth';
import ramLogo from '../assets/img/ramlogo.png';
import oneworldLogo from '../assets/img/oneworld.png';
import '../assets/styles/SelectRolePage.css';
import {Helmet} from "react-helmet-async";

const roleLabels = {
    DEMANDEUR: 'Demandeur',
    ADMIN_ENTITE: "Directeur",
    ADMIN_FONCTIONNEL: 'Correspondant de Sûreté',
    ADMIN: 'Admin'
};

const roleIcons = {
    DEMANDEUR: 'bx bx-user',
    ADMIN_ENTITE: 'bx bx-building',
    ADMIN_FONCTIONNEL: 'bx bx-cog',
    ADMIN: 'bx bx-shield'
};

const SelectRolePage = () => {
    const { user, setCurrentRole } = useAuthContext();
    const navigate = useNavigate();

    if (!user) {
        navigate('/signin');
        return null;
    }
    const handleRoleSelect = (role) => {
        setCurrentRole(role);
        redirectByRole(role, navigate);
    };
    return (
        <>
            <Helmet>
                <title>Bienvenue Au RAM Badges</title>
            </Helmet>
        <div className="select-role-page ">

            {/* Logo top left */}
            <div className="select-role-logo mx-4">
                <img src={ramLogo} alt="Royal Air Maroc" className="ram-logo-img"/>
                <img src={oneworldLogo} alt="OneWorld" className="oneworld-logo-img"/>
            </div>

            <div className="select-role-card">
                <h2 className="select-role-title">Bienvenue, {user.fullName}</h2>
                <p className="select-role-subtitle">Choisissez votre espace</p>

                <div className="roles-grid">
                    {user.roles.map((role) => (
                        <button
                            key={role}
                            className="role-card"
                            onClick={() => handleRoleSelect(role)}
                        >
                            <i className={roleIcons[role]}></i>
                            <span>{roleLabels[role]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
            </>
    );
};

export default SelectRolePage;