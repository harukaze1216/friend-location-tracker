import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginButton: React.FC = () => {
  const { user, signInWithGoogle, logout, loading } = useAuth();

  if (loading) {
    return <div className="text-center">読み込み中...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <img 
            src={user.photoURL || ''} 
            alt={user.displayName || ''} 
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
          />
          <span className="text-xs sm:text-sm hidden sm:inline">{user.displayName}</span>
        </div>
        <button
          onClick={logout}
          className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded hover:from-red-500 hover:to-red-600 transition-all shadow-sm text-xs sm:text-sm"
        >
          <span className="sm:hidden">📤</span>
          <span className="hidden sm:inline">ログアウト</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm flex items-center gap-2"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Googleでログイン
    </button>
  );
};

export default LoginButton;