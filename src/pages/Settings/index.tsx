// @ts-ignore
import { useEffect } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

const SettingsIndex = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/settings/general');
  }, [navigate]);
  return null;
};

export default SettingsIndex; 