import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../assets/styles/main.css";

const DemandeurDashboard = () => {
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // ✅ decode safely ONCE
    let userId = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);

            console.log("Decoded JWT:", decoded);
            console.table(decoded);

            // 🔥 IMPORTANT: convert to number
            userId = Number(decoded.sub || decoded.userId || decoded.id);
        } catch (err) {
            console.error("Invalid token", err);
        }
    }

    useEffect(() => {
        const fetchDemandes = async () => {
            try {
                setLoading(true);

                const response = await axios.get(
                    "http://localhost:8080/api/demandes",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const allDemandes = response.data;

                console.log("All demandes:", allDemandes);
                console.log("UserId:", userId);

                // ✅ FIX: type-safe comparison
                const userDemandes = allDemandes.filter(
                    (d) => Number(d.userId) === Number(userId)
                );

                console.log("Filtered demandes:", userDemandes);

                setDemandes(userDemandes);
            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement des demandes");
            } finally {
                setLoading(false);
            }
        };

        if (token && userId) {
            fetchDemandes();
        } else {
            setError("Utilisateur non authentifié");
            setLoading(false);
        }
    }, [token, userId]);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    const getStatusBadge = (status) => {
        switch (status) {
            case "EN_ATTENTE":
                return <span className="badge-attent">En attente</span>;

            case "APPROUVEE":
                return <span className="badge-approve">Validé</span>;

            case "REJETEE":
                return <span className="badge-reject">Refusé</span>;
        }
    };

    return (
        <>
            <Helmet>
                <title>RAM Badges | Demandeur Dashboard</title>
            </Helmet>

            <div className="background">
                <div className="overlay">
                    <div className="container">

                        <table className="demande-table">
                            <thead>
                            <tr>
                                <th>N° de demande</th>
                                <th>Date demande</th>
                                <th>Porte d'accès</th>
                                <th>Zone d'accès</th>
                                <th>Secteurs de sûreté</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Détails</th>
                            </tr>
                            </thead>

                            <tbody>
                            {demandes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center" }}>
                                        Aucune demande trouvée
                                    </td>
                                </tr>
                            ) : (
                                demandes.map((demande) => (
                                    <tr key={demande.id}>
                                        <td>{demande.id}</td>
                                        <td>
                                            {demande.createdAt
                                                ? new Date(demande.createdAt).toLocaleDateString('fr-FR')
                                                : "-"}
                                        </td>
                                        <td>{demande.portes?.join(", ") || "-"}</td>
                                        <td>{demande.zones || "-"}</td>
                                        <td>{demande.secteur?.join(", ") || "-"}</td>
                                        <td>{getStatusBadge(demande.status)}</td>
                                        <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end" }}> <div
                                            className="detail-btn"
                                            onClick={() => navigate(`/demande/${demande.id}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="fa-regular fa-eye"></i>
                                        </div> </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>
        </>
    );
};

export default DemandeurDashboard;