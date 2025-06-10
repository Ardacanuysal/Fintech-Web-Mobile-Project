import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';

interface LoginFormInputs {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setError(null);
      setLoading(true);
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      if (err.message === 'Please verify your email before logging in.') {
        setError(
          'Please verify your email address before logging in. Check your inbox for a verification link. If you need a new verification email, please use the resend verification option.'
        );
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred during login. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 relative">
      <button
        className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-blue-600 text-sm font-medium"
        onClick={() => navigate('/')}
        aria-label="Go back"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md text-sm">
                <p className="font-medium">{error}</p>
                {error.includes('verify your email') && (
                  <button
                    onClick={() => {
                      // This is a placeholder - you'll need to implement the resend verification logic
                      alert('Resend verification feature will be implemented here');
                    }}
                    className="mt-2 text-red-800 underline hover:text-red-900"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.email?.message}
                  fullWidth
                  leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                />
              </div>
              
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={errors.password?.message}
                  fullWidth
                  leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 bg-white text-blue-600 focus:ring-blue-500 border-gray-300 rounded checked:bg-blue-600"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
                    Forgot your password?
                  </Link>
                </div>
              </div>
              
              <Button
                type="submit"
                fullWidth
                isLoading={loading}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;