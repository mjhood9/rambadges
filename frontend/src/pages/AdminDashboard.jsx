import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import "../assets/styles/main.css";
import CustomSelect from "../components/layout/CustomSelect";

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

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);

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
            const currentUserId = decoded.sub;

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
                user => user.id !== Number(currentUserId)
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
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const getPagination = () => {
        const pages = [];

        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        pages.push(1);

        if (currentPage > 3) {
            pages.push('...');
        }

        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        pages.push(totalPages);

        return pages;
    };

    // Close modal animation
    const handleClose = (type) => {
        setClosing(true);
        setTimeout(() => {
            if (type === 'add') setShowModal(false);
            if (type === 'edit') setShowEditModal(false);
            if (type === 'delete') setShowDeleteModal(false);
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setSelectedRoles([]);
            setSelectedEntite('');
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

    const handleAddUser = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');

            const payload = {
                firstName,
                lastName,
                email,
                username: `${firstName.trim()} ${lastName.trim()}`, // 👈 if your backend uses username
                password,
                roles: selectedRoles, // ["ADMIN", "DEMANDEUR", ...]
                entiteId: selectedEntite || null // 👈 send only if selected
            };

            await axios.post(
                'http://localhost:8080/api/auth/signup',
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // reset form
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setSelectedRoles([]);
            setSelectedEntite('');

            handleClose('add');
            fetchUsers(); // refresh table

        } catch (err) {
            console.error("Error adding user:", err);
        }
    };

    // 🔹 Update API function
    const handleUpdateUser = async () => {
        if (!editingUser) return; // safety check

        try {
            const payload = {
                firstName,
                lastName,
                username: `${firstName.trim()} ${lastName.trim()}`,
                email,
                password,
                roles: selectedRoles,
                entiteId: selectedRoles.includes("ADMIN_ENTITE") ? selectedEntite : null,
            };

            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:8080/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // ✅ add this
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Erreur lors de la mise à jour');

            const updatedUser = await response.json();
            console.log("User updated:", updatedUser);

            handleClose('edit');
            fetchUsers(); // refresh list

        } catch (err) {
            console.error(err);
            alert("Erreur lors de la mise à jour de l'utilisateur");
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
                            {paginated.length > 0 ? (
                                paginated.map(user => (
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
                                                        setFirstName(user.firstName);
                                                        setLastName(user.lastName);
                                                        setEmail(user.email);
                                                        setPassword(''); // leave empty for security
                                                        setSelectedRoles(user.roles.map(r => r.name));

                                                        // Prefill entite by matching user.entite.id with options
                                                        setSelectedEntite(user.entite ? user.entite.id : '');

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
                        {/* Pagination Controls */}
                        <div
                            className="pagination-controls"
                        >
                            {/* Left: Items per page */}
                            <CustomSelect
                                options={[
                                    { value: 5, label: "5" },
                                    { value: 10, label: "10" },
                                    { value: 15, label: "15" },
                                    { value: 20, label: "20" },
                                ]}
                                value={perPage}
                                onChange={(val) => setPerPage(val)}
                            />

                            {/* Center: Page buttons */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

                                {/* 🔹 Previous */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        backgroundColor: currentPage === 1 ? '#fff' : '#674459',
                                        color: currentPage === 1 ? '#674459' : '#f4eee4',
                                        border: "2px solid rgba(103, 68, 89, 0.5)",
                                        borderRadius: '50%',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        width: "32px",
                                        height: "32px",
                                    }}
                                >
                                    ‹
                                </button>

                                {/* 🔹 Pages with ... */}
                                {getPagination().map((item, index) => (
                                    item === '...' ? (
                                        <span key={index} style={{ padding: '0 6px', color: '#674459' }}>
                ...
            </span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setCurrentPage(item)}
                                            style={{
                                                margin: '0 3px',
                                                padding: '6px 10px',
                                                backgroundColor: item === currentPage ? '#674459' : 'transparent',
                                                color: item === currentPage ? '#fff' : '#674459',
                                                border: item === currentPage
                                                    ? '1px solid #674459'
                                                    : '1px solid transparent',
                                                borderRadius: item === currentPage ? '50%' : '6px',
                                                cursor: 'pointer',
                                                minWidth: '28px',
                                                height: '28px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: "12px",
                                            }}
                                        >
                                            {item}
                                        </button>
                                    )
                                ))}

                                {/* 🔹 Next */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        backgroundColor: currentPage === totalPages ? '#fff' : '#674459',
                                        color: currentPage === totalPages ? '#674459' : '#f4eee4', // ✅ FIXED
                                        border: "2px solid rgba(103, 68, 89, 0.5)",
                                        borderRadius: '50%',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
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
                    </div>
                </div>
            </div>

            {/* 🔹 ADD MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={() => handleClose('add')} onSubmit={handleAddUser}>
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

                                <details className="multi-select">
                                    <summary>
                                        {selectedRoles.length > 0
                                            ? selectedRoles.map(r => formatRole(r)).join(', ')
                                            : "Sélectionnez des rôles"}
                                    </summary>

                                    <ul>
                                        {rolesList.map((role) => (
                                            <li key={role}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        value={role}
                                                        checked={selectedRoles.includes(role)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedRoles([...selectedRoles, role]);
                                                            } else {
                                                                setSelectedRoles(
                                                                    selectedRoles.filter(r => r !== role)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    {formatRole(role)}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
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
                    <div
                        className={`modal-content ${closing ? 'closing' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="close-btn" onClick={() => handleClose('edit')}>×</button>
                        <h2>Modifier utilisateur</h2>

                        <form
                            className="modal-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateUser();
                            }}
                        >
                            {/* Nom & Prénom */}
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
                                <details className="multi-select">
                                    <summary>
                                        {selectedRoles.length > 0
                                            ? selectedRoles.map(r => formatRole(r)).join(', ')
                                            : "Sélectionnez des rôles"}
                                    </summary>

                                    <ul>
                                        {rolesList.map((role) => (
                                            <li key={role}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        value={role}
                                                        checked={selectedRoles.includes(role)}
                                                        onChange={(e) => {
                                                            let updatedRoles;
                                                            if (e.target.checked) {
                                                                updatedRoles = [...selectedRoles, role];
                                                            } else {
                                                                updatedRoles = selectedRoles.filter(r => r !== role);
                                                            }

                                                            setSelectedRoles(updatedRoles);

                                                            // 🔹 Reset entite if ADMIN_ENTITE is deselected
                                                            if (role === "ADMIN_ENTITE" && !e.target.checked) {
                                                                setSelectedEntite('');
                                                            }
                                                        }}
                                                    />
                                                    {formatRole(role)}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </div>

                            {/* Entité select */}
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
                                            {ent.name} {/* Shows name while value is id */}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Modal Actions */}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => handleClose('edit')}
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
                            <button
                                className="submit-btn"
                                onClick={async () => {
                                    if (!selectedUser) return;

                                    try {
                                        // Call API to delete user
                                        await axios.delete(`http://localhost:8080/api/users/${selectedUser.id}`, {
                                            headers: {
                                                Authorization: `Bearer ${localStorage.getItem('token')}`
                                            }
                                        });

                                        // Close modal and refresh user list
                                        handleClose('delete');
                                        fetchUsers(); // make sure this function fetches updated user list
                                    } catch (err) {
                                        console.error('Delete error:', err);
                                        alert('Erreur lors de la suppression de l’utilisateur');
                                    }
                                }}
                            >
                                Confirmer <i className="fa-solid fa-arrow-right" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default AdminDashboard;