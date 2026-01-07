'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PasswordService } from '@/lib/api/passwordService';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'identifier' | 'otp' | 'newPassword'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [otpTyped, setOtpTyped] = useState(false);

  const [showOtpSuccess, setShowOtpSuccess] = useState(false);
  // Real-time password reuse check
  const [passwordCheckStatus, setPasswordCheckStatus] = useState<'idle' | 'checking' | 'used' | 'available'>('idle');
  const [passwordCheckMessage, setPasswordCheckMessage] = useState('');
  const [canEnterOTP, setCanEnterOTP] = useState(false);


  const router = useRouter();
  const passwordService = new PasswordService();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp') {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateNewPassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character.';
    if (/\s/.test(pwd)) return 'Password cannot contain spaces.';
    return '';
  };

  // REAL-TIME PASSWORD REUSE CHECK - Shows "Already Used!!" from backend
  useEffect(() => {
    setPasswordCheckStatus('idle');
    setPasswordCheckMessage('');

    if (!newPassword || newPassword.length < 8 || newPasswordError) return;
    if (confirmNewPassword && newPassword !== confirmNewPassword) return;

    const timer = setTimeout(async () => {
      setPasswordCheckStatus('checking');
      try {
        const res = await passwordService.checkPassword({
          companyEmail: identifier,
          newPassword: newPassword,
        });

        if (res.flag && res.response === false) {
          setPasswordCheckStatus('used');
          setPasswordCheckMessage(res.message);
        } else if (res.flag && res.response === true) {
          setPasswordCheckStatus('available');
          // setPasswordCheckMessage('Password is available');
        }
      } catch (err) {
        setPasswordCheckStatus('idle');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [newPassword, newPasswordError, confirmNewPassword, identifier]);

  const sendOTP = async (id: string) => {
    setError(''); setIsLoading(true);
    try {
      const res = await passwordService.sendOTP(id);
      if (res.flag) {
        setSuccessMessage('OTP sent successfully to your email.');
        setOtpDigits(['', '', '', '', '', '']);
        setCountdown(300);
        setCanEnterOTP(true); // ✅ SHOW OTP UI
      } else {
        setError(res.message || 'Failed to send OTP.');
        setCanEnterOTP(false); //  HIDE OTP UI
      }
    } catch (err: any) {
      const status = err?.response?.status;
      setError(err?.response?.data?.response?.message || 'Failed to send OTP.');
      if (status === 404) {
        setCanEnterOTP(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    sendOTP(identifier);
    setStep('otp');
  };

  const handleResendOTP = () => sendOTP(identifier);

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/[0-9]/.test(value) && value !== '') return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!otpTyped && value) setOtpTyped(true);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (!fullOtp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await passwordService.verifyOTP(identifier, fullOtp);
      if (response.flag && response.response?.verified) {
        setSuccessMessage('OTP verified successfully.');
        setShowOtpSuccess(true); // Trigger the 3-second timer

        // Auto-hide message after 3 seconds and go to next step
        setTimeout(() => {
          setSuccessMessage('');
          setShowOtpSuccess(false);
          setStep('newPassword');
        }, 3000); // 3 seconds
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      console.log("verifyOTP AXIOS ERROR 👉",err.message )
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewPassword(val);
    setNewPasswordError(validateNewPassword(val));
    setPasswordCheckStatus('idle');
    setPasswordCheckMessage('');
    setConfirmPasswordError(confirmNewPassword && confirmNewPassword !== val ? 'Passwords do not match.' : '');  
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmNewPassword(val);
    setConfirmPasswordError(val !== newPassword ? 'Passwords do not match.' : '');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPasswordError || confirmPasswordError || passwordCheckStatus === 'used') {
      setError('Please fix the errors above.');
      return;
    }
    setIsLoading(true);
    try {
      const otp = otpDigits.join('');
      const res = await passwordService.resetPassword(identifier, otp, newPassword);
      if (res.flag) {
        setSuccessMessage('Password reset successfully!');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'identifier':
        return (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter your Email</label>
              <input
                id="identifier"
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                placeholder="your.email@example.com"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-3 text-gray-900 placeholder-gray-400 transition duration-200"
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium">
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        );

        case 'otp':
          return (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
        
              {canEnterOTP && (
                <>
                  {/* OTP INPUTS */}
                  <div className="text-center">
                    <label className="block text-sm font-bold text-gray-900 mb-4">
                      Enter OTP
                    </label>
                    <div className="flex justify-center gap-3">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { if (el) otpRefs.current[i] = el; }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
        
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.every(d => !d)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
        
                  <div className="text-center text-sm">
                    {countdown > 0
                      ? `Resend in ${formatTime(countdown)}`
                      : <button onClick={handleResendOTP} className="text-indigo-600 hover:underline">Resend OTP</button>
                    }
                  </div>
                </>
              )}
        
            </form>
          );        

      case 'newPassword':
        return (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Hidden field to fix accessibility warning */}
            <input type="text" autoComplete="username" value={identifier} className="hidden" readOnly />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border pr-12 py-3 px-4 transition-all ${passwordCheckStatus === 'used' || newPasswordError
                    ? 'border-red-500 focus:border-red-500'
                    : passwordCheckStatus === 'available'
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:border-indigo-500'
                    } focus:ring-indigo-500 shadow-sm`}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>

                {/* Icons */}
                {passwordCheckStatus === 'checking' && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                {passwordCheckStatus === 'available' && <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                {passwordCheckStatus === 'used' && <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />}
              </div>

              {/* Messages */}
              <div className="mt-2 space-y-1">
                {newPasswordError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> {newPasswordError}
                  </p>
                )}
                {passwordCheckMessage && (
                  <p className={`text-sm flex items-center gap-1 ${passwordCheckStatus === 'used' ? 'text-red-600' : 'text-green-600'}`}>
                    {passwordCheckStatus === 'used' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {passwordCheckMessage}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Retype New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Retype your new password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 pr-12"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPasswordError && <p className="mt-2 text-sm text-red-600">{confirmPasswordError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !!newPasswordError || !!confirmPasswordError || passwordCheckStatus === 'used' || passwordCheckStatus === 'checking'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium shadow-md"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-50 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 p-8">
        <div className="text-center mb-8">
          <Image src="/digiquad logo.jpeg" alt="Logo" width={80} height={80}
            style={{ width: 'auto', height: 'auto' }}
            className="mx-auto rounded-full shadow-sm" />
          <h1 className="text-3xl font-extrabold text-gray-900 mt-4">
            {step === 'identifier' ? 'Forgot Password?' : step === 'otp' ? 'Verify OTP' : 'Create New Password'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'identifier' && 'Enter your email to receive an OTP.'}
            {step === 'otp' && 'Enter the OTP sent to your email.'}
            {step === 'newPassword' && 'Create a strong password for your account.'}
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">{error}</div>}
        {successMessage && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-4">{successMessage}</div>}

        {renderStep()}

        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Back to Login</Link>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} <span className="font-semibold text-indigo-600">
            {" "}
            <a
              href="https://digiquadsolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              DigiQuad Technologies
            </a>
          </span>
          . All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default ForgotPassword;