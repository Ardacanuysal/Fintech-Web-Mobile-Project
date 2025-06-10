import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    try {
      setError(null);
      setLoading(true);

      if (isLogin) {
        await login(email, password);
        onClose();
      } else {
        await signup(email, password);
        setShowVerifyModal(true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = isLogin ? 'Invalid login credentials' : 'Failed to create account';
      if (err.code === 'auth/invalid-credential' && isLogin) {
        message = 'Invalid email or password';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen && !showForgotPassword} 
        onClose={onClose}
        title={isLogin ? 'Welcome Back!' : 'Create Your Account'}
        className="w-1/2 max-w-3xl"
      >
        <div className="text-center mb-6">
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to access your portfolio and watchlist' 
              : 'Join us to start tracking your investments'}
          </p>
        </div>

        {error && !showErrorModal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-lg text-sm flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <Input
              name="displayName"
              label="Full Name"
              type="text"
              required
              autoComplete="name"
              leftIcon={<User className="w-4 h-4 text-gray-400" />}
              placeholder="John Doe"
            />
          )}

          <Input
            name="email"
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            placeholder="you@example.com"
          />

          <Input
            name="password"
            label="Password"
            type="password"
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            placeholder="••••••••"
          />

          <Button
            type="submit"
            fullWidth
            isLoading={loading}
            className="mt-6"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>

          {isLogin && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 text-center border-t border-gray-100">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </Modal>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setError(null);
        }}
      />

      <Modal 
        isOpen={showErrorModal && !!error}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        className="max-w-md"
      >
        <div className="p-6 text-center">
          <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
          <Button onClick={() => setShowErrorModal(false)} fullWidth>OK</Button>
        </div>
      </Modal>

      <Modal 
        isOpen={showVerifyModal}
        onClose={() => { setShowVerifyModal(false); onClose(); }}
        title="Verify Your Email"
        className="max-w-md"
      >
        <div className="p-6 text-center">
          <p className="text-blue-600 text-lg font-semibold mb-4">
            Registration successful! Please check your email and verify your account before logging in.
          </p>
          <Button onClick={() => { setShowVerifyModal(false); onClose(); }} fullWidth>OK</Button>
        </div>
      </Modal>
    </>
  );
};

export default AuthModal;