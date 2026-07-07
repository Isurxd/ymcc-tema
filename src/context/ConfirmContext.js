"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: "",
    resolve: null,
  });

  const confirmAction = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (confirmState.resolve) confirmState.resolve(true);
    setConfirmState({ isOpen: false, message: "", resolve: null });
  };

  const handleCancel = () => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState({ isOpen: false, message: "", resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-[4px] border-black p-6 rounded-2xl shadow-[8px_8px_0_0_#000] max-w-sm w-full transform transition-transform">
            <h3 className="font-anton text-2xl uppercase mb-2">Are you sure?</h3>
            <p className="font-poppins font-medium text-gray-700 mb-6">{confirmState.message}</p>
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 border-2 border-black font-bold uppercase py-2 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-[#c1ff00] border-2 border-black font-bold uppercase py-2 rounded-xl hover:bg-black hover:text-[#c1ff00] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};
