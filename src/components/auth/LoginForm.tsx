import React, { useState } from 'react';
import { LogIn, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleSesameLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Backoffice</h1>
          <p className="text-gray-600 mt-2">
            Sign in with Sesame SSO to access the management system
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Secure Single Sign-On</h3>
                <p className="text-sm text-blue-800">
                  Authentication is handled securely through Sesame SSO. Click below to be redirected to the login portal.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSesameLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting to Sesame...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Sign in with Sesame SSO
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by Sesame Single Sign-On
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}