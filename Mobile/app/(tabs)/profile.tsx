import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Switch } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../context/AuthContext';
import { User, Edit2, Mail, Lock, LogOut, Moon, Bell, Trash2 } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function Profile() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [password, setPassword] = useState('********');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Auth form states
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const { theme, setThemeMode } = useTheme();

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // Optionally, update display name here if needed
        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Success', 'Logged out successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        Alert.alert('Account Deleted', 'Your account has been deleted.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      setIsEditing(false);
      Alert.alert('Success', 'Display name updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleToggleEmailNotifications = (value: boolean) => {
    setEmailNotifications(value);
    Alert.alert('Email Notifications', value ? 'Email notifications enabled (demo)!' : 'Email notifications disabled (demo)!');
  };

  if (user) {
    return (
      <ScrollView style={[styles.bg, { backgroundColor: theme.background }]} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <Text style={[styles.pageTitle, { color: theme.text }]}>Your Profile</Text>
        <Text style={[styles.pageSubtitle, { color: theme.subtitle }]}>Manage your account settings and preferences</Text>

        {/* Account Information Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Account Information</Text>
            {isEditing ? (
              <TouchableOpacity onPress={handleSaveDisplayName} disabled={saving} style={styles.saveButton}>
                <Text style={[styles.saveButtonText, saving && { opacity: 0.6 }]}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Edit2 size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtitle }]}>Display Name</Text>
            <View style={[styles.inputIconRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <User size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, !isEditing && { color: '#888' }, { color: theme.text }]}
                value={displayName}
                onChangeText={setDisplayName}
                editable={isEditing}
                placeholder="Full Name"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtitle }]}>Email Address</Text>
            <View style={[styles.inputIconRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Mail size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                editable={false}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtitle }]}>Password</Text>
            <View style={[styles.inputIconRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Lock size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={password}
                editable={false}
                secureTextEntry
                placeholderTextColor="#bbb"
              />
              <TouchableOpacity onPress={handleResetPassword}>
                <Text style={[styles.resetLink, { color: theme.primary }]}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Preferences</Text>
          <View style={styles.prefRow}>
            <View>
              <Text style={[styles.prefLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.prefDesc, { color: theme.subtitle }]}>Use dark theme for the application</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              thumbColor={darkMode ? theme.primary : '#ccc'}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
          <View style={styles.prefRow}>
            <View>
              <Text style={[styles.prefLabel, { color: theme.text }]}>Email Notifications</Text>
              <Text style={[styles.prefDesc, { color: theme.subtitle }]}>Receive email notifications about market changes</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={handleToggleEmailNotifications}
              thumbColor={emailNotifications ? theme.primary : '#ccc'}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </View>

        {/* Danger Zone Card */}
        <View style={[styles.cardDanger, { backgroundColor: theme.card, borderColor: '#ef4444' }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Danger Zone</Text>
          <Text style={styles.dangerDesc}>These actions are irreversible. Please be certain.</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Log out of all devices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Trash2 size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={18} color={theme.primary} />
          <Text style={[styles.logoutButtonText, { color: theme.primary }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Login/Signup form (if not logged in)
  return (
    <ScrollView style={[styles.bg, { backgroundColor: theme.background }]} contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'center' }}>
      <View style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.authTitleBig, { color: theme.text }]}>{isLogin ? 'Sign In to Your Account' : 'Create Your Account'}</Text>
        <Text style={[styles.authSubtitleBig, { color: theme.subtitle }]}>
          {isLogin ? 'Welcome back! Please sign in to continue.' : 'Join us to start tracking your investments'}
        </Text>
        {!isLogin && (
          <View style={styles.inputGroupAuth}>
            <View style={[styles.inputIconRowAuth, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <User size={18} color={theme.subtitle} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputAuth, { color: theme.text }]}
                placeholder="Full Name"
                value={authFullName}
                onChangeText={setAuthFullName}
                autoCapitalize="words"
                placeholderTextColor={theme.subtitle}
              />
            </View>
          </View>
        )}
        <View style={styles.inputGroupAuth}>
          <View style={[styles.inputIconRowAuth, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Mail size={18} color={theme.subtitle} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.inputAuth, { color: theme.text }]}
              placeholder="Email Address"
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={theme.subtitle}
            />
          </View>
        </View>
        <View style={styles.inputGroupAuth}>
          <View style={[styles.inputIconRowAuth, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Lock size={18} color={theme.subtitle} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.inputAuth, { color: theme.text }]}
              placeholder="Password"
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              placeholderTextColor={theme.subtitle}
            />
          </View>
        </View>
        <TouchableOpacity style={[styles.authButtonBig, { backgroundColor: theme.primary }]} onPress={handleAuth}>
          <Text style={styles.authButtonTextBig}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        <View style={styles.authSwitchRow}>
          <Text style={[styles.authSwitchText, { color: theme.subtitle }]}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={[styles.authSwitchLink, { color: theme.primary }]}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
    marginTop: 10,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#e5e5e5',
    width: '100%',
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  inputIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  resetLink: {
    color: '#3b82f6',
    fontSize: 13,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    width: '100%',
    gap: 8,
  },
  prefLabel: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 220,
  },
  prefDesc: {
    fontSize: 12,
    color: '#666',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 220,
  },
  cardDanger: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerDesc: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 10,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginVertical: 40,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  authTitleBig: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  authSubtitleBig: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 22,
  },
  inputGroupAuth: {
    marginBottom: 16,
  },
  inputIconRowAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  inputAuth: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  authButtonBig: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  authButtonTextBig: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  authSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  authSwitchText: {
    color: '#666',
    fontSize: 15,
  },
  authSwitchLink: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 2,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

Profile.options = {
  title: 'Profile',
}; 