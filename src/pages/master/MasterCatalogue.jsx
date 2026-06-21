import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MasterCatalogue() {
    const navigate = useNavigate();
    useEffect(() => { navigate('/master/products', { replace: true }); }, []);
    return null;
}
