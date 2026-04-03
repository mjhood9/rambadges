import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import axios from 'axios';
import "../assets/styles/main.css";

const AdminEntite = () => {
    const [entites, setEntites] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('attribuees');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(7);

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

    useEffect(() => { fetchEntites(); }, []);

    // Filter entities locally based on search input
    const filtered = entites.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

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
                            <table className="entite-table">
                                <thead>
                                <tr>
                                    <th>Entité</th>
                                    <th>Responsable</th>
                                    <th>Responsable sûreté</th>
                                    <th style={{ textAlign: 'right' }}>Détails</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginated.map(e => (
                                    <tr key={e.id}>
                                        <td>{e.name}</td>
                                        <td>{e.responsable}</td>
                                        <td>{e.responsableSurete}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="action-btn"><i className='bx bx-show'></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="entite-table">
                                <thead>
                                <tr>
                                    <th>Entité</th>
                                    <th style={{textAlign: 'right'}}>Détails</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginated.length > 0 ? (
                                    paginated.map((entite) => (
                                        <tr key={entite.id}>
                                            <td>{entite.name}</td>

                                            {activeTab === 'attribuees' ? (
                                                <>
                                                    <td>{entite.responsable}</td>
                                                    <td>{entite.responsableSurete}</td>
                                                    <td>
                                                        <div className="action-btns">
                                                            <button className="action-btn">
                                                                <i className='bx bx-show'></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <td>
                                                    <div className="action-btns">
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => {
                                                                setEditingEntite(entite);
                                                                setEditEntiteName(entite.name); // prefill input
                                                                setShowEditModal(true);
                                                            }}
                                                        >
                                                            <i className="bx bx-edit-alt"/>
                                                        </button>

                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => {
                                                                setSelectedEntite(entite);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        >
                                                            <i className='bx bx-x'></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={activeTab === 'attribuees' ? 4 : 2}
                                            style={{
                                                textAlign: 'center',
                                                padding: '30px',
                                                color: '#888',
                                                fontStyle: 'italic'
                                            }}
                                        >
                                            Aucune entité trouvée
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
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