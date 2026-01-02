import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="text-[150px] font-black text-gray-200 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-20 h-20 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ke Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-xs text-gray-400">
          Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
