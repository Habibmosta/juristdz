import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * Modal rendu via Portal directement dans document.body.
 * Garantit un centrage correct dans le viewport, indépendamment
 * de tout conteneur scrollable parent.
 */
const Modal: React.FC<ModalProps> = ({ onClose, children, maxWidth = 'max-w-2xl' }) => {
  // Bloquer le scroll du body à l'ouverture
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${maxWidth} relative`}>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
