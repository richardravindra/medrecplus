import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const RoutingDebugger: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { /* empty */ }, [location]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '200px'
      }}
    >
      <div>
        <strong>📍 Current Path:</strong>
      </div>
      <div>{location.pathname}</div>
      <div style={{ marginTop: '5px' }}>
        <button
          onClick={() => {
            navigate('/patients');
          }}
          style={{ fontSize: '10px', margin: '2px', padding: '2px 5px' }}
        >
          Patients
        </button>
        <button
          onClick={() => {
            navigate('/test');
          }}
          style={{ fontSize: '10px', margin: '2px', padding: '2px 5px' }}
        >
          Test
        </button>
        <button
          onClick={() => {
            navigate('/');
          }}
          style={{ fontSize: '10px', margin: '2px', padding: '2px 5px' }}
        >
          Dashboard
        </button>
      </div>
    </div>
  );
};
