import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/animations.css';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  React.useEffect(() => {
    // Add enter animation when location changes
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.classList.remove('page-enter-active', 'page-exit-active');

      // Trigger reflow
      void mainElement.offsetWidth;

      mainElement.classList.add('page-enter');

      requestAnimationFrame(() => {
        mainElement.classList.remove('page-enter');
        mainElement.classList.add('page-enter-active');
      });
    }
  }, [location.pathname]);

  return <>{children}</>;
};

export default PageTransition;