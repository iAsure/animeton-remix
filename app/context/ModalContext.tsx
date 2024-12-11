import { createContext, useContext, useState, ReactNode } from 'react';

type ModalComponent = (props: { onClose: () => void }) => ReactNode;

type ModalContextType = {
  openModal: (id: string, component: ModalComponent) => void;
  closeModal: (id: string) => void;
  modals: Array<{ id: string; component: ModalComponent }>;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Array<{ id: string; component: ModalComponent }>>([]);

  const openModal = (id: string, component: ModalComponent) => {
    setModals(current => [...current, { id, component }]);
  };

  const closeModal = (id: string) => {
    setModals(current => current.filter(modal => modal.id !== id));
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, modals }}>
      {children}
      {/* Modal Container */}
      {modals.map(({ id, component }) => (
        <div key={id} className="modal-wrapper">
          {typeof component === 'function' ? component({ onClose: () => closeModal(id) }) : component}
        </div>
      ))}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
}; 