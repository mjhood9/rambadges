import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "../assets/styles/main.css";
import CustomSelect from "../components/layout/CustomSelect";

const CorrespondantLaissezPasser = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [demandes, setDemandes] = useState([]);
    const [entites, setEntites] = useState([]);
    const [laissezPasserMap, setLaissezPasserMap] = useState({});

    const [isStatutOpen, setIsStatutOpen] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState("");
    const [isDirectionOpen, setIsDirectionOpen] = useState(false);

    const [perPageLaissezPasser, setPerPageLaissezPasser] = useState(5);
    const [currentLaissezPasser, setCurrentLaissezPasser] = useState(1);

    const [laissezPasserDateDelivranceFilter, setLaissezPasserDateDelivranceFilter] = useState("");
    const [laissezPasserDateExpirationFilter, setLaissezPasserDateExpirationFilter] = useState("");
    const [laissezPasserStatutFilter, setLaissezPasserStatutFilter] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);

            // 1. FETCH LP + ENTITES IN PARALLEL
            const [lpRes, entitesRes] = await Promise.all([
                axios.get("http://localhost:8080/api/laissezpasser", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:8080/api/entites", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // ✅ SET ENTITES
            setEntites(entitesRes.data || []);

            // 2. FILTER LP
            const lpData = Array.isArray(lpRes.data)
                ? lpRes.data.filter(lp => lp.dateDelivrance != null)
                : [];

            // 3. EXTRACT DEMANDE IDS
            const demandeIds = [...new Set(lpData.map(lp => lp.demandeId))];

            // 4. FETCH RELATED DEMANDES
            const demandesResponses = await Promise.all(
                demandeIds.map((id) =>
                    axios.get(`http://localhost:8080/api/demandes/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );

            // 5. BUILD DEMANDE MAP
            const demandesMap = {};
            demandesResponses.forEach((res) => {
                const d = res.data;
                demandesMap[d.id] = d;
            });

            // 6. BUILD FINAL LP ARRAY
            const lpArray = lpData.map((lp) => ({
                ...lp,
                demande: demandesMap[lp.demandeId] || null
            }));

            setDemandes(lpArray);

            // OPTIONAL MAP
            const lpMap = {};
            lpArray.forEach((lp) => {
                if (lp?.demandeId) {
                    lpMap[lp.demandeId] = lp;
                }
            });

            setLaissezPasserMap(lpMap);

        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ✅ FILTERS
    const filteredLaissezPasser = demandes.filter((lp) => {
        const demande = lp.demande;

        const fullName = demande
            ? `${demande.firstName || ""} ${demande.lastName || ""}`.toLowerCase()
            : "";

        const matchSearch = fullName.includes(search.toLowerCase());

        const matchDateDelivrance = laissezPasserDateDelivranceFilter
            ? lp.dateDelivrance &&
            new Date(lp.dateDelivrance).toISOString().split("T")[0] === laissezPasserDateDelivranceFilter
            : true;

        const matchDateExpiration = laissezPasserDateExpirationFilter
            ? lp.dateExpiration &&
            new Date(lp.dateExpiration).toISOString().split("T")[0] === laissezPasserDateExpirationFilter
            : true;

        const matchStatut = laissezPasserStatutFilter
            ? lp.statut === laissezPasserStatutFilter
            : true;
        const matchDirection = selectedDirection
            ? demande.direction === selectedDirection
            : true;

        return (
            matchSearch &&
            matchDateDelivrance &&
            matchDateExpiration &&
            matchStatut &&
            matchDirection
        );
    });

    // ✅ PAGINATION
    const totalPagesLaissezPasser = Math.ceil(filteredLaissezPasser.length / perPageLaissezPasser);

    const paginatedLaissezPasser = filteredLaissezPasser.slice(
        (currentLaissezPasser - 1) * perPageLaissezPasser,
        currentLaissezPasser * perPageLaissezPasser
    );

    const getPaginationRange = (current, total) => {
        const delta = 1;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
            range.push(i);
        }

        if (current - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (current + delta < total - 1) {
            rangeWithDots.push("...", total);
        } else if (total > 1) {
            rangeWithDots.push(total);
        }

        return rangeWithDots;
    };

    // ✅ STATUS BADGES
    const getStatusBadge = (status) => {
        switch (status) {
            case "EXPIRE":
                return <span className="badge-attent">Expiré</span>;
            case "ACTIF":
                return <span className="badge-approve">Actif</span>;
            case "ANNULE":
                return <span className="badge-reject">Annulé</span>;
            default:
                return <span>-</span>;
        }
    };

    if (loading)
        return (
            <div className="circle-loader-container">
                <div className="circle-loader"></div>
                <p>Chargement...</p>
            </div>
        );

    return (
        <>
            <Helmet>
                <title>Correspondant de Sûreté RAM Badges | Les Laissez-Passer</title>
            </Helmet>
            <div className="background">
                <div className="overlay">
                    <div className="container">

                        {/* TOP BAR */}
                        <div className="entite-top-bar">

                            {/* SEARCH */}
                            <div className="entite-search">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <i className='bx bx-search'></i>
                                </div>
                            </div>

                            {/* FILTERS */}
                            <div className="validation-filters" style={{ display: "flex", gap: "10px" }}>
                                {/* DIRECTION */}
                                <div className="select-wrap">
                                    <select
                                        onClick={() => setIsDirectionOpen(!isDirectionOpen)}
                                        onBlur={() => setIsDirectionOpen(false)}
                                        value={selectedDirection}
                                        onChange={(e) => setSelectedDirection(e.target.value)}
                                    >
                                        <option value="">Direction</option>
                                        {entites.map((e) => (
                                            <option key={e.id} value={e.name}>
                                                {e.name}
                                            </option>
                                        ))}
                                    </select>
                                    <i className={`bx bx-chevron-down select-arrow ${isDirectionOpen ? "open" : ""}`}></i>                                </div>
                                {/* DATE FILTER */}
                                <div style={{ position: "relative", width: "220px"}}>
                                    <input
                                        type="date"
                                        value={laissezPasserDateDelivranceFilter}
                                        onChange={(e) => setLaissezPasserDateDelivranceFilter(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 12px",
                                            borderRadius: "10px",
                                            border: laissezPasserDateDelivranceFilter ? "1.8px solid #674459" : "1.5px solid #ddd",
                                            backgroundColor: "#f6f6f6",
                                            fontSize: "14px",
                                            color: "#838383",
                                            outline: "none",
                                            transition: "all 0.25s ease",
                                            boxShadow: laissezPasserDateDelivranceFilter
                                                ? "0 4px 12px rgba(79, 70, 229, 0.15)"
                                                : "0 2px 6px rgba(0,0,0,0.05)",
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.border = "1.8px solid #674459";
                                            e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                        }}
                                        onBlur={(e) => {
                                            if (!laissezPasserDateDelivranceFilter) {
                                                e.target.style.border = "1.5px solid #ddd";
                                                e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
                                            }
                                        }}
                                    />

                                    <label
                                        style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: laissezPasserDateDelivranceFilter ? "-8px" : "50%",
                                            transform: laissezPasserDateDelivranceFilter ? "translateY(0)" : "translateY(-50%)",
                                            fontSize: laissezPasserDateDelivranceFilter ? "11px" : "13px",
                                            color: laissezPasserDateDelivranceFilter ? "#674459" : "#888",
                                            background: "#fff",
                                            padding: "0 6px",
                                            pointerEvents: "none",
                                            transition: "all 0.25s ease",
                                        }}
                                    >
                                        Date delivrance
                                    </label>
                                </div>

                                {/* DATE FILTER */}
                                <div style={{ position: "relative", width: "220px"}}>
                                    <input
                                        type="date"
                                        value={laissezPasserDateExpirationFilter}
                                        onChange={(e) => setLaissezPasserDateExpirationFilter(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 12px",
                                            borderRadius: "10px",
                                            border: laissezPasserDateExpirationFilter ? "1.8px solid #674459" : "1.5px solid #ddd",
                                            backgroundColor: "#f6f6f6",
                                            fontSize: "14px",
                                            color: "#838383",
                                            outline: "none",
                                            transition: "all 0.25s ease",
                                            boxShadow: laissezPasserDateExpirationFilter
                                                ? "0 4px 12px rgba(79, 70, 229, 0.15)"
                                                : "0 2px 6px rgba(0,0,0,0.05)",
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.border = "1.8px solid #674459";
                                            e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                        }}
                                        onBlur={(e) => {
                                            if (!laissezPasserDateExpirationFilter) {
                                                e.target.style.border = "1.5px solid #ddd";
                                                e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
                                            }
                                        }}
                                    />

                                    <label
                                        style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: laissezPasserDateExpirationFilter ? "-8px" : "50%",
                                            transform: laissezPasserDateExpirationFilter ? "translateY(0)" : "translateY(-50%)",
                                            fontSize: laissezPasserDateExpirationFilter ? "11px" : "13px",
                                            color: laissezPasserDateExpirationFilter ? "#674459" : "#888",
                                            background: "#fff",
                                            padding: "0 6px",
                                            pointerEvents: "none",
                                            transition: "all 0.25s ease",
                                        }}
                                    >
                                        Date d'expiration
                                    </label>
                                </div>

                                {/* STATUt */}
                                <div className="select-wrap">
                                    <select
                                        onClick={() => setIsStatutOpen(!isStatutOpen)}
                                        onBlur={() => setIsStatutOpen(false)}
                                        value={laissezPasserStatutFilter}
                                        onChange={(e) => setLaissezPasserStatutFilter(e.target.value)}
                                    >
                                        <option value="">Status</option>
                                        <option value="ACTIF">Actif</option>
                                        <option value="ANNULE">Annulé</option>
                                        <option value="EXPIRE">Expiré</option>
                                    </select>

                                    <i className={`bx bx-chevron-down select-arrow ${isStatutOpen ? "open" : ""}`}></i>                                </div>

                            </div>
                        </div>

                        {/* TABLE */}
                        <table className="entite-table">
                            <thead>
                            <tr>
                                <th>N° du laissez passer</th>
                                <th>Nom et Prénom</th>
                                <th>Direction</th>
                                <th>Portes d'accès</th>
                                <th>Zones d'accèss</th>
                                <th>Secteurs de sûreté</th>
                                <th>Date de délivrance</th>
                                <th>Date d'expiration</th>
                                <th>Statut</th>
                                <th>Détails</th>
                            </tr>
                            </thead>

                            <tbody>
                            {paginatedLaissezPasser.length > 0 ? (
                                paginatedLaissezPasser.map((lp) => {
                                    const demande = lp.demande;

                                    return (
                                        <tr key={lp.id}>
                                            {/* LP NUMBER */}
                                            <td>{lp.numLaissezPasser || lp.id}</td>

                                            {/* NAME */}
                                            <td>
                                                {demande
                                                    ? `${demande.firstName} ${demande.lastName}`
                                                    : "-"}
                                            </td>
                                            <td>{demande.direction}</td>

                                            {/* PORTES */}
                                            <td>{demande.portes?.length ? demande.portes.join(", ") : "-"}</td>

                                            {/* ZONES */}
                                            <td>
                                                {demande?.zones || "-"}
                                            </td>
                                            {/* SECTEURS */}
                                            <td>{demande.secteur?.length ? demande.secteur.join(", ") : "-"}</td>

                                            {/* DATE DELIVRANCE */}
                                            <td>
                                                {lp.dateDelivrance
                                                    ? new Date(lp.dateDelivrance).toLocaleDateString("fr-FR")
                                                    : "-"}
                                            </td>

                                            {/* EXPIRATION */}
                                            <td>
                                                {lp.dateExpiration
                                                    ? new Date(lp.dateExpiration).toLocaleDateString("fr-FR")
                                                    : "-"}
                                            </td>

                                            {/* STATUS */}
                                            <td>{getStatusBadge(lp.statut)}</td>

                                            {/* ACTION */}
                                            <td>
                                                <div
                                                    className="detail-btn"
                                                    onClick={() =>
                                                        navigate(`/correspondantdesurete/laissez-passer/${lp.id}`)
                                                    }
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="10"
                                        style={{
                                            textAlign: "center",
                                            padding: "20px",
                                            color: "#888"
                                        }}
                                    >
                                        Aucun laissez-passer trouvé
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        <div
                            className="pagination-controls"
                        >
                            <CustomSelect
                                options={[
                                    { value: 5, label: "5" },
                                    { value: 10, label: "10" },
                                    { value: 15, label: "15" },
                                    { value: 20, label: "20" },
                                ]}
                                value={perPageLaissezPasser}
                                onChange={(val) => {
                                    setPerPageLaissezPasser(val);
                                    setCurrentLaissezPasser(1); // reset page
                                }}
                            />
                            {/* Pagination for gestion */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <button
                                    onClick={() => setCurrentLaissezPasser(prev => prev - 1)}
                                    disabled={currentLaissezPasser === 1 || totalPagesLaissezPasser === 0}
                                    style={{
                                        backgroundColor: (currentLaissezPasser === 1 || totalPagesLaissezPasser === 0) ? '#fff' : '#674459',
                                        color: (currentLaissezPasser === 1 || totalPagesLaissezPasser === 0) ? '#674459' : '#f4eee4',
                                        border: "2px solid rgba(103, 68, 89, 0.5)",
                                        borderRadius: '50%',
                                        cursor: (currentLaissezPasser === 1 || totalPagesLaissezPasser === 0) ? 'not-allowed' : 'pointer',
                                        width: "32px",
                                        height: "32px",
                                    }}
                                >
                                    ‹
                                </button>

                                {getPaginationRange(currentLaissezPasser, totalPagesLaissezPasser).map((p, i) =>
                                    p === '...' ? (
                                        <span key={i}>...</span>
                                    ) : (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentLaissezPasser(p)}
                                            style={{
                                                margin: '0 3px',
                                                padding: '6px 10px',
                                                backgroundColor: p === currentLaissezPasser ? '#674459' : 'transparent',
                                                color: p === currentLaissezPasser ? '#fff' : '#674459',
                                                border: p === currentLaissezPasser
                                                    ? '1px solid #674459'
                                                    : '1px solid transparent',
                                                borderRadius: p === currentLaissezPasser ? '50%' : '6px',
                                                cursor: 'pointer',
                                                minWidth: '28px',
                                                height: '28px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: "12px",
                                            }}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => setCurrentLaissezPasser(prev => prev + 1)}
                                    disabled={currentLaissezPasser === totalPagesLaissezPasser || totalPagesLaissezPasser === 0}
                                    style={{
                                        backgroundColor: (currentLaissezPasser === totalPagesLaissezPasser || totalPagesLaissezPasser === 0) ? '#fff' : '#674459',
                                        color: (currentLaissezPasser === totalPagesLaissezPasser || totalPagesLaissezPasser === 0) ? '#674459' : '#f4eee4',
                                        border: "2px solid rgba(103, 68, 89, 0.5)",
                                        borderRadius: '50%',
                                        cursor: (currentLaissezPasser === totalPagesLaissezPasser || totalPagesLaissezPasser === 0) ? 'not-allowed' : 'pointer',
                                        width: "32px",
                                        height: "32px",
                                    }}
                                >
                                    ›
                                </button>
                            </div>
                            <div></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CorrespondantLaissezPasser;