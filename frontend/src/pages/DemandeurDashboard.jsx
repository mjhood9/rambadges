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

    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "none",
    });

    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    let currentUserId = null;

    let fullName = null;

    if (token) {
        try {

            const decoded = jwtDecode(token);

            currentUserId = decoded.sub;

            fullName =
                `${decoded.given_name || ""} ${decoded.family_name || ""}`.trim();

        } catch (err) {

            console.error("Invalid token", err);
        }
    }

    useEffect(() => {
        setSortConfig({ key: null, direction: "none" });
        const fetchData = async () => {

            try {

                setLoading(true);

                const token = localStorage.getItem("token");

                // =========================
                // FETCH DEMANDES
                // =========================
                const demandesRes = await axios.get(
                    "http://localhost:8080/api/demandes",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // ✅ FILTER DEMANDES BY FULL NAME
                const userDemandes = demandesRes.data.filter(
                    (d) =>
                        `${d.firstName} ${d.lastName}`.trim() === fullName
                );

                setDemandes(userDemandes);

                // =========================
                // FETCH LAISSEZ PASSER
                // =========================
                const lpRes = await axios.get(
                    "http://localhost:8080/api/laissezpasser",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // ✅ FILTER LP BY USER ID
                const userLP = (lpRes.data || []).filter(
                    (lp) => lp.userId === currentUserId
                );

                // =========================
                // BUILD MAP
                // =========================
                const lpMap = {};

                userLP.forEach((lp) => {

                    const key = lp.demandeId;

                    if (!key) return;

                    if (
                        !lpMap[key] ||
                        new Date(lp.createdAt || 0) >
                        new Date(lpMap[key].createdAt || 0)
                    ) {
                        lpMap[key] = lp;
                    }
                });

                setLaissezPasserMap(lpMap);

            } catch (err) {

                console.error(err);
                setError("Erreur lors du chargement");

            } finally {

                setLoading(false);
            }
        };

        if (token && currentUserId && fullName) {

            fetchData();

        } else {

            setError("Utilisateur non authentifié");
            setLoading(false);
        }

    }, [token, currentUserId, fullName]);

    const sortData = (data) => {
        const { key, direction } = sortConfig;

        if (!key || direction === "none") return data;

        return [...data].sort((a, b) => {
            let valA, valB;

            switch (key) {
                case "id":
                    valA = Number(a.id || 0);
                    valB = Number(b.id || 0);
                    break;

                case "date":
                    valA = new Date(a.createdAt || 0);
                    valB = new Date(b.createdAt || 0);
                    break;

                case "dateDepot":
                    valA = new Date(a.dateDepotOnda || 0);
                    valB = new Date(b.dateDepotOnda || 0);
                    break;

                case "dateDelivrance":
                    valA = new Date(a.dateDelivrance || 0);
                    valB = new Date(b.dateDelivrance || 0);
                    break;

                case "dateExpiration":
                    valA = new Date(a.dateExpiration || 0);
                    valB = new Date(b.dateExpiration || 0);
                    break;

                default:
                    valA = "";
                    valB = "";
            }

            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
        });
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key !== key
                    ? "asc"
                    : prev.direction === "asc"
                        ? "desc"
                        : prev.direction === "desc"
                            ? "none"
                            : "asc",
        }));
    };

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

    const getSortIcon = (key) => {
        if (sortConfig.key !== key || sortConfig.direction === "none") {
            return <i className="bx bx-equalizer" />;
        }

        if (sortConfig.direction === "asc") {
            return <i className="bx bx-up-arrow-alt" />;
        }

        return <i className="bx bx-down-arrow-alt" />;
    };

    const SortableTh = ({ label, sortKey }) => (
        <th
            onClick={() => handleSort(sortKey)}
            style={{ cursor: "pointer", userSelect: "none" }}
        >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {label}
            {getSortIcon(sortKey)}
        </span>
        </th>
    );

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
                                    <SortableTh label="N°" sortKey="id" />
                                    <SortableTh label="Date" sortKey="date" />
                                    <th>Portes</th>
                                    <th>Zones</th>
                                    <th>Secteurs</th>
                                    <th>Statut</th>
                                    <th>Détails</th>
                                </tr>
                                </thead>

                                <tbody>
                                {demandes.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: '30px', color: '#888', fontStyle: 'italic' }}>
                                            Aucune demande trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    sortData(demandes).map((d) => (
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
                                    <SortableTh label="N° LP" sortKey="id" />
                                    <SortableTh label="Date Dépôt" sortKey="dateDepot" />
                                    <SortableTh label="Date Délivrance" sortKey="dateDelivrance" />
                                    <SortableTh label="Date Expiration" sortKey="dateExpiration" />
                                    <th>Statut</th>
                                    <th>Détails</th>
                                </tr>
                                </thead>

                                <tbody>
                                {demandes.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: '#888', fontStyle: 'italic' }}>
                                            Aucune demande trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    sortData(Object.values(laissezPasserMap)).map((lp) => (
                                        <tr key={lp.id}>
                                            <td>{lp.numLaissezPasser || "-"}</td>
                                            <td>{lp.dateDepotOnda ? new Date(lp.dateDepotOnda).toLocaleDateString("fr-FR") : "-"}</td>
                                            <td>{lp.dateDelivrance ? new Date(lp.dateDelivrance).toLocaleDateString("fr-FR") : "-"}</td>
                                            <td>{lp.dateExpiration ? new Date(lp.dateExpiration).toLocaleDateString("fr-FR") : "-"}</td>
                                            <td>{lp.statut ? getStatusBadge(lp.statut) : "-"}</td>
                                            <td>
                                                <div
                                                    className="detail-btn"
                                                    onClick={() => navigate(`/demande/laissez-passer/${lp.id}`)}
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
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