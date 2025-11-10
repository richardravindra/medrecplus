import React, { useEffect, useRef } from 'react';
import { Modal, ModalDialog } from '@mui/joy';
import '../styles/animations.css';

interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  open,
  onClose,
  children,
  size = 'md'
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Backdrop animation
      if (backdropRef.current) {
        backdropRef.current.classList.remove('modal-backdrop-enter-active', 'modal-backdrop-exit-active');
        backdropRef.current.classList.add('modal-backdrop-enter');

        requestAnimationFrame(() => {
          backdropRef.current?.classList.remove('modal-backdrop-enter');
          backdropRef.current?.classList.add('modal-backdrop-enter-active');
        });
      }

      // Dialog animation
      if (dialogRef.current) {
        dialogRef.current.classList.remove('modal-content-enter-active', 'modal-content-exit-active');
        dialogRef.current.classList.add('modal-content-enter');

        requestAnimationFrame(() => {
          dialogRef.current?.classList.remove('modal-content-enter');
          dialogRef.current?.classList.add('modal-content-enter-active');
        });
      }
    } else {
      // Exit animations
      if (backdropRef.current) {
        backdropRef.current.classList.remove('modal-backdrop-enter', 'modal-backdrop-enter-active');
        backdropRef.current.classList.add('modal-backdrop-exit-active');
      }

      if (dialogRef.current) {
        dialogRef.current.classList.remove('modal-content-enter', 'modal-content-enter-active');
        dialogRef.current.classList.add('modal-content-exit-active');
      }
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      disableAutoFocus
      keepMounted={false}
    >
      <>
        <div
          ref={backdropRef}
          className="modal-backdrop-enter-active"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }}
        />
        <ModalDialog
          ref={dialogRef}
          className="modal-content-enter-active"
          variant="outlined"
          size={size}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: 'md',
            boxShadow: 'lg',
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: '90vh',
            overflow: 'auto',
            zIndex: 1001
          }}
        >
          {children}
        </ModalDialog>
      </>
    </Modal>
  );
};

export default AnimatedModal;