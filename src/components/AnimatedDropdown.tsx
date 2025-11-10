import React, { useState, useRef, useEffect, SyntheticEvent } from 'react';
import { Menu, MenuButton, MenuItem, Dropdown } from '@mui/joy';
import '../styles/animations.css';

interface AnimatedDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: 'bottom' | 'bottom-start' | 'bottom-end';
}

const AnimatedDropdown: React.FC<AnimatedDropdownProps> = ({
  trigger,
  children,
  placement = 'bottom'
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (_event: SyntheticEvent | null, isOpen: boolean) => {
    setOpen(isOpen);
  };

  useEffect(() => {
    if (open && dropdownRef.current) {
      const dropdown = dropdownRef.current;

      // Reset animation classes
      dropdown.classList.remove('dropdown-enter-active', 'dropdown-exit-active');

      // Add enter animation
      dropdown.classList.add('dropdown-enter');

      requestAnimationFrame(() => {
        dropdown.classList.remove('dropdown-enter');
        dropdown.classList.add('dropdown-enter-active');
      });
    }
  }, [open]);

  return (
    <Dropdown open={open} onOpenChange={handleOpenChange}>
      <MenuButton
        onClick={() => setOpen(!open)}
        className="button-press"
        sx={{
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          }
        }}
      >
        {trigger}
      </MenuButton>
      <Menu
        ref={dropdownRef}
        placement={placement}
        sx={{
          '&[role="menu"]': {
            backgroundColor: '#2a2a2a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'md',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            padding: '4px',
          },
          '& .MuiMenuItem-root': {
            borderRadius: 'sm',
            margin: '2px 0',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateX(4px)',
            },
            '&:active': {
              transform: 'translateX(2px) scale(0.98)',
            }
          }
        }}
      >
        {children}
      </Menu>
    </Dropdown>
  );
};

// Export individual components for easier use
export { MenuItem as AnimatedMenuItem };
export default AnimatedDropdown;