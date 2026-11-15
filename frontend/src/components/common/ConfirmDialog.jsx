import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const variantStyles = {
    primary: {
      btn: 'bg-primary hover:bg-primary-hover text-white',
      iconBg: 'bg-blue-50 text-primary',
      icon: HelpCircle
    },
    success: {
      btn: 'bg-status-success hover:bg-emerald-700 text-white',
      iconBg: 'bg-emerald-50 text-status-success',
      icon: CheckCircle
    },
    danger: {
      btn: 'bg-status-danger hover:bg-red-700 text-white',
      iconBg: 'bg-red-50 text-status-danger',
      icon: AlertCircle
    }
  };

  const currentVariant = variantStyles[confirmVariant] || variantStyles.primary;
  const IconComponent = currentVariant.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white rounded-lg border border-borderLight shadow-lg max-w-md w-full p-5 space-y-4 animate-in fade-in duration-150">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full shrink-0 ${currentVariant.iconBg}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slateText">
              {title}
            </h3>
            <p className="text-xs text-slateText-secondary mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slateText-muted hover:text-slateText p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-borderLight">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-1.5 rounded text-xs font-medium text-slateText border border-borderLight hover:bg-background transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 ${currentVariant.btn}`}
          >
            {loading && (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
