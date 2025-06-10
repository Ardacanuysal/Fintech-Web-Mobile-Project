import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../context/AuthContext';
import { Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;

    try {
      setError(null);
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Reset Your Password"
      className="w-1/2 max-w-3xl"
    >
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="text-center">
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-800 rounded-lg">
            Password reset email sent! Check your inbox for further instructions.
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            fullWidth
          >
            Close
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              name="email"
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
              placeholder="you@example.com"
            />

            <Button
              type="submit"
              fullWidth
              isLoading={loading}
            >
              Send Reset Link
            </Button>
          </form>
        </>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;