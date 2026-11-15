import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-white border border-borderLight rounded p-8 max-w-lg mx-auto my-12 text-center space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-borderLight flex items-center justify-center mx-auto text-slateText-secondary">
        <FileQuestion className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slateText">404 — Page Not Found</h1>
        <p className="text-xs text-slateText-secondary mt-1">
          The requested page could not be found or you may not have permission to access it.
        </p>
      </div>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
