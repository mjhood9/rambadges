import { useState, useEffect } from 'react';
import {Helmet} from "react-helmet-async";
import "../assets/styles/main.css";

const AdminEntite = () => {
    const [entites, setEntites] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('attribuees');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(7);

    const filtered = entites.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
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
                                    <button
                                        className={`tab-btn ${activeTab === 'attribuees' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('attribuees')}
                                    >
                                        Entités attribuées
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'gestion' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('gestion')}
                                    >
                                        Gestion des entités
                                    </button>
                                </div>
                                <div className="entite-search">
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <i className='bx bx-search'></i>
                                </div>
                            </div>

                            {/* Table */}
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
                                {paginated.map((entite) => (
                                    <tr key={entite.id}>
                                        <td>{entite.name}</td>
                                        <td>{entite.responsable}</td>
                                        <td>{entite.responsableSurete}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="action-btn">
                                                    <i className='bx bx-edit'></i>
                                                </button>
                                                <button className="action-btn delete">
                                                    <i className='bx bx-x'></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {/* Bottom Bar */}
                            <div className="entite-bottom-bar">
                                <div className="per-page">
                                    <select
                                        value={perPage}
                                        onChange={(e) => setPerPage(Number(e.target.value))}
                                    >
                                        <option value={7}>07</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                    </select>
                                </div>
                                <div className="pagination">
                                    <button
                                        className="page-btn"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        ←
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        className="page-btn"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        →
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
        </>
    );
};
export default AdminEntite;