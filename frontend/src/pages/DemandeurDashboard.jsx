import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../assets/styles/main.css";

const DemandeurDashboard = () => {
    const [demandes, setDemandes] = useState([]);
    const [laissezPasserMap, setLaissezPasserMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("demandes");

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    let userId = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);
            userId = Number(decoded.sub || decoded.userId || decoded.id);
        } catch (err) {
            console.error("Invalid token", err);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. DEMANDES
                const res = await axios.get(
                    "http://localhost:8080/api/demandes",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const userDemandes = res.data.filter(
                    (d) => Number(d.userId) === Number(userId)
                );

                setDemandes(userDemandes);

                // 2. LAISSEZ PASSER
                const lpRequests = userDemandes.map((d) =>
                    axios.get(`http://localhost:8080/api/laissezpasser`, {
                        params: { demandeId: d.id },
                        headers: { Authorization: `Bearer ${token}` }
                    })
                        .then(res => ({ id: d.id, data: res.data }))
                        .catch(() => ({ id: d.id, data: null }))
                );

                const lpResults = await Promise.all(lpRequests);

                const lpMap = {};
                lpResults.forEach((r) => {
                    lpMap[r.id] = Array.isArray(r.data) ? r.data[0] : r.data;
                });

                setLaissezPasserMap(lpMap);

            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement");
            } finally {
                setLoading(false);
            }
        };

        if (token && userId) fetchData();
        else {
            setError("Utilisateur non authentifié");
            setLoading(false);
        }
    }, [token, userId]);

    if (loading)
        return (
            <div className="circle-loader-container">
                <div className="circle-loader"></div>
                <p>Chargement...</p>
            </div>
        );
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    const getStatusBadge = (status) => {
        switch (status) {
            case "EN_ATTENTE":
                return <span className="badge-attent">En attente</span>;
            case "APPROUVEE":
                return <span className="badge-approve">Validé</span>;
            case "REJETEE":
                return <span className="badge-reject">Refusé</span>;
            case "ACTIF":
                return <span className="badge-approve">Actif</span>;
            case "EXPIRE":
                return <span className="badge-attent">Expiré</span>;
            case "ANNULE":
                return <span className="badge-reject">Annulé</span>;
            default:
                return <span>-</span>;
        }
    };

    return (
        <>
            <Helmet>
                <title>RAM Badges | Dashboard</title>
            </Helmet>

            <div className="background">
                <div className="overlay">
                    <div className="container">

                        {/* ✅ TOP BAR WITH TABS */}
                        <div className="entite-top-bar">
                            <div className="entite-tabs">
                                <div
                                    className="tab-slider"
                                    style={{
                                        transform:
                                            activeTab === "demandes"
                                                ? "translateX(0%)"
                                                : "translateX(100%)",
                                    }}
                                ></div>

                                <button
                                    className={`tab-btn ${activeTab === "demandes" ? "active" : ""}`}
                                    onClick={() => setActiveTab("demandes")}
                                >
                                    Mes Demandes
                                </button>

                                <button
                                    className={`tab-btn ${activeTab === "laissezpasser" ? "active" : ""}`}
                                    onClick={() => setActiveTab("laissezpasser")}
                                >
                                    Mes Laissez-Passer
                                </button>
                            </div>
                        </div>

                        {/* ================= TABLE SWITCH ================= */}

                        {activeTab === "demandes" ? (
                            <table className="demande-table">
                                <thead>
                                <tr>
                                    <th>N°</th>
                                    <th>Date</th>
                                    <th>Portes</th>
                                    <th>Zones</th>
                                    <th>Secteurs</th>
                                    <th>Status</th>
                                    <th>Détails</th>
                                </tr>
                                </thead>

                                <tbody>
                                {demandes.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center" }}>
                                            Aucune demande
                                        </td>
                                    </tr>
                                ) : (
                                    demandes.map((d) => (
                                        <tr key={d.id}>
                                            <td>{d.id}</td>
                                            <td>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
                                            <td>{d.portes?.join(", ") || "-"}</td>
                                            <td>{d.zones || "-"}</td>
                                            <td>{d.secteur?.join(", ") || "-"}</td>
                                            <td>{getStatusBadge(d.status)}</td>
                                            <td>
                                                <div
                                                    className="detail-btn"
                                                    onClick={() => navigate(`/demande/${d.id}`)}
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="demande-table">
                                <thead>
                                <tr>
                                    <th>N° LP</th>
                                    <th>Date Dépôt</th>
                                    <th>Date Délivrance</th>
                                    <th>Date Expiration</th>
                                    <th>Statut</th>
                                    <th>Détails</th>
                                </tr>
                                </thead>

                                <tbody>
                                {demandes.map((d) => {
                                    const lp = laissezPasserMap[d.id];

                                    return (
                                        <tr key={d.id}>
                                            <td>{lp?.numLaissezPasser || "-"}</td>
                                            <td>{lp?.dateDepotOnda ? new Date(lp.dateDepotOnda).toLocaleDateString("fr-FR") : "-"}</td>
                                            <td>{lp?.dateDelivrance ? new Date(lp.dateDelivrance).toLocaleDateString("fr-FR") : "-"}</td>
                                            <td>{lp?.dateExpiration ? new Date(lp.dateExpiration).toLocaleDateString("fr-FR") : "-"}</td>
                                            <td>{lp?.statut ? getStatusBadge(lp.statut) : "-"}</td>
                                            <td>
                                                <div
                                                    className="detail-btn"
                                                    onClick={() =>
                                                        navigate(`/demande/laissez-passer/${lp.id}`)
                                                    }
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
};

export default DemandeurDashboard;