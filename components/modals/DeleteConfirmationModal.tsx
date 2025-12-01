
import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
}

export const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    description, 
    confirmText = "Sim, excluir" 
}: DeleteConfirmationModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-rose-100 text-rose-600 flex-shrink-0">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <div className="text-slate-500 mt-2 text-sm leading-relaxed">
                            {description}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};
