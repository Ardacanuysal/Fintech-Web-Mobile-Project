import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock } from 'lucide-react';

interface SignupFormInputs {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormInputs>();
  const password = watch('password');

  const onSubmit = async (data: SignupFormInputs) => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      await signup(data.email, data.password);
      
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('Failed to create an account. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Sign up to start tracking your investments
          </p>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md text-sm">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  {...register('displayName', { 
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  error={errors.displayName?.message}
                  fullWidth
                  leftIcon={<User className="w-4 h-4 text-gray-400" />}
                />
              </div>
              
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
                  autoComplete="new-password"
                  placeholder="Create a password"
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
              
              <div>
                <Input
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  error={errors.confirmPassword?.message}
                  fullWidth
                  leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                />
              </div>
              
              <div className="flex items-center">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="peer h-4 w-4 appearance-none rounded border border-gray-300 bg-white dark:bg-gray-800 checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500 transition-colors duration-200"
                    required
                  />
                  <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 flex items-center justify-center">
                    <svg
                      className="hidden peer-checked:block w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </label>
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-800">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-800">
                    Privacy Policy
                  </a>
                </label>
              </div>
              
              <Button
                type="submit"
                fullWidth
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t flex justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;