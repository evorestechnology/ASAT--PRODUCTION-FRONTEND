import React from 'react';

function MasterFooter() {
    return (
        <footer style={{ marginTop: 'auto' }}>
            <div className="footer-content" style={{ display: 'flex', justifyContent: 'space-between', padding: '40px 5%', background: 'var(--dark)', color: 'white' }}>
                <div className="footer-info">
                    <h4>As Simple as That</h4>
                    <p>Global Headquarters, Tech Park</p>
                    <p>Contact: +1 000 999 888 | master@simpleasthat.com</p>
                </div>
                <div className="footer-socials">
                    <a href="#" style={{ color: 'white', margin: '0 10px' }}><i className="fab fa-instagram"></i></a>
                    <a href="#" style={{ color: 'white', margin: '0 10px' }}><i className="fab fa-facebook-f"></i></a>
                    <a href="#" style={{ color: 'white', margin: '0 10px' }}><i className="fab fa-x-twitter"></i></a>
                </div>
            </div>
            <div className="copyright" style={{ background: 'var(--dark)', color: 'white', textAlign: 'center', padding: '20px 0', borderTop: '1px solid #333' }}>
                <p>© 2026 All Rights Reserved by <strong>EvoRES TECHNOLOGY</strong></p>
            </div>
        </footer>
    );
}

export default MasterFooter;
