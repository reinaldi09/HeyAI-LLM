"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">Gagal memproses asesmen</p>
        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
