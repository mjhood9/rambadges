import axios from 'axios';

const KEYCLOAK_URL = 'http://localhost:8180/realms/ram-badges/protocol/openid-connect/token';
const CLIENT_ID = 'ram-badges-client';
const CLIENT_SECRET = 'NWztCfpP6eYIdD1eFltOxLPtgpxF2ghC';

export const signIn = async (data) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('username', data.email);
    params.append('password', data.password);

    const response = await axios.post(KEYCLOAK_URL, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response;
};

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

export default api;