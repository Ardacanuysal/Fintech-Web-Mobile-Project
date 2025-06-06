import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Lock, LogOut, Mail, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile, updateUserProfile, deleteUserAccount, logoutAllDevices } from '../services/firestore';
import { useForm } from 'react-hook-form';

const ProfilePage: React.FC = () => {
  const { currentUser, logout, updateUserProfile: updateAuthProfile, resetPassword } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: false
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        setPreferences({
          emailNotifications: profile?.preferences?.emailNotifications || false
        });
        setValue('displayName', currentUser.displayName || '');
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [currentUser, navigate, setValue]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    try {
      await resetPassword(currentUser.email);
      setMessage({
        type: 'success',
        text: 'Password reset email sent. Check your inbox.'
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error sending password reset:', error);
      setMessage({
        type: 'error',
        text: 'Failed to send password reset email.'
      });
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await updateAuthProfile(data.displayName);
      setIsEditing(false);
      setMessage({
        type: 'success',
        text: 'Profile updated successfully.'
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile.'
      });
    }
  };

  const handlePreferenceChange = async (key: 'emailNotifications') => {
    try {
      const newPreferences = {
        ...preferences,
        [key]: !preferences[key]
      };
      
      setPreferences(newPreferences);
      
      await updateUserProfile(currentUser!.uid, {
        preferences: {
          ...userProfile?.preferences,
          [key]: newPreferences[key]
        }
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert the change
      setPreferences(preferences);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? This will end all your active sessions.')) {
      return;
    }

    try {
      setMessage({
        type: 'success',
        text: 'Logging out from all devices...'
      });

      await logoutAllDevices(currentUser!.uid);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out all devices:', error);
      setMessage({
        type: 'error',
        text: 'Failed to log out from all devices.'
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your data including your portfolio, watchlist, and preferences.'
    );

    if (!confirmDelete) return;

    // Double confirmation for extra security
    const confirmPhrase = window.prompt(
      'Please type "DELETE" to confirm account deletion:'
    );

    if (confirmPhrase !== 'DELETE') {
      setMessage({
        type: 'error',
        text: 'Account deletion cancelled. The confirmation phrase did not match.'
      });
      return;
    }

    try {
      setMessage({
        type: 'success',
        text: 'Deleting your account...'
      });

      await deleteUserAccount(currentUser!.uid);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete account. Please try again or contact support.'
      });
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>
      
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Account Information</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              leftIcon={isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Input
                    label="Display Name"
                    {...register('displayName', { required: 'Display name is required' })}
                    error={errors.displayName?.message as string}
                    disabled={!isEditing}
                    leftIcon={<User className="w-4 h-4 text-gray-400" />}
                  />
                </div>
                
                <div>
                  <Input
                    label="Email Address"
                    value={currentUser.email || ''}
                    disabled
                    leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Reset Password
                    </button>
                  </div>
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                  />
                </div>
                
                {isEditing && (
                  <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-gray-500">Use dark theme for the application</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive email notifications about market changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.emailNotifications}
                  onChange={() => handlePreferenceChange('emailNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            These actions are irreversible. Please be certain.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium">Log out of all devices</h3>
                <p className="text-sm text-gray-500">This will sign you out from all your active sessions</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogoutAllDevices}
              >
                Log Out All
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <h3 className="font-medium text-red-600">Delete Account</h3>
                <p className="text-sm text-gray-500">Permanently delete your account and all your data</p>
              </div>
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleDeleteAccount}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage