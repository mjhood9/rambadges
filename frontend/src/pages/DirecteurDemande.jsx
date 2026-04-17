import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import "../assets/styles/main.css";
import { jwtDecode } from "jwt-decode";
import CustomSelect from "../components/layout/CustomSelect";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DirecteurDemande = () => {
    const [demandes, setDemandes] = useState([]);
    const [validations, setValidations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const [validationDateFilter, setValidationDateFilter] = useState("");
    const [demandeDateFilter, setDemandeDateFilter] = useState("");
    const [demandeStatusDirecteurFilter, setDemandeStatusDirecteurFilter] = useState("");
    const [demandeStatusCorrespondantFilter, setDemandeStatusCorrespondantFilter] = useState("");

    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('validations');
    const [currentValidations, setCurrentValidations] = useState(1);
    const [currentDemandes, setCurrentDemandes] = useState(1);

    const [perPageValidations, setPerPageValidations] = useState(1);
    const [perPageDemandes, setPerPageDemandes] = useState(1);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        const userId = Number(decoded.sub);

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. USERS
                const usersRes = await axios.get(
                    "http://localhost:8080/api/users/with-entite",
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const users = usersRes.data;

                // 2. Current user
                const currentUser = users.find(
                    (u) => Number(u.id) === userId
                );

                if (!currentUser?.entite?.id) {
                    setDemandes([]);
                    setValidations([]);
                    return;
                }

                const entiteId = currentUser.entite.id;

                // 3. Users in same entite
                const sameEntiteUserIds = users
                    .filter((u) => u.entite?.id === entiteId)
                    .map((u) => Number(u.id));

                // 4. Get all demandes
                const demandesRes = await axios.get(
                    "http://localhost:8080/api/demandes",
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const allDemandes = demandesRes.data;

                // 5. Filter by entite (ALL demandes)
                const sameEntiteDemandes = allDemandes.filter((d) =>
                    sameEntiteUserIds.includes(Number(d.userId))
                );

                // 6. Split validations (EN_ATTENTE only)
                const validationsData = sameEntiteDemandes.filter(
                    (d) => d.statusDirecteur === "EN_ATTENTE"
                );

                // ✅ Set states
                setDemandes(sameEntiteDemandes); // all demandes
                setValidations(validationsData); // only EN_ATTENTE

            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement des demandes");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter entities locally based on search input
    const filteredDemandes = demandes.filter((d) => {
        const matchSearch =
            (d.firstName + " " + d.lastName)
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchDate = demandeDateFilter
            ? d.createdAt?.split("T")[0] === demandeDateFilter
            : true;

        const matchStatusDirecteur = demandeStatusDirecteurFilter
            ? d.statusDirecteur === demandeStatusDirecteurFilter
            : true;

        const matchStatusCorrespondant = demandeStatusCorrespondantFilter
            ? d.statusCorrespondant === demandeStatusCorrespondantFilter
            : true;

        return matchSearch && matchDate && matchStatusDirecteur && matchStatusCorrespondant;
    });

    const filteredValidations = validations.filter((v) => {
        const matchSearch =
            (v.firstName + " " + v.lastName)
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchDate = validationDateFilter
            ? v.createdAt?.split("T")[0] === validationDateFilter
            : true;

        return matchSearch && matchDate;
    });

    // For "validations" table
    const totalPagesValidations = Math.ceil(filteredValidations.length / perPageValidations);
    const paginatedValidations = filteredValidations.slice(
        (currentValidations - 1) * perPageValidations,
        currentValidations * perPageValidations
    );

// For "demandes" table
    const totalPagesDemandes = Math.ceil(filteredDemandes.length / perPageDemandes);
    const paginatedDemandes = filteredDemandes.slice(
        (currentDemandes - 1) * perPageDemandes,
        currentDemandes * perPageDemandes
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
                <title>Directeur RAM Badges | Les Directeurs</title>
            </Helmet>
            <div className="background">
                <div className="overlay">
                    <div className="container">
                        {/* Top Bar */}
                        <div className="entite-top-bar">
                            <div className="entite-tabs">
                                <div
                                    className="tab-slider"
                                    style={{
                                        transform:
                                            activeTab === 'validations'
                                                ? 'translateX(0%)'
                                                : 'translateX(100%)',
                                    }}
                                ></div>

                                <button className={`tab-btn ${activeTab === 'validations' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('validations')}>Demandes à valider</button>

                                <button className={`tab-btn ${activeTab === 'demandes' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('demandes')}>Tous les demandes</button>
                            </div>

                            <div className="entite-search">
                                {activeTab === 'validations' && (
                                    <div className="validation-filters" style={{ display: "flex", gap: "10px" }}>

                                        {/* DATE FILTER */}
                                        <div style={{ position: "relative", width: "220px" }}>
                                            <input
                                                type="date"
                                                value={validationDateFilter}
                                                onChange={(e) => setValidationDateFilter(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "12px 12px",
                                                    borderRadius: "10px",
                                                    border: validationDateFilter ? "1.8px solid #674459" : "1.5px solid #ddd",
                                                    backgroundColor: "#f9fafb",
                                                    fontSize: "14px",
                                                    color: "#838383",
                                                    outline: "none",
                                                    transition: "all 0.25s ease",
                                                    boxShadow: validationDateFilter
                                                        ? "0 4px 12px rgba(79, 70, 229, 0.15)"
                                                        : "0 2px 6px rgba(0,0,0,0.05)",
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.border = "1.8px solid #674459";
                                                    e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                                }}
                                                onBlur={(e) => {
                                                    if (!validationDateFilter) {
                                                        e.target.style.border = "1.5px solid #ddd";
                                                        e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
                                                    }
                                                }}
                                            />

                                            <label
                                                style={{
                                                    position: "absolute",
                                                    left: "12px",
                                                    top: validationDateFilter ? "-8px" : "50%",
                                                    transform: validationDateFilter ? "translateY(0)" : "translateY(-50%)",
                                                    fontSize: validationDateFilter ? "11px" : "13px",
                                                    color: validationDateFilter ? "#674459" : "#888",
                                                    background: "#fff",
                                                    padding: "0 6px",
                                                    pointerEvents: "none",
                                                    transition: "all 0.25s ease",
                                                }}
                                            >
                                                Date de demande
                                            </label>
                                        </div>
                                    </div>
                                )}
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
                        </div>
                        {/* Top Bar */}
                        <div className="entite-top-bar1">
                            <div className="entite-search">
                                {activeTab === 'demandes' && (
                                    <div className="validation-filters" style={{ display: "flex", gap: "10px" }}>

                                        {/* DATE FILTER */}
                                        <div style={{ position: "relative", width: "220px"}}>
                                            <input
                                                type="date"
                                                value={demandeDateFilter}
                                                onChange={(e) => setDemandeDateFilter(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "12px 12px",
                                                    borderRadius: "10px",
                                                    border: demandeDateFilter ? "1.8px solid #674459" : "1.5px solid #ddd",
                                                    backgroundColor: "#f9fafb",
                                                    fontSize: "14px",
                                                    color: "#838383",
                                                    outline: "none",
                                                    transition: "all 0.25s ease",
                                                    boxShadow: demandeDateFilter
                                                        ? "0 4px 12px rgba(79, 70, 229, 0.15)"
                                                        : "0 2px 6px rgba(0,0,0,0.05)",
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.border = "1.8px solid #674459";
                                                    e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                                }}
                                                onBlur={(e) => {
                                                    if (!demandeDateFilter) {
                                                        e.target.style.border = "1.5px solid #ddd";
                                                        e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
                                                    }
                                                }}
                                            />

                                            <label
                                                style={{
                                                    position: "absolute",
                                                    left: "12px",
                                                    top: demandeDateFilter ? "-8px" : "50%",
                                                    transform: demandeDateFilter ? "translateY(0)" : "translateY(-50%)",
                                                    fontSize: demandeDateFilter ? "11px" : "13px",
                                                    color: demandeDateFilter ? "#674459" : "#888",
                                                    background: "#fff",
                                                    padding: "0 6px",
                                                    pointerEvents: "none",
                                                    transition: "all 0.25s ease",
                                                }}
                                            >
                                                Date de demande
                                            </label>
                                        </div>

                                        {/* STATUS SELECT */}
                                        <div className="select-wrap">
                                            <select
                                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                                                onBlur={() => setIsStatusOpen(false)}
                                                value={demandeStatusDirecteurFilter}
                                                onChange={(e) => setDemandeStatusDirecteurFilter(e.target.value)}
                                            >
                                                <option value="">Status Entité</option>
                                                <option value="EN_ATTENTE">En attente</option>
                                                <option value="APPROUVEE">Validé</option>
                                                <option value="REJETEE">Refusé</option>
                                            </select>

                                            <i className={`bx bx-chevron-down select-arrow ${isStatusOpen ? "open" : ""}`}></i>
                                        </div>
                                        <div className="select-wrap">
                                            <select
                                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                                                onBlur={() => setIsStatusOpen(false)}
                                                value={demandeStatusCorrespondantFilter}
                                                onChange={(e) => setDemandeStatusCorrespondantFilter(e.target.value)}
                                            >
                                                <option value="">Status Sûreté</option>
                                                <option value="EN_ATTENTE">En attente</option>
                                                <option value="APPROUVEE">Validé</option>
                                                <option value="REJETEE">Refusé</option>
                                            </select>

                                            <i className={`bx bx-chevron-down select-arrow ${isStatusOpen ? "open" : ""}`}></i>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Table */}
                        {activeTab === 'validations' ? (
                            <>
                                <table className="entite-table">
                                    <thead>
                                    <tr>
                                        <th>N° de demande</th>
                                        <th>Date demande</th>
                                        <th>Nom et Prénom</th>
                                        <th>Portes d'accès</th>
                                        <th>Zones d'accès</th>
                                        <th>Secteurs de sûreté</th>
                                        <th>Statut</th>
                                        <th style={{ textAlign: 'right' }}>Détails</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedValidations.length > 0 ? (
                                        paginatedValidations.map(v => (
                                            <tr key={v.id}>
                                                <td>{v.id}</td>
                                                <td>{v.createdAt?.split("T")[0]}</td>
                                                <td>{v.firstName} {v.lastName}</td>
                                                <td>{v.portes?.length
                                                    ? v.portes.join(", ")
                                                    : "-"}</td>
                                                <td>{v.zones}</td>
                                                <td>{v.secteur?.length
                                                    ? v.secteur.join(", ")
                                                    : "-"}</td>
                                                <td>{getStatusBadge(v.statusDirecteur)}</td>
                                                <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end" }}> <div
                                                    className="detail-btn"
                                                    onClick={() => navigate(`/directeur/demande/${v.id}`)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div> </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#888', fontStyle: 'italic' }}>
                                                Aucune demande trouvée
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
                                            { value: 1, label: "1" },
                                            { value: 2, label: "2" },
                                            { value: 3, label: "3" },
                                            { value: 4, label: "4" },
                                        ]}
                                        value={perPageValidations}
                                        onChange={(val) => {
                                            setPerPageValidations(val);
                                            setCurrentValidations(1); // reset page
                                        }}
                                    />
                                    {/* Pagination for attribuees */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                            onClick={() => setCurrentValidations(prev => prev - 1)}
                                            disabled={currentValidations === 1}
                                            style={{
                                                backgroundColor: currentValidations === 1 ? '#fff' : '#674459',
                                                color: currentValidations === 1 ? '#674459' : '#f4eee4',
                                                border: "2px solid rgba(103, 68, 89, 0.5)",
                                                borderRadius: '50%',
                                                cursor: currentValidations === 1 ? 'not-allowed' : 'pointer',
                                                width: "32px",
                                                height: "32px",
                                            }}
                                        >
                                            ‹
                                        </button>

                                        {getPaginationRange(currentValidations, totalPagesValidations).map((p, i) =>
                                            p === '...' ? (
                                                <span key={i}>...</span>
                                            ) : (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentValidations(p)}
                                                    style={{
                                                        margin: '0 3px',
                                                        padding: '6px 10px',
                                                        backgroundColor: p === currentValidations ? '#674459' : 'transparent',
                                                        color: p === currentValidations ? '#fff' : '#674459',
                                                        border: p === currentValidations
                                                            ? '1px solid #674459'
                                                            : '1px solid transparent',
                                                        borderRadius: p === currentValidations ? '50%' : '6px',
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
                                            onClick={() => setCurrentValidations(prev => prev + 1)}
                                            disabled={currentValidations === totalPagesValidations}
                                            style={{
                                                backgroundColor: currentValidations === totalPagesValidations ? '#fff' : '#674459',
                                                color: currentValidations === totalPagesValidations ? '#674459' : '#f4eee4', // ✅ FIXED
                                                border: "2px solid rgba(103, 68, 89, 0.5)",
                                                borderRadius: '50%',
                                                cursor: currentValidations === totalPagesValidations ? 'not-allowed' : 'pointer',
                                                width: "32px",
                                                height: "32px",
                                            }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                    <div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <table className="entite-table">
                                    <thead>
                                    <tr>
                                        <th>N° de demande</th>
                                        <th>Date demande</th>
                                        <th>Nom et Prénom</th>
                                        <th>Responsable Entité</th>
                                        <th>Correspondant Sûreté</th>
                                        <th>Date Dépôt ONDA</th>
                                        <th>Date Délivrance</th>
                                        <th style={{ textAlign: 'right' }}>Détails</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedDemandes.length > 0 ? (
                                        paginatedDemandes.map((d) => (
                                            <tr key={d.id}>
                                                <td>{d.id}</td>
                                                <td>{d.createdAt?.split("T")[0]}</td>
                                                <td>{d.firstName} {d.lastName}</td>
                                                <td>{getStatusBadge(d.statusDirecteur)}</td>
                                                <td>{getStatusBadge(d.statusCorrespondant)}</td>
                                                <td></td>
                                                <td></td>
                                                <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end" }}> <div
                                                    className="detail-btn"
                                                    onClick={() => navigate(`/directeur/demande/${d.id}`)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div> </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#888', fontStyle: 'italic' }}>
                                                Aucune entité trouvée
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
                                            { value: 1, label: "1" },
                                            { value: 2, label: "2" },
                                            { value: 3, label: "3" },
                                            { value: 4, label: "4" },
                                        ]}
                                        value={perPageDemandes}
                                        onChange={(val) => {
                                            setPerPageDemandes(val);
                                            setCurrentDemandes(1); // reset page
                                        }}
                                    />
                                    {/* Pagination for gestion */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                            onClick={() => setCurrentDemandes(prev => prev - 1)}
                                            disabled={currentDemandes === 1}
                                            style={{
                                                backgroundColor: currentDemandes === 1 ? '#fff' : '#674459',
                                                color: currentDemandes === 1 ? '#674459' : '#f4eee4',
                                                border: "2px solid rgba(103, 68, 89, 0.5)",
                                                borderRadius: '50%',
                                                cursor: currentDemandes === 1 ? 'not-allowed' : 'pointer',
                                                width: "32px",
                                                height: "32px",
                                            }}
                                        >
                                            ‹
                                        </button>

                                        {getPaginationRange(currentDemandes, totalPagesDemandes).map((p, i) =>
                                            p === '...' ? (
                                                <span key={i}>...</span>
                                            ) : (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentDemandes(p)}
                                                    style={{
                                                        margin: '0 3px',
                                                        padding: '6px 10px',
                                                        backgroundColor: p === currentDemandes ? '#674459' : 'transparent',
                                                        color: p === currentDemandes ? '#fff' : '#674459',
                                                        border: p === currentDemandes
                                                            ? '1px solid #674459'
                                                            : '1px solid transparent',
                                                        borderRadius: p === currentDemandes ? '50%' : '6px',
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
                                            onClick={() => setCurrentDemandes(prev => prev + 1)}
                                            disabled={currentDemandes === totalPagesDemandes}
                                            style={{
                                                backgroundColor: currentDemandes === totalPagesDemandes ? '#fff' : '#674459',
                                                color: currentDemandes === totalPagesDemandes ? '#674459' : '#f4eee4', // ✅ FIXED
                                                border: "2px solid rgba(103, 68, 89, 0.5)",
                                                borderRadius: '50%',
                                                cursor: currentDemandes === totalPagesDemandes ? 'not-allowed' : 'pointer',
                                                width: "32px",
                                                height: "32px",
                                            }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                    <div></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
export default DirecteurDemande;