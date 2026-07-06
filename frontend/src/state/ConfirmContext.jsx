import { createContext, useContext, useMemo, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  function confirm(options) {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Confirmar acao',
        message: options.message || 'Deseja continuar?',
        confirmText: options.confirmText || 'Confirmar',
        tone: options.tone || 'danger',
        resolve
      });
    });
  }

  function close(value) {
    dialog?.resolve(value);
    setDialog(null);
  }

  const value = useMemo(() => ({ confirm }), []);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-modal" role="dialog" aria-modal="true">
            <h2>{dialog.title}</h2>
            <p>{dialog.message}</p>
            <div className="modal-actions">
              <button className="secondary-inline" onClick={() => close(false)}>Cancelar</button>
              <button className={dialog.tone === 'danger' ? 'danger-inline' : 'primary-inline'} onClick={() => close(true)}>{dialog.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
