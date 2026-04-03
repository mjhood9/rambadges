import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import "../assets/styles/main.css";

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    const [name, setName] = useState('');
    const [closing, setClosing] = useState(false);

    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedEntite, setSelectedEntite] = useState('');
    const rolesList = ["DEMANDEUR", "ADMIN_ENTITE", "ADMIN_FONCTIONNEL", "ADMIN"]; // Enum values
    const [allEntites, setAllEntites] = useState([]);

    const fetchAllEntites = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/entites', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setAllEntites(response.data);
        } catch (err) {
            console.error('Error fetching entites:', err);
        }
    };

    // Fetch users
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');

            const decoded = jwtDecode(token);
            const currentUsername = decoded.sub; // 👈 username from token

            const response = await axios.get(
                'http://localhost:8080/api/users',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // ✅ exclude current user using username
            const filteredUsers = response.data.filter(
                user => user.username !== currentUsername
            );

            setUsers(filteredUsers);

        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAllEntites();
    }, []);

    // Filter
    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // Close modal animation
    const handleClose = (type) => {
        setClosing(true);
        setTimeout(() => {
            if (type === 'add') setShowModal(false);
            if (type === 'edit') setShowEditModal(false);
            if (type === 'delete') setShowDeleteModal(false);
            setClosing(false);
        }, 400);
    };

    const formatRole = (role) => {
        switch (role) {
            case 'DEMANDEUR':
                return 'DEMANDEUR';
            case 'ADMIN_ENTITE':
                return "ADMIN D'ENTITE";
            case 'ADMIN_FONCTIONNEL':
                return 'ADMIN FONCTIONNEL';
            case 'ADMIN':
                return 'ADMIN';
            default:
                return role; // fallback
        }
    };
    
    return (
        <>
            <Helmet>
                <title>Admin RAM Badges | Les Utilisateurs</title>
            </Helmet>

            <div className="background">
                <div className="overlay">
                    <div className="container">

                        {/* 🔹 Top Bar */}
                        <div className="entite-top-bar">

                            {/* LEFT → Search */}
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

                            {/* RIGHT → Add button */}
                            <div>
                                <button
                                    className="add-btn"
                                    onClick={() => setShowModal(true)}
                                >
                                    <i className="bx bx-plus" />
                                    Ajouter
                                </button>
                            </div>
                        </div>

                        {/* 🔹 Table */}
                        <table className="entite-table">
                            <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Prénom</th>
                                <th>Email</th>
                                <th>Rôle(s)</th>
                                <th style={{textAlign: 'right'}}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length > 0 ? (
                                filtered.map(user => (
                                    <tr key={user.id}>
                                        {/* Nom */}
                                        <td>{user.lastName}</td>

                                        {/* Prénom */}
                                        <td>{user.firstName}</td>

                                        {/* Email */}
                                        <td>{user.email}</td>

                                        {/* Roles */}
                                        <td>
                                            <div className="roles">
                                                {user.roles?.map((role, index) => (
                                                    <span key={index} className="role-badge">
        {formatRole(role.name)}
      </span>
                                                ))}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="action-btns">
                                            <button
                                                    className="action-btn"
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    <i className="bx bx-edit-alt"/>
                                                </button>

                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                >
                                                    <i className='bx bx-x'></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{
                                        textAlign: 'center',
                                        padding: '30px',
                                        color: '#888',
                                        fontStyle: 'italic'
                                    }}>
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🔹 ADD MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={() => handleClose('add')}>
                    <div
                        className={`modal-content ${closing ? 'closing' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="close-btn" onClick={() => handleClose('add')}>×</button>
                        <h2>Ajouter utilisateur</h2>

                        <form className="modal-form">
                            {/* Nom & Prénom flex */}
                            <div className="flex-row">
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        placeholder="Saississez ici"
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        placeholder="Saississez ici"
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    placeholder="Saississez ici"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    value={password}
                                    placeholder="Saississez ici"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {/* Roles multi-select */}
                            <div className="form-group">
                                <label>Rôles</label>
                                <select
                                    multiple
                                    value={selectedRoles}
                                    onChange={(e) =>
                                        setSelectedRoles(
                                            Array.from(e.target.selectedOptions, (option) => option.value)
                                        )
                                    }
                                >
                                    {rolesList.map((role) => (
                                        <option key={role} value={role}>
                                            {formatRole(role)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Entité select – only if ADMIN_ENTITE is selected */}
                            <div className="form-group">
                                <label>Entité</label>
                                <select
                                    value={selectedEntite}
                                    onChange={(e) => setSelectedEntite(e.target.value)}
                                    disabled={!selectedRoles.includes("ADMIN_ENTITE")}
                                >
                                    <option value="">Sélectionnez une entité</option>
                                    {allEntites.map((ent) => (
                                        <option key={ent.id} value={ent.id}>
                                            {ent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Modal Actions */}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => handleClose('add')}
                                >
                                    <i className="fa-solid fa-arrow-left"/> Annuler
                                </button>

                                <button type="submit" className="submit-btn">
                                    Enregistrer <i className="fa-solid fa-arrow-right"/>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🔹 EDIT MODAL */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => handleClose('edit')}>
                    <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => handleClose('edit')}>×</button>
                        <h2>Modifier utilisateur</h2>

                        <form className="modal-form">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => handleClose('edit')}>
                                    <i className="fa-solid fa-arrow-left"/>Annuler
                                </button>
                                <button className="submit-btn">
                                    Enregistrer<i className="fa-solid fa-arrow-right"/>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🔹 DELETE MODAL */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => handleClose('delete')}>
                    <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => handleClose('delete')}>×</button>

                        <h2>⚠️ Attention</h2>
                        <p style={{textAlign: 'center', fontSize: '14px', marginTop: '25px'}}>
                            <label style={{fontWeight: '600', color: '#c20831'}}>La suppression de cet utilisateur est
                                imminente.</label> <br/>
                            <label style={{fontWeight: '400'}}>Si vous confirmez, cet élément ne sera plus
                                accessible.</label>
                        </p>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => handleClose('delete')}>
                                <i className="fa-solid fa-arrow-left"/>Annuler
                            </button>
                            <button className="submit-btn">
                            Confirmer<i className="fa-solid fa-arrow-right"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default AdminDashboard;