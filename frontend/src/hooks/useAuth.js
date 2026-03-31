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
            const { token, ...userData } = response.data;
            login(userData, token);

            const roles = userData.roles;

            if (roles.length === 1) {
                userData.currentRole = roles[0];
                redirectByRole(roles[0], navigate);
            } else {
                navigate('/select-role');
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (typeof err.response?.data === 'string') {
                setError(err.response.data);
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