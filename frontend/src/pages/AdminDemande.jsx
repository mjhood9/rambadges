import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "../assets/styles/main.css";
import CustomSelect from "../components/layout/CustomSelect";
import { useNotification } from '../context/NotificationContext';

const AdminDemande = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc", // "asc" | "desc" | "none"
    });
    const [demandes, setDemandes] = useState([]);
    const [entites, setEntites] = useState([]);
    const [laissezPasserMap, setLaissezPasserMap] = useState({});
    const [dateDepotOnda, setDateDepotOnda] = useState("");
    const [selectedDemandeId, setSelectedDemandeId] = useState(null);
    const [numLaissezPasser, setNumLaissezPasser] = useState("");
    const [dateDelivrance, setDateDelivrance] = useState("");
    const [dateExpiration, setDateExpiration] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [quitusFile, setQuitusFile] = useState(null);

    const [selectedDirection, setSelectedDirection] = useState("");
    const [isDirecteurOpen, setIsDirecteurOpen] = useState(false);
    const [isCorrespondantOpen, setIsCorrespondantOpen] = useState(false);
    const [isDirectionOpen, setIsDirectionOpen] = useState(false);

    const [perPageDemandes, setPerPageDemandes] = useState(5);
    const [currentDemandes, setCurrentDemandes] = useState(1);

    const [demandeDateFilter, setDemandeDateFilter] = useState("");
    const [demandeStatusDirecteurFilter, setDemandeStatusDirecteurFilter] = useState("");
    const [demandeStatusCorrespondantFilter, setDemandeStatusCorrespondantFilter] = useState("");

    const [loading, setLoading] = useState(false);
    const [loadingOnda, setLoadingOnda] = useState(false);
    const [loadingDelivrance, setLoadingDelivrance] = useState(false);
    const [error, setError] = useState(null);

    const [showOndaModal, setShowOndaModal] = useState(false);
    const [showDelivranceModal, setShowDelivranceModal] = useState(false);
    const [closing, setClosing] = useState(false);

    const { addNotification } = useNotification();

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                // cycle: none -> asc -> desc -> none
                const nextDirection =
                    prev.direction === "none"
                        ? "asc"
                        : prev.direction === "asc"
                            ? "desc"
                            : "none";

                return {
                    key: nextDirection === "none" ? null : key,
                    direction: nextDirection,
                };
            }

            return { key, direction: "asc" };
        });
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => resolve(reader.result); // base64 string
            reader.onerror = (error) => reject(error);
        });
    };

    const handleClose = (type) => {
        setClosing(true);

        setTimeout(() => {
            if (type === "onda") {
                setShowOndaModal(false);
            }
            else if (type === "delivrance") {
                setShowDelivranceModal(false);
            }

            setClosing(false);
        }, 300);
    };

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);

            const [demandesRes, entitesRes, resLaissezPasser] = await Promise.all([
                axios.get("http://localhost:8080/api/demandes", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:8080/api/entites", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("http://localhost:8080/api/laissezpasser", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const demandesData = demandesRes.data;

            setDemandes(demandesData);
            setEntites(entitesRes.data);

            // 🔥 NORMALIZE DATA
            const lpData = Array.isArray(resLaissezPasser.data)
                ? resLaissezPasser.data
                : [resLaissezPasser.data];

            // 🔥 BUILD MAP: demandeId === demande.id
            const lpMap = {};

            lpData.forEach((lp) => {
                if (!lp || !lp.demandeId) return;

                lpMap[lp.demandeId] = lp;
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
    const filteredDemandes = demandes.filter((d) => {
        const fullName = `${d.firstName || ""} ${d.lastName || ""}`.toLowerCase();

        const matchSearch = fullName.includes(search.toLowerCase());

        const matchDate = demandeDateFilter
            ? d.createdAt?.split("T")[0] === demandeDateFilter
            : true;

        const matchStatusDirecteur = demandeStatusDirecteurFilter
            ? d.statusDirecteur === demandeStatusDirecteurFilter
            : true;

        const matchStatusCorrespondant = demandeStatusCorrespondantFilter
            ? d.statusCorrespondant === demandeStatusCorrespondantFilter
            : true;

        const matchDirection = selectedDirection
            ? d.direction === selectedDirection
            : true;

        return (
            matchSearch &&
            matchDate &&
            matchStatusDirecteur &&
            matchStatusCorrespondant &&
            matchDirection
        );
    });

    const sortedDemandes = [...filteredDemandes].sort((a, b) => {
        if (!sortConfig.key || sortConfig.direction === "none") return 0;

        const lpA = laissezPasserMap[String(a.id)];
        const lpB = laissezPasserMap[String(b.id)];

        let aValue;
        let bValue;

        // =========================
        // FULL NAME
        // =========================
        if (sortConfig.key === "fullName") {
            aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
        }

            // =========================
            // DATE DEMANDE
        // =========================
        else if (sortConfig.key === "createdAt") {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
        }

            // =========================
            // DATE DEPOT ONDA
        // =========================
        else if (sortConfig.key === "dateDepotOnda") {
            aValue = lpA?.dateDepotOnda ? new Date(lpA.dateDepotOnda) : null;
            bValue = lpB?.dateDepotOnda ? new Date(lpB.dateDepotOnda) : null;
        }

            // =========================
            // DATE DELIVRANCE
        // =========================
        else if (sortConfig.key === "dateDelivrance") {
            aValue = lpA?.dateDelivrance ? new Date(lpA.dateDelivrance) : null;
            bValue = lpB?.dateDelivrance ? new Date(lpB.dateDelivrance) : null;
        }

            // =========================
            // DEFAULT STRING/NUMBER
        // =========================
        else {
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];

            if (typeof aValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = (bValue || "").toLowerCase();
            }
        }

        // =========================
        // NULL SAFE COMPARISON
        // =========================
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue === null) return sortConfig.direction === "asc" ? -1 : 1;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;

        return 0;
    });

    // ✅ PAGINATION
    const totalPagesDemandes = Math.ceil(filteredDemandes.length / perPageDemandes);

    const paginatedDemandes = sortedDemandes.slice(
        (currentDemandes - 1) * perPageDemandes,
        currentDemandes * perPageDemandes
    );

    const getSortIcon = (key) => {
        if (sortConfig.key !== key || sortConfig.direction === "none") {
            return <i className="bx bx-equalizer" />; // "=" default
        }
        if (sortConfig.direction === "asc") {
            return <i className="bx bx-up-arrow-alt" />;
        }
        return <i className="bx bx-down-arrow-alt" />;
    };

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

    const handleOndaSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoadingOnda(true);
            const token = localStorage.getItem("token");

            const lp = laissezPasserMap[selectedDemandeId];

            if (!lp) {
                // ✅ CREATE
                await axios.post(
                    "http://localhost:8080/api/laissezpasser",
                    {
                        demandeId: selectedDemandeId,
                        dateDepotOnda: dateDepotOnda
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                addNotification("Date dépôt ONDA est ajoutée", "success");
            } else {
                // ✅ UPDATE
                await axios.put(
                    `http://localhost:8080/api/laissezpasser/${lp.id}`,
                    {
                        dateDepotOnda: dateDepotOnda
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                addNotification("Date dépôt ONDA mise à jour", "success");
            }

            handleClose("onda");

            // 🔄 refresh data (important)
            await fetchData();
            setDateDepotOnda("");

        } catch (err) {
            console.error(err);
            setError("Erreur lors de l'enregistrement");
            addNotification("Erreur lors de l'enregistrement", "error");
        }finally {
            setLoadingOnda(false);
        }
    };

    const handleDelivranceSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoadingDelivrance(true);

            const token = localStorage.getItem("token");

            const lp = laissezPasserMap[selectedDemandeId];

            if (!lp) {

                setError("Aucun laissez-passer trouvé");

                addNotification(
                    "Aucun laissez-passer trouvé",
                    "error"
                );

                return;
            }

            // =========================
            // GET DEMANDE
            // =========================
            const demandeRes = await axios.get(
                `http://localhost:8080/api/demandes/${selectedDemandeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const demande = demandeRes.data;

            const demandeFullName =
                `${demande.firstName} ${demande.lastName}`.trim().toLowerCase();

            // =========================
            // GET ALL USERS
            // =========================
            const usersRes = await axios.get(
                "http://localhost:8080/api/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // =========================
            // FIND MATCHING USER
            // =========================
            const matchedUser = usersRes.data.find((u) => {

                const userFullName =
                    `${u.firstName} ${u.lastName}`.trim().toLowerCase();

                return userFullName === demandeFullName;
            });

            if (!matchedUser) {

                setError("Utilisateur introuvable");

                addNotification(
                    "Utilisateur introuvable",
                    "error"
                );

                return;
            }

            // ✅ USE KEYCLOAK ID
            const userId = matchedUser.keycloakId;

            // =========================
            // FILES
            // =========================
            const imageBase64 =
                imageFile ? await fileToBase64(imageFile) : null;

            const quitusBase64 =
                quitusFile ? await fileToBase64(quitusFile) : null;

            // =========================
            // UPDATE LP
            // =========================
            await axios.put(
                `http://localhost:8080/api/laissezpasser/${lp.id}`,
                {
                    numLaissezPasser,
                    dateDelivrance,
                    dateExpiration,

                    // ✅ REAL USER KEYCLOAK ID
                    userId: userId,

                    ...(imageBase64 && {
                        imageUrl: imageBase64
                    }),

                    ...(quitusBase64 && {
                        quitusPaiementUrl: quitusBase64
                    }),

                    statut: "ACTIF"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // =========================
            // UPDATE DEMANDE STATUS
            // =========================
            await axios.put(
                `http://localhost:8080/api/demandes/${selectedDemandeId}/status`,
                {
                    status: "APPROUVEE"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            addNotification(
                "Laissez-passer délivré avec succès 🎉",
                "success"
            );

            await fetchData();

            handleClose("delivrance");

            // reset form
            setNumLaissezPasser("");
            setDateDelivrance("");
            setDateExpiration("");
            setImageFile(null);
            setQuitusFile(null);
            setError(null);

        } catch (err) {

            console.error(err);

            setError("Erreur lors de l'enregistrement");

            addNotification(
                "Erreur lors de la délivrance",
                "error"
            );

        } finally {

            setLoadingDelivrance(false);
        }
    };

    // ✅ STATUS BADGES
    const getStatusBadge = (status) => {
        switch (status) {
            case "EN_ATTENTE":
                return <span className="badge-attent">En attente</span>;
            case "APPROUVEE":
                return <span className="badge-approve">Validé</span>;
            case "REJETEE":
                return <span className="badge-reject">Refusé</span>;
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
                <title>Admin RAM Badges | Les Demandes</title>
            </Helmet>

            <div className="background">
                <div className="overlay">
                    <div className="container1">

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
                                        value={demandeDateFilter}
                                        onChange={(e) => setDemandeDateFilter(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 12px",
                                            borderRadius: "10px",
                                            border: demandeDateFilter ? "1.8px solid #674459" : "1.5px solid #ddd",
                                            backgroundColor: "#f6f6f6",
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

                                {/* STATUS DIRECTEUR */}
                                <div className="select-wrap">
                                    <select
                                        onClick={() => setIsDirecteurOpen(!isDirecteurOpen)}
                                        onBlur={() => setIsDirecteurOpen(false)}
                                        value={demandeStatusDirecteurFilter}
                                        onChange={(e) => setDemandeStatusDirecteurFilter(e.target.value)}
                                    >
                                        <option value="">Status Entité</option>
                                        <option value="EN_ATTENTE">En attente</option>
                                        <option value="APPROUVEE">Validé</option>
                                        <option value="REJETEE">Refusé</option>
                                    </select>

                                    <i className={`bx bx-chevron-down select-arrow ${isDirecteurOpen ? "open" : ""}`}></i>                                </div>
                                <div className="select-wrap">
                                    <select
                                        onClick={() => setIsCorrespondantOpen(!isCorrespondantOpen)}
                                        onBlur={() => setIsCorrespondantOpen(false)}
                                        value={demandeStatusCorrespondantFilter}
                                        onChange={(e) => setDemandeStatusCorrespondantFilter(e.target.value)}
                                    >
                                        <option value="">Status Sûreté</option>
                                        <option value="EN_ATTENTE">En attente</option>
                                        <option value="APPROUVEE">Validé</option>
                                        <option value="REJETEE">Refusé</option>
                                    </select>

                                    <i className={`bx bx-chevron-down select-arrow ${isCorrespondantOpen ? "open" : ""}`}></i>                                </div>

                            </div>
                        </div>

                        {/* TABLE */}
                        <table className="entite-table">
                            <thead>
                            <tr>
                                <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                                    N° Demande {getSortIcon("id")}
                                </th>
                                <th onClick={() => handleSort("fullName")} style={{ cursor: "pointer" }}>
                                    Nom et Prénom {getSortIcon("fullName")}
                                </th>
                                <th onClick={() => handleSort("direction")} style={{ cursor: "pointer" }}>
                                    Direction {getSortIcon("direction")}
                                </th>
                                <th>Portes d'accès</th>
                                <th>Secteurs de sûreté</th>
                                <th>Zones d'accès</th>
                                <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer" }}>
                                    Date demande {getSortIcon("createdAt")}
                                </th>
                                <th>Responsable Entité</th>
                                <th>Correspondant de sûreté</th>
                                <th onClick={() => handleSort("dateDepotOnda")} style={{ cursor: "pointer" }}>
                                    Date Dépôt ONDA {getSortIcon("dateDepotOnda")}
                                </th>
                                <th onClick={() => handleSort("dateDelivrance")} style={{ cursor: "pointer" }}>
                                    Date Délivrance {getSortIcon("dateDelivrance")}
                                </th>
                                <th>Actions</th>
                                <th>Détails</th>
                            </tr>
                            </thead>

                            <tbody>
                            {paginatedDemandes.length > 0 ? (
                                paginatedDemandes.map((d) => {
                                    const lp = laissezPasserMap[String(d.id)];
                                    return (
                                        <tr key={d.id}>
                                            <td>{d.id}</td>
                                            <td>{d.firstName} {d.lastName}</td>
                                            <td>{d.direction}</td>
                                            <td>{d.portes?.length ? d.portes.join(", ") : "-"}</td>
                                            <td>{d.secteur?.length ? d.secteur.join(", ") : "-"}</td>
                                            <td>{d.zones}</td>

                                            <td>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>

                                            <td>{getStatusBadge(d.statusDirecteur)}</td>
                                            <td>{getStatusBadge(d.statusCorrespondant)}</td>

                                            {/* ✅ SAFE DATE HANDLING */}
                                            <td>
                                                {lp?.dateDepotOnda
                                                    ? new Date(lp.dateDepotOnda).toLocaleDateString('fr-FR')
                                                    : "—"}
                                            </td>

                                            <td>
                                                {lp?.dateDelivrance
                                                    ? new Date(lp.dateDelivrance).toLocaleDateString('fr-FR')
                                                    : "—"}
                                            </td>

                                            <td>
                                                <div className="action-btns">

                                                    {/* DATE DEPOT ONDA */}
                                                    <div className="tooltip-wrapper">
                                                        <button
                                                            className="date-btn"
                                                            onClick={() => {
                                                                setSelectedDemandeId(d.id);
                                                                setShowOndaModal(true);
                                                            }}
                                                            disabled={d.statusCorrespondant !== "APPROUVEE"}
                                                            style={{
                                                                opacity: d.statusCorrespondant !== "APPROUVEE" ? 0.4 : 1,
                                                                cursor: d.statusCorrespondant !== "APPROUVEE"
                                                                    ? "not-allowed"
                                                                    : "pointer"
                                                            }}
                                                        >
                                                            <i className="bx bx-calendar-check" />
                                                        </button>

                                                        <span className="tooltip-text">
                Ajouter / modifier la date de dépôt ONDA
            </span>
                                                    </div>

                                                    {/* LAISSEZ-PASSER / DELIVRANCE */}
                                                    <div className="tooltip-wrapper">
                                                        <button
                                                            className="date-btn"
                                                            disabled={!lp}
                                                            onClick={() => {
                                                                setSelectedDemandeId(d.id);
                                                                setShowDelivranceModal(true);
                                                            }}
                                                            style={{
                                                                opacity: !lp ? 0.4 : 1,
                                                                cursor: !lp ? "not-allowed" : "pointer"
                                                            }}
                                                        >
                                                            <i className="bx bx-user-check" />
                                                        </button>

                                                        <span className="tooltip-text">
                Créer ou délivrer le laissez-passer
            </span>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <div
                                                    className="detail-btn"
                                                    onClick={() => navigate(`/admin/demandes/${d.id}`)}
                                                >
                                                    <i className="fa-regular fa-eye"></i>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="13" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
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
                                    { value: 5, label: "5" },
                                    { value: 10, label: "10" },
                                    { value: 15, label: "15" },
                                    { value: 20, label: "20" },
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
                                    disabled={currentDemandes === 1 || totalPagesDemandes === 0}
                                    style={{
                                        backgroundColor: (currentDemandes === 1 || totalPagesDemandes === 0) ? '#fff' : '#674459',
                                        color: (currentDemandes === 1 || totalPagesDemandes === 0) ? '#674459' : '#f4eee4',
                                        border: "2px solid rgba(103, 68, 89, 0.5)",
                                        borderRadius: '50%',
                                        cursor: (currentDemandes === 1 || totalPagesDemandes === 0) ? 'not-allowed' : 'pointer',
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
                                    disabled={currentDemandes === totalPagesDemandes || totalPagesDemandes === 0}
                                    style={{
                                        backgroundColor: (currentDemandes === totalPagesDemandes || totalPagesDemandes === 0) ? '#fff' : '#674459',
                                        color: (currentDemandes === totalPagesDemandes || totalPagesDemandes === 0) ? '#674459' : '#f4eee4',
                                        border: "2px solid rgba(103, 68, 89, 0.5)",
                                        borderRadius: '50%',
                                        cursor: (currentDemandes === totalPagesDemandes || totalPagesDemandes === 0) ? 'not-allowed' : 'pointer',
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
            {showOndaModal && (
                <div className="modal-overlay" onClick={() => handleClose("onda")}>
                    <div
                        className={`modal-content ${closing ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="close-btn"
                            onClick={() => handleClose("onda")}
                        >
                            ×
                        </button>

                        <h2>Ajouter date depôt ONDA</h2>

                        <form className="modal-form" onSubmit={handleOndaSubmit}>
                            <div style={{ position: "relative", width: "100%" }}>
                                <input
                                    type="date"
                                    value={
                                        dateDepotOnda
                                            ? dateDepotOnda.split("T")[0] // 👈 ensures YYYY-MM-DD format
                                            : ""
                                    }
                                    onChange={(e) => setDateDepotOnda(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 12px",
                                        borderRadius: "10px",
                                        border: dateDepotOnda ? "1.8px solid #674459" : "1.5px solid #ddd",
                                        backgroundColor: "#f6f6f6",
                                        fontSize: "14px",
                                        color: "#838383",
                                        outline: "none",
                                        transition: "all 0.25s ease",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1.8px solid #674459";
                                        e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                    }}
                                    onBlur={(e) => {
                                        if (!dateDepotOnda) {
                                            e.target.style.border = "1.5px solid #ddd";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />

                                <label
                                    style={{
                                        position: "absolute",
                                        left: "12px",
                                        top: dateDepotOnda ? "-8px" : "50%",
                                        transform: dateDepotOnda ? "translateY(0)" : "translateY(-50%)",
                                        fontSize: dateDepotOnda ? "11px" : "13px",
                                        color: dateDepotOnda ? "#674459" : "#888",
                                        background: "#fff",
                                        padding: "0 6px",
                                        pointerEvents: "none",
                                        transition: "all 0.25s ease",
                                    }}
                                >
                                    Date dépôt ONDA
                                </label>
                            </div>
                            {error && <span style={{color: '#e53935', fontSize: '12px'}}>{error}</span>}
                            <div className="modal-actions1">
                                <button type="button" className="cancel-btn" onClick={() => handleClose('onda')}>
                                    <i className="fa-solid fa-arrow-left"/> Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={loadingOnda}
                                >
                                    {loadingOnda ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                        </>
                                    ) : (
                                        "Enregistrer"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDelivranceModal && (
                <div className="modal-overlay" onClick={() => handleClose("delivrance")}>
                    <div
                        className={`modal-content ${closing ? "closing" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="close-btn"
                            onClick={() => handleClose("delivrance")}
                        >
                            ×
                        </button>

                        <h2>Affectation</h2>

                        <form className="modal-form" onSubmit={handleDelivranceSubmit}>
                            <div className="form-group">
                                <label>N° de laissez passer</label>
                                <input
                                    type="number"
                                    placeholder="Saisissez ici"
                                    value={numLaissezPasser}
                                    onChange={(e) => setNumLaissezPasser(e.target.value)}
                                />
                            </div>
                            <div className="flex-row">
                            <div style={{ position: "relative", width: "100%" }}>
                                <input
                                    type="date"
                                    value={
                                        dateDelivrance
                                            ? dateDelivrance.split("T")[0] // 👈 ensures YYYY-MM-DD format
                                            : ""
                                    }
                                    onChange={(e) => setDateDelivrance(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 12px",
                                        borderRadius: "10px",
                                        border: dateDelivrance ? "1.8px solid #674459" : "1.5px solid #ddd",
                                        backgroundColor: "#f6f6f6",
                                        fontSize: "14px",
                                        color: "#838383",
                                        outline: "none",
                                        transition: "all 0.25s ease",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.border = "1.8px solid #674459";
                                        e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                    }}
                                    onBlur={(e) => {
                                        if (!dateDelivrance) {
                                            e.target.style.border = "1.5px solid #ddd";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />

                                <label
                                    style={{
                                        position: "absolute",
                                        left: "12px",
                                        top: dateDelivrance ? "-8px" : "50%",
                                        transform: dateDelivrance ? "translateY(0)" : "translateY(-50%)",
                                        fontSize: dateDelivrance ? "11px" : "13px",
                                        color: dateDelivrance ? "#674459" : "#888",
                                        background: "#fff",
                                        padding: "0 6px",
                                        pointerEvents: "none",
                                        transition: "all 0.25s ease",
                                    }}
                                >
                                    Date de délivrance
                                </label>
                            </div>
                                <div style={{ position: "relative", width: "100%" }}>
                                    <input
                                        type="date"
                                        value={
                                            dateExpiration
                                                ? dateExpiration.split("T")[0] // 👈 ensures YYYY-MM-DD format
                                                : ""
                                        }
                                        onChange={(e) => setDateExpiration(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "12px 12px",
                                            borderRadius: "10px",
                                            border: dateExpiration ? "1.8px solid #674459" : "1.5px solid #ddd",
                                            backgroundColor: "#f6f6f6",
                                            fontSize: "14px",
                                            color: "#838383",
                                            outline: "none",
                                            transition: "all 0.25s ease",
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.border = "1.8px solid #674459";
                                            e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                                        }}
                                        onBlur={(e) => {
                                            if (!dateExpiration) {
                                                e.target.style.border = "1.5px solid #ddd";
                                                e.target.style.boxShadow = "none";
                                            }
                                        }}
                                    />

                                    <label
                                        style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: dateExpiration ? "-8px" : "50%",
                                            transform: dateExpiration ? "translateY(0)" : "translateY(-50%)",
                                            fontSize: dateExpiration ? "11px" : "13px",
                                            color: dateExpiration ? "#674459" : "#888",
                                            background: "#fff",
                                            padding: "0 6px",
                                            pointerEvents: "none",
                                            transition: "all 0.25s ease",
                                        }}
                                    >
                                        Date d'expiration
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Image du laissez passer</label>
                                <div className="upload-wrap">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                        hidden
                                        id="lp-image"
                                    />
                                    <label htmlFor="lp-image" className="upload-btn">
                                        <i className="fa-solid fa-cloud-arrow-down"></i>
                                        Choisir une image (jpg, png)
                                    </label>
                                </div>
                                {imageFile && (
                                    <p style={{ marginTop: "6px", fontSize: "12px", color: "#555" }}>
                                        📎 {imageFile.name}
                                    </p>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Quitus de paiement</label>
                                <div className="upload-wrap">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setQuitusFile(e.target.files[0])}
                                        hidden
                                        id="lp-quitus"
                                    />
                                    <label htmlFor="lp-quitus" className="upload-btn">
                                        <i className="fa-solid fa-cloud-arrow-down"></i>
                                        Choisir un fichier (pdf)
                                    </label>
                                </div>
                                {quitusFile && (
                                    <p style={{ marginTop: "6px", fontSize: "12px", color: "#555" }}>
                                        📎 {quitusFile.name}
                                    </p>
                                )}
                            </div>
                            {error && <span style={{color: '#e53935', fontSize: '12px'}}>{error}</span>}
                            <div className="modal-actions1">
                                <button type="button" className="cancel-btn" onClick={() => handleClose('delivrance')}>
                                    <i className="fa-solid fa-arrow-left"/> Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={loadingDelivrance}
                                >
                                    {loadingDelivrance ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                        </>
                                    ) : (
                                        "Délivrer"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDemande;