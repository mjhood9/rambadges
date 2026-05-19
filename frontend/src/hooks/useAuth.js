import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../api/authApi';
import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuthContext();
    const navigate = useNavigate();

    const handleSignIn = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await signIn(data);

            // Keycloak returns access_token
            const token = response.data.access_token;

            // decode token to get user info
            const payload = JSON.parse(atob(token.split('.')[1]));

            const userData = {
                email: payload.email,
                fullName: payload.name,
                username: payload.preferred_username,
                roles: payload.realm_access?.roles?.filter(r =>
                    ['DEMANDEUR', 'ADMIN_ENTITE', 'ADMIN_FONCTIONNEL', 'ADMIN'].includes(r)
                ) || []
            };

            login(userData, token);

            const roles = userData.roles;
            if (roles.length === 1) {
                userData.currentRole = roles[0];
                redirectByRole(roles[0], navigate);
            } else {
                navigate('/select-role');
            }
        } catch (err) {
            if (err.response?.data?.error_description) {
                setError(err.response.data.error_description);
            } else {
                setError('Email ou mot de passe incorrect');
            }
        } finally {
            setLoading(false);
        }
    };

    return { handleSignIn, loading, error };
};

export const redirectByRole = (role, navigate) => {
    switch (role) {
        case 'DEMANDEUR':
            navigate('/demandeur');
            break;
        case 'ADMIN_ENTITE':
            navigate('/directeur/demandes');
            break;
        case 'ADMIN_FONCTIONNEL':
            navigate('/correspondantdesurete/demandes');
            break;
        case 'ADMIN':
            navigate('/admin/demandes');
            break;
        default:
            navigate('/dashboard');
    }
};