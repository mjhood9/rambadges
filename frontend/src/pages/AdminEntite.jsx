import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import "../assets/styles/main.css";
import CustomSelect from "../components/layout/CustomSelect";

const AdminEntite = () => {
    const [entites, setEntites] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('attribuees');
    const [currentPageAssigned, setCurrentPageAssigned] = useState(1);
    const [currentPageGestion, setCurrentPageGestion] = useState(1);

    const [perPageAttribuees, setPerPageAttribuees] = useState(1);
    const [perPageGestion, setPerPageGestion] = useState(1);

    const [assignedUsers, setAssignedUsers] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [newEntiteName, setNewEntiteName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEntite, setSelectedEntite] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntite, setEditingEntite] = useState(null);
    const [editEntiteName, setEditEntiteName] = useState('');

    const [closing, setClosing] = useState(false);

    // Fetch all entities once on mount
    const fetchEntites = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/entites', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setEntites(response.data);
        } catch (err) {
            console.error('Error fetching entites:', err);
        }
    };

    const fetchAssignedUsers = async () => {
        try {
            const token = localStorage.getItem("token");

            // decode JWT
            const decoded = jwtDecode(token);

            // adjust this depending on your token payload (id, sub, email, etc.)
            const currentUserId = Number(decoded.sub);

            const response = await axios.get(
                "http://localhost:8080/api/users/with-entite",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // filter out current user
            const filteredUsers = response.data.filter(
                (user) => Number(user.id) !== currentUserId
            );

            setAssignedUsers(filteredUsers);

        } catch (err) {
            console.error("Error fetching assigned users:", err);
        }
    };

    useEffect(() => {
        fetchEntites();
        fetchAssignedUsers();
    }, []);

    // Filter entities locally based on search input
    const filtered = entites.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredAssignedUsers = assignedUsers.filter(user =>
        user.entite?.name.toLowerCase().includes(search.toLowerCase())
    );

    // For "attribuees" table
    const totalPagesAttribuees = Math.ceil(filteredAssignedUsers.length / perPageAttribuees);
    const paginatedAssignedUsers = filteredAssignedUsers.slice(
        (currentPageAssigned - 1) * perPageAttribuees,
        currentPageAssigned * perPageAttribuees
    );

// For "gestion" table
    const totalPagesGestion = Math.ceil(filtered.length / perPageGestion);
    const paginatedEntites = filtered.slice(
        (currentPageGestion - 1) * perPageGestion,
        currentPageGestion * perPageGestion
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

    // Close modal with animation
    const handleClose = (type = 'add') => {
        setClosing(true);
        setTimeout(() => {
            if (type === 'add') setShowModal(false);
            if (type === 'delete') {
                setShowDeleteModal(false);
                setSelectedEntite(null);
            }
            if (type === 'edit') {
                setShowEditModal(false);
                setEditingEntite(null);
                setEditEntiteName('');
            }
            setClosing(false);
        }, 400);
    };

    // Add entity
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newEntiteName.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            await axios.post('http://localhost:8080/api/entites',
                { name: newEntiteName },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setNewEntiteName('');
            handleClose('add');
            fetchEntites();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit entity
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editEntiteName.trim() || !editingEntite) return;

        setSubmitting(true);
        setError(null);

        try {
            await axios.put(
                `http://localhost:8080/api/entites/${editingEntite.id}`,
                { name: editEntiteName },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            handleClose('edit');
            fetchEntites();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la modification');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete entity
    const handleDelete = async () => {
        if (!selectedEntite) return;

        setClosing(true);
        setTimeout(async () => {
            try {
                await axios.delete(
                    `http://localhost:8080/api/entites/${selectedEntite.id}`,
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }
                );
                handleClose('delete');
                fetchEntites();
            } catch (err) {
                console.error('Delete error:', err);
                setClosing(false);
            }
        }, 400);
    };

    return (
        <>
            <Helmet>
                <title>Admin RAM Badges | Les Entités</title>
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
                                            activeTab === 'attribuees'
                                                ? 'translateX(0%)'
                                                : 'translateX(100%)',
                                    }}
                                ></div>

                                <button className={`tab-btn ${activeTab === 'attribuees' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('attribuees')}>Entités attribuées</button>

                                <button className={`tab-btn ${activeTab === 'gestion' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('gestion')}>Gestion des entités</button>
                            </div>

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

                                {activeTab === 'gestion' && (
                                    <button className="add-btn" onClick={() => setShowModal(true)}>
                                        <i className="bx bx-plus"/> Ajouter entité
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        {activeTab === 'attribuees' ? (
                            <>
                                <table className="entite-table">
                                    <thead>
                                    <tr>
                                        <th>Entité</th>
                                        <th>Responsable</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedAssignedUsers.length > 0 ? (
                                        paginatedAssignedUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.entite.name}</td>
                                                <td>{user.username}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#888', fontStyle: 'italic' }}>
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
                                        value={perPageAttribuees}
                                        onChange={(val) => {
                                            setPerPageAttribuees(val);
                                            setCurrentPageAssigned(1); // reset page
                                        }}
                                    />
                                {/* Pagination for attribuees */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                        onClick={() => setCurrentPageAssigned(prev => prev - 1)}
                                        disabled={currentPageAssigned === 1}
                                        style={{
                                            backgroundColor: currentPageAssigned === 1 ? '#fff' : '#674459',
                                            color: currentPageAssigned === 1 ? '#674459' : '#f4eee4',
                                            border: "2px solid rgba(103, 68, 89, 0.5)",
                                            borderRadius: '50%',
                                            cursor: currentPageAssigned === 1 ? 'not-allowed' : 'pointer',
                                            width: "32px",
                                            height: "32px",
                                        }}
                                    >
                                        ‹
                                    </button>

                                    {getPaginationRange(currentPageAssigned, totalPagesAttribuees).map((p, i) =>
                                        p === '...' ? (
                                            <span key={i}>...</span>
                                        ) : (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPageAssigned(p)}
                                                style={{
                                                    margin: '0 3px',
                                                    padding: '6px 10px',
                                                    backgroundColor: p === currentPageAssigned ? '#674459' : 'transparent',
                                                    color: p === currentPageAssigned ? '#fff' : '#674459',
                                                    border: p === currentPageAssigned
                                                        ? '1px solid #674459'
                                                        : '1px solid transparent',
                                                    borderRadius: p === currentPageAssigned ? '50%' : '6px',
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
                                        onClick={() => setCurrentPageAssigned(prev => prev + 1)}
                                        disabled={currentPageAssigned === totalPagesAttribuees}
                                        style={{
                                            backgroundColor: currentPageAssigned === totalPagesAttribuees ? '#fff' : '#674459',
                                            color: currentPageAssigned === totalPagesAttribuees ? '#674459' : '#f4eee4', // ✅ FIXED
                                            border: "2px solid rgba(103, 68, 89, 0.5)",
                                            borderRadius: '50%',
                                            cursor: currentPageAssigned === totalPagesAttribuees ? 'not-allowed' : 'pointer',
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
                                        <th>Entité</th>
                                        <th style={{ textAlign: 'right' }}>Détails</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedEntites.length > 0 ? (
                                        paginatedEntites.map((entite) => (
                                            <tr key={entite.id}>
                                                <td>{entite.name}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => {
                                                                setEditingEntite(entite);
                                                                setEditEntiteName(entite.name);
                                                                setShowEditModal(true);
                                                            }}
                                                        >
                                                            <i className="bx bx-edit-alt" />
                                                        </button>

                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => {
                                                                setSelectedEntite(entite);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        >
                                                            <i className="bx bx-x" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#888', fontStyle: 'italic' }}>
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
                                        value={perPageGestion}
                                        onChange={(val) => {
                                            setPerPageGestion(val);
                                            setCurrentPageGestion(1); // reset page
                                        }}
                                    />
                                {/* Pagination for gestion */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                        onClick={() => setCurrentPageGestion(prev => prev - 1)}
                                        disabled={currentPageGestion === 1}
                                        style={{
                                            backgroundColor: currentPageGestion === 1 ? '#fff' : '#674459',
                                            color: currentPageGestion === 1 ? '#674459' : '#f4eee4',
                                            border: "2px solid rgba(103, 68, 89, 0.5)",
                                            borderRadius: '50%',
                                            cursor: currentPageGestion === 1 ? 'not-allowed' : 'pointer',
                                            width: "32px",
                                            height: "32px",
                                        }}
                                    >
                                        ‹
                                    </button>

                                    {getPaginationRange(currentPageGestion, totalPagesGestion).map((p, i) =>
                                        p === '...' ? (
                                            <span key={i}>...</span>
                                        ) : (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPageGestion(p)}
                                                style={{
                                                    margin: '0 3px',
                                                    padding: '6px 10px',
                                                    backgroundColor: p === currentPageGestion ? '#674459' : 'transparent',
                                                    color: p === currentPageGestion ? '#fff' : '#674459',
                                                    border: p === currentPageGestion
                                                        ? '1px solid #674459'
                                                        : '1px solid transparent',
                                                    borderRadius: p === currentPageGestion ? '50%' : '6px',
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
                                        onClick={() => setCurrentPageGestion(prev => prev + 1)}
                                        disabled={currentPageGestion === totalPagesGestion}
                                        style={{
                                            backgroundColor: currentPageGestion === totalPagesGestion ? '#fff' : '#674459',
                                            color: currentPageGestion === totalPagesGestion ? '#674459' : '#f4eee4', // ✅ FIXED
                                            border: "2px solid rgba(103, 68, 89, 0.5)",
                                            borderRadius: '50%',
                                            cursor: currentPageGestion === totalPagesGestion ? 'not-allowed' : 'pointer',
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

            {/* Add Modal */}
            {showModal && (
            <div className="modal-overlay" onClick={() => handleClose('add')}>
                <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <button className="close-btn" onClick={() => handleClose('add')}>×</button>
                    <h2>Ajouter une entité</h2>
                    <form className="modal-form" onSubmit={handleSubmit}>
                        <label className="lbl-entite">Entité</label>
                        <input type="text" placeholder="Saisissez ici" value={newEntiteName}
                               onChange={(e) => setNewEntiteName(e.target.value)} required/>
                        {error && <span style={{color: '#e53935', fontSize: '12px'}}>{error}</span>}
                        <div className="modal-actions1">
                            <button type="button" className="cancel-btn" onClick={() => handleClose('add')}>
                                <i className="fa-solid fa-arrow-left"/> Annuler
                            </button>
                            <button type="submit" className="submit-btn" disabled={submitting}>
                                Enregistrer <i className="fa-solid fa-arrow-right"/>
                            </button>
                        </div>
                    </form>
                </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => handleClose('edit')}>
                    <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => handleClose('edit')}>×</button>
                        <h2>Modifier l'entité</h2>
                        <form className="modal-form" onSubmit={handleEditSubmit}>
                            <label className="lbl-entite">Entité</label>
                            <input type="text" placeholder="Saisissez ici" value={editEntiteName}
                                   onChange={(e) => setEditEntiteName(e.target.value)} required/>
                            {error && <span style={{color:'#e53935', fontSize:'12px'}}>{error}</span>}
                            <div className="modal-actions1">
                                <button type="button" className="cancel-btn" onClick={() => handleClose('edit')}>
                                    <i className="fa-solid fa-arrow-left"/> Annuler
                                </button>
                                <button type="submit" className="submit-btn" disabled={submitting}>
                                    Enregistrer <i className="fa-solid fa-arrow-right"/>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => handleClose('delete')}>
                    <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => handleClose('delete')}>×</button>
                        <h2>⚠️ Attention!</h2>
                        <p style={{ textAlign: 'center', fontSize: '14px', marginTop: '25px' }}>
                            <label style={{fontWeight: '600', color:'#c20831'}}>La suppression de cet entité est imminente.</label> <br/>
                            <label style={{fontWeight: '400'}}>Si vous confirmez, cet élément ne sera plus accessible.</label>
                        </p>
                        <div className="modal-actions1">
                            <button type="button" className="cancel-btn" onClick={() => handleClose('delete')}>
                                <i className="fa-solid fa-arrow-left"/> Annuler
                            </button>
                            <button className="submit-btn" onClick={handleDelete}>
                                Confirmer <i className="fa-solid fa-arrow-right"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminEntite;