import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import {
  User,
  Package,
  MapPin,
  Heart,
  RotateCcw,
  MessageSquare,
  LogOut,
  Truck,
  Plus,
  Trash2,
  Phone,
  Mail,
  Building,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { updateUserProfile } from '@/lib/auth';

interface CustomerOrder {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  fulfillment_status: string;
  shipping_address: Record<string, unknown> | null;
  payment_method: string | null;
}

interface SavedAddress {
  id: string;
  recipient_name: string;
  phone_number: string;
  street_address: string;
  building_name?: string | null;
  city: string;
  county: string;
  is_default: boolean;
}

export default function AccountPage() {
  const {
    user,
    profile,
    isAuthenticated,
    isLoading: authLoading,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    refreshProfile,
  } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'returns' | 'tickets' | 'profile'>('orders');

  // Unauthenticated auth mode: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Customer Data states
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Add Address Modal state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newCity, setNewCity] = useState('Nairobi');
  const [newCounty, setNewCounty] = useState('Nairobi County');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Profile Edit state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Returns state
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  // Synchronize profile fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditFullName(profile.full_name || '');
      setEditPhone(profile.phone || '');
      setEditCompany(profile.company_name || '');
    }
  }, [profile]);

  // Fetch customer orders
  const loadCustomerOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`customer_id.eq.${user.id},customer_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('[Account] Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  // Fetch customer addresses
  const loadCustomerAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && data) {
        setAddresses(data);
      }
    } catch (err) {
      console.warn('[Account] Error loading addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCustomerOrders();
      loadCustomerAddresses();
    }
  }, [isAuthenticated, user, loadCustomerOrders, loadCustomerAddresses]);

  // Handle customer login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);

    const result = await login(signInEmail, signInPassword);
    setSignInLoading(false);

    if (result.success) {
      toast({ title: 'Welcome back!', description: 'You have signed in successfully.' });
    } else {
      setSignInError(result.error || 'Invalid email or password.');
    }
  };

  // Handle customer registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (signUpPassword.length < 8) {
      setSignUpError('Password must be at least 8 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please re-check.');
      return;
    }

    setSignUpLoading(true);
    const result = await register(signUpEmail, signUpPassword, {
      fullName: signUpFullName.trim(),
      phone: signUpPhone.trim() || undefined,
      companyName: signUpCompany.trim() || undefined,
      role: 'customer',
    });
    setSignUpLoading(false);

    if (result.success) {
      toast({
        title: 'Account Created!',
        description: 'Your account has been registered. You are now signed in.',
      });
    } else {
      setSignUpError(result.error || 'Registration failed. Please try again.');
    }
  };

  // Handle password reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    const result = await resetPassword(forgotEmail);
    setForgotLoading(false);

    if (result.success) {
      setForgotSuccess(true);
    } else {
      setForgotError(result.error || 'Failed to send reset link. Please check the email.');
    }
  };

  // Handle customer logout
  const handleLogout = async () => {
    await logout();
    toast({ title: 'Signed Out', description: 'You have successfully signed out.' });
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    const { error } = await updateUserProfile(user.id, {
      full_name: editFullName.trim(),
      phone: editPhone.trim() || null,
      company_name: editCompany.trim() || null,
    });
    setSavingProfile(false);

    if (!error) {
      await refreshProfile();
      toast({ title: 'Profile Updated', description: 'Your personal information has been saved.' });
    } else {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Passwords do not match', description: 'Please retype matching passwords.', variant: 'destructive' });
      return;
    }

    setSavingPassword(true);
    const result = await changePassword(newPassword);
    setSavingPassword(false);

    if (result.success) {
      setNewPassword('');
      setConfirmNewPassword('');
      toast({ title: 'Password Changed', description: 'Your account password has been updated securely.' });
    } else {
      toast({ title: 'Change Failed', description: result.error || 'Could not change password.', variant: 'destructive' });
    }
  };

  // Handle adding address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingAddress(true);

    try {
      if (newIsDefault) {
        // Reset previous default addresses
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        recipient_name: newRecipientName.trim(),
        phone_number: newPhone.trim(),
        street_address: newStreet.trim(),
        building_name: newBuilding.trim() || null,
        city: newCity.trim(),
        county: newCounty.trim(),
        is_default: newIsDefault,
      });

      if (!error) {
        setShowAddAddress(false);
        setNewRecipientName('');
        setNewPhone('');
        setNewStreet('');
        setNewBuilding('');
        await loadCustomerAddresses();
        toast({ title: 'Address Saved', description: 'New delivery address added.' });
      } else {
        toast({ title: 'Failed to add address', description: error.message, variant: 'destructive' });
      }
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', addressId);
    if (!error) {
      await loadCustomerAddresses();
      toast({ title: 'Address Removed', description: 'The address has been deleted.' });
    }
  };

  // Handle return request submit
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || !returnReason.trim()) {
      toast({ title: 'Please provide all details', description: 'Select an order and describe reason.', variant: 'destructive' });
      return;
    }
    setReturnSubmitted(true);
    toast({
      title: 'Return Request Submitted',
      description: 'Our customer support team will contact you within 24 hours to schedule pickup.',
    });
  };

  if (authLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-navy-50/20 py-20 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-navy-800 font-semibold text-sm">Loading account...</span>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  // --------------------------------------------------------------------------
  // UNAUTHENTICATED STATE: SIGN IN / SIGN UP / FORGOT PASSWORD
  // --------------------------------------------------------------------------
  if (!isAuthenticated || !user) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-navy-50/20 py-12 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-navy-100 p-8 shadow-sm">
            {/* Header Brand */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-navy-950 text-amber-400 flex items-center justify-center font-display font-black text-2xl mx-auto mb-3 shadow-md">
                M
              </div>
              <h1 className="font-display font-extrabold text-2xl text-navy-950">
                {authMode === 'signin' && 'Sign In to Your Account'}
                {authMode === 'signup' && 'Create Customer Account'}
                {authMode === 'forgot' && 'Reset Your Password'}
              </h1>
              <p className="text-navy-500 text-xs font-semibold mt-1">
                {authMode === 'signin' && 'Access past orders, track deliveries, and save addresses'}
                {authMode === 'signup' && 'Register for fast commercial equipment purchasing'}
                {authMode === 'forgot' && 'Enter your email to receive password reset instructions'}
              </p>
            </div>

            {/* Tab switchers */}
            <div className="flex bg-navy-50 p-1 rounded-xl mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setSignInError(''); }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  authMode === 'signin' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500 hover:text-navy-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setSignUpError(''); }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  authMode === 'signup' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500 hover:text-navy-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <div>
                {forgotSuccess ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-bold text-navy-900 text-sm">Check your inbox</h3>
                    <p className="text-xs text-navy-500">
                      We sent password reset instructions to <strong>{forgotEmail}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setForgotSuccess(false); }}
                      className="btn-primary w-full mt-2"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {forgotError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {forgotError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-navy-800 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 bg-navy-950 hover:bg-navy-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      {forgotLoading ? 'Sending Instructions...' : 'Send Reset Link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="w-full text-center text-xs text-navy-500 hover:text-navy-800 font-semibold"
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                {signInError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {signInError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-navy-800">Password</label>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setForgotEmail(signInEmail); }}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Enter account password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full py-3 bg-navy-950 hover:bg-navy-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {signInLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In to Account</span>
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                {signUpError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {signUpError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="text"
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Chef / Manager Name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="name@business.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-navy-800 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                      <input
                        type="tel"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-800 mb-1">Business / Hotel</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                      <input
                        type="text"
                        value={signUpCompany}
                        onChange={(e) => setSignUpCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="Company Name"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="password"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-navy-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full py-3 bg-navy-950 hover:bg-navy-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {signUpLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Create My Customer Account</span>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-navy-100 text-center">
              <p className="text-xs text-navy-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by Supabase Authentication & PostgreSQL RLS</span>
              </p>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED STATE: CUSTOMER DASHBOARD
  // --------------------------------------------------------------------------
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Customer';
  const displayEmail = profile?.email || user.email || '';
  const displayCompany = profile?.company_name || 'Commercial Customer';
  const displayPhone = profile?.phone || 'Not provided';

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-navy-50/20 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Profile Banner */}
          <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-950 text-amber-400 flex items-center justify-center font-display font-black text-2xl shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl text-navy-950">{displayName}</h1>
                <p className="text-navy-500 text-xs font-semibold">{displayCompany} • {displayEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase">
                    Verified Customer Account
                  </span>
                  <span className="text-xs text-navy-400 font-mono">{displayPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/shop" className="px-5 py-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs shadow-sm transition-all">
                Browse Equipment →
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-navy-600 hover:text-red-600 font-bold text-xs border border-gray-200 transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Account Portal Main Grid */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* LEFT NAVIGATION MENU */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-navy-100 p-3 shadow-sm space-y-1 sticky top-24">
                {[
                  { id: 'orders', label: 'My Orders & Tracking', icon: Package },
                  { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
                  { id: 'wishlist', label: 'Saved Wishlist', icon: Heart },
                  { id: 'returns', label: 'Returns & Claims', icon: RotateCcw },
                  { id: 'tickets', label: 'Customer Support', icon: MessageSquare },
                  { id: 'profile', label: 'Profile & Security', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs text-left transition-all ${
                        isActive
                          ? 'bg-navy-950 text-white shadow-sm'
                          : 'text-navy-600 hover:bg-navy-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT TAB CONTENT */}
            <div className="lg:col-span-3">
              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-navy-100">
                    <h2 className="font-display font-extrabold text-xl text-navy-950">
                      My Order History & Tracking
                    </h2>
                    <span className="text-xs text-navy-500 font-bold">{orders.length} orders found</span>
                  </div>

                  {loadingOrders ? (
                    <div className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-navy-500 font-medium">Fetching your orders from database...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                      <p className="font-bold text-navy-950 text-sm">No orders placed yet</p>
                      <p className="text-navy-500 text-xs mt-1">Once you order commercial equipment, delivery status and receipts appear here.</p>
                      <Link href="/shop" className="btn-primary mt-4 inline-flex text-xs">
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((ord) => (
                        <div key={ord.id} className="border border-navy-100 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-navy-200 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy-100 text-xs font-semibold">
                            <div>
                              <span className="text-navy-400 uppercase font-bold text-[10px]">Order Ref</span>
                              <h4 className="font-display font-extrabold text-base text-navy-950">{ord.order_number || ord.id.slice(0, 8)}</h4>
                              <span className="text-navy-400">{new Date(ord.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                                ord.fulfillment_status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}>
                                {ord.fulfillment_status?.toUpperCase() || 'PROCESSING'}
                              </span>

                              <Link
                                href={`/order-confirmation/${ord.id}`}
                                className="px-3 py-1.5 rounded-xl border border-navy-200 text-navy-900 font-bold hover:bg-navy-50"
                              >
                                View Order
                              </Link>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-navy-700">Total Order Amount</span>
                            <span className="font-bold text-navy-950 text-base">{formatKES(ord.total_amount)}</span>
                          </div>

                          {/* Tracking status bar */}
                          <div className="pt-3 border-t border-navy-100 bg-navy-50/50 p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between text-xs font-bold text-navy-950">
                              <span className="flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-amber-600" />
                                Status: {ord.fulfillment_status === 'delivered' ? 'Package Delivered' : 'Out for Courier Dispatch'}
                              </span>
                              <span className="text-navy-500">{ord.payment_method || 'M-PESA / Bank'}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 pt-1">
                              {['Placed', 'Confirmed', 'Dispatched', 'Delivered'].map((stepName, sIdx) => {
                                const isComplete = sIdx <= (ord.fulfillment_status === 'delivered' ? 3 : 1);
                                return (
                                  <div key={stepName} className="space-y-1 text-center">
                                    <div className={`h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-navy-200'}`} />
                                    <span className="text-[10px] font-bold text-navy-600">{stepName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADDRESSES TAB */}
              {activeTab === 'addresses' && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-navy-100">
                    <div>
                      <h2 className="font-display font-extrabold text-xl text-navy-950">Saved Delivery Addresses</h2>
                      <p className="text-navy-500 text-xs mt-0.5">Manage delivery sites, kitchen warehouses, and billing hubs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(!showAddAddress)}
                      className="px-4 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      {showAddAddress ? 'Cancel' : 'Add New Address'}
                    </button>
                  </div>

                  {/* Add Address Form */}
                  {showAddAddress && (
                    <form onSubmit={handleAddAddress} className="p-6 bg-navy-50/50 rounded-2xl border border-navy-200 space-y-4">
                      <h3 className="font-bold text-sm text-navy-950">New Delivery Location</h3>
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-navy-800 mb-1">Recipient / Contact Name *</label>
                          <input
                            type="text"
                            value={newRecipientName}
                            onChange={(e) => setNewRecipientName(e.target.value)}
                            className="input w-full"
                            placeholder="e.g. Site Manager / Kitchen Store"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-800 mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="input w-full"
                            placeholder="+254 700 000 000"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-800 mb-1">Street / Road Address *</label>
                          <input
                            type="text"
                            value={newStreet}
                            onChange={(e) => setNewStreet(e.target.value)}
                            className="input w-full"
                            placeholder="e.g. Industrial Area Road, Block 4"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-800 mb-1">Building / Floor / Landmark</label>
                          <input
                            type="text"
                            value={newBuilding}
                            onChange={(e) => setNewBuilding(e.target.value)}
                            className="input w-full"
                            placeholder="e.g. Commercial Complex, Ground Floor"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-800 mb-1">City / Town *</label>
                          <input
                            type="text"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            className="input w-full"
                            placeholder="Nairobi"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-800 mb-1">County *</label>
                          <input
                            type="text"
                            value={newCounty}
                            onChange={(e) => setNewCounty(e.target.value)}
                            className="input w-full"
                            placeholder="Nairobi County"
                            required
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy-800">
                        <input
                          type="checkbox"
                          checked={newIsDefault}
                          onChange={(e) => setNewIsDefault(e.target.checked)}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Set as default delivery address</span>
                      </label>

                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="btn-primary text-xs py-2 px-6"
                      >
                        {savingAddress ? 'Saving Address...' : 'Save Address'}
                      </button>
                    </form>
                  )}

                  {loadingAddresses ? (
                    <div className="text-center py-8">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-navy-500">Loading addresses...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-navy-200 rounded-2xl">
                      <MapPin className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                      <p className="font-bold text-navy-950 text-sm">No saved delivery addresses</p>
                      <p className="text-navy-500 text-xs mt-1">Add your hotel, restaurant, or factory address for one-click checkout.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="p-5 rounded-2xl border border-navy-100 space-y-2 relative bg-navy-50/20 flex flex-col justify-between">
                          <div>
                            {addr.is_default && (
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase inline-block mb-2">
                                Default Delivery Address
                              </span>
                            )}
                            <h4 className="font-display font-bold text-sm text-navy-950">{addr.recipient_name}</h4>
                            <p className="text-xs text-navy-600">{addr.street_address}{addr.building_name ? `, ${addr.building_name}` : ''}</p>
                            <p className="text-xs text-navy-500 font-semibold">{addr.city}, {addr.county}</p>
                            <p className="text-xs text-navy-400 font-mono mt-1">{addr.phone_number}</p>
                          </div>
                          <div className="pt-3 border-t border-navy-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WISHLIST TAB */}
              {activeTab === 'wishlist' && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <h2 className="font-display font-extrabold text-xl text-navy-950 pb-4 border-b border-navy-100">
                    Saved Commercial Equipment Wishlist
                  </h2>
                  <p className="text-navy-500 text-xs">Save kitchen units for fast project quotations and bulk restock.</p>
                  <div className="text-center py-10 border border-dashed border-navy-200 rounded-2xl">
                    <Heart className="w-10 h-10 text-navy-300 mx-auto mb-2" />
                    <p className="font-bold text-navy-950 text-xs">Your wishlist is currently empty</p>
                    <Link href="/shop" className="text-xs font-bold text-amber-700 hover:underline mt-2 inline-block">
                      Browse commercial catalog to save products →
                    </Link>
                  </div>
                </div>
              )}

              {/* RETURNS TAB */}
              {activeTab === 'returns' && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <h2 className="font-display font-extrabold text-xl text-navy-950 pb-4 border-b border-navy-100">
                    Warranty Claims & Equipment Returns
                  </h2>
                  <p className="text-xs text-navy-600">
                    All machinery is backed by standard warranty. If you received damaged items or require maintenance return, submit your claim below.
                  </p>

                  <form onSubmit={handleReturnSubmit} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-navy-700 uppercase mb-1">Select Order Reference *</label>
                      <select
                        value={returnOrderId}
                        onChange={(e) => setReturnOrderId(e.target.value)}
                        className="input w-full"
                        required
                      >
                        <option value="">-- Choose Order --</option>
                        {orders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.order_number || o.id.slice(0, 8)} — {formatKES(o.total_amount)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy-700 uppercase mb-1">Reason for Claim *</label>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="Please describe equipment issue or reason for return..."
                        className="input w-full h-28 resize-none py-3"
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary text-xs py-2.5 px-6">
                      Submit Return Claim
                    </button>
                  </form>
                </div>
              )}

              {/* SUPPORT TICKETS TAB */}
              {activeTab === 'tickets' && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <h2 className="font-display font-extrabold text-xl text-navy-950 pb-4 border-b border-navy-100">
                    Customer Support & Technical Inquiries
                  </h2>
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-3">
                    <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                      <Phone className="w-4 h-4 text-amber-700" /> Commercial Kitchen Helpdesk
                    </h4>
                    <p className="text-amber-900 leading-relaxed">
                      For urgent inquiries, machinery breakdown support, or delivery updates, call our Nairobi hotline at <strong>+254 700 000 000</strong> or email <strong>support@meggskitchen.com</strong>.
                    </p>
                    <div className="pt-2">
                      <Link href="/contact" className="btn-primary text-xs py-2 px-4 inline-flex">
                        Contact Support Form
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE & SECURITY SETTINGS TAB */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-8">
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-navy-950 pb-4 border-b border-navy-100">
                      Profile & Contact Details
                    </h2>
                    <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4 max-w-xl">
                      <div className="grid sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-navy-700 uppercase mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            className="input w-full"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-700 uppercase mb-1">Email Address</label>
                          <input
                            type="email"
                            value={profile?.email || user.email || ''}
                            readOnly
                            className="input w-full bg-gray-100 text-navy-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-700 uppercase mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="input w-full"
                            placeholder="+254 700 000 000"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-700 uppercase mb-1">Company / Organization</label>
                          <input
                            type="text"
                            value={editCompany}
                            onChange={(e) => setEditCompany(e.target.value)}
                            className="input w-full"
                            placeholder="Restaurant or Hotel Name"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="btn-primary text-xs py-2 px-6"
                      >
                        {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                      </button>
                    </form>
                  </div>

                  <div className="pt-6 border-t border-navy-100">
                    <h3 className="font-display font-extrabold text-lg text-navy-950 mb-2">
                      Change Account Password
                    </h3>
                    <p className="text-xs text-navy-500 mb-4">
                      Update your account security password (minimum 8 characters).
                    </p>

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl text-xs">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-navy-700 uppercase mb-1">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input w-full"
                            placeholder="New password (min 8 chars)"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-navy-700 uppercase mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="input w-full"
                            placeholder="Repeat new password"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="btn-primary text-xs py-2 px-6"
                      >
                        {savingPassword ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
