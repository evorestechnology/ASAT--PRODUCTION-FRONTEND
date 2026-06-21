import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function UserFooter() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    if (!isHomePage) {
        return (
            <footer style={{ padding: '20px 5% 16px', background: 'var(--dark)' }}>
                <div className="copyright" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#888' }}>
                        © 2026 All Rights Reserved by EvoRES TECHNOLOGY{' '}
                        <a href="https://evorestechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                            <strong><i className="fa fa-globe" style={{ color: 'var(--gold)', padding:'2px' }}></i></strong>
                        </a>
                        {' · '}
                        <span style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>As Simple as That</span>
                    </p>
                </div>
            </footer>
        );
    }

    return (
        <footer>
            <div className="footer-content">
                <div className="footer-info">
                    <h4 style={{margin:'2px'}}>As Simple as That</h4>
                    <span style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: '0.6rem', letterSpacing: '2.5px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '10px' }}>**A Designer Paradise**</span>
                    <p>Vijayawada, Andhra Pradesh 520001</p>
                    <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#ddd' }}>
                        "Design is intelligence made visible." 
                        <span style={{ display: 'block', marginTop: '8px' }}>
                        <Link to="/designer/register" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
                            Join as a designer
                        </Link>
                        </span>
                    </p>
                </div>
                <div className="footer-socials">
                    <a href="#"><i className="fab fa-instagram"></i></a>
                    <a href="#"><i className="fab fa-facebook-f"></i></a>
                    <a href="#"><i className="fab fa-pinterest"></i></a>
                </div>
            </div>
            <div className="copyright">
                <p>© 2026 All Rights Reserved by EvoRES TECHNOLOGY 
                <a href="https://evorestechnology.com/" target="_blank" rel="noopener noreferrer">
                    <strong><i className="fa fa-globe" style={{ color: 'var(--gold)', padding:'2px' }}></i></strong>
                </a>
                </p>
            </div>
        </footer>
    );
}

export default UserFooter;
