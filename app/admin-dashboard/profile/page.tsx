'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  User, Mail, Calendar, Edit3, Save, X, CheckCircle, AlertCircle, KeyRound,
  Loader2
} from 'lucide-react';
import { adminService } from '@/lib/api/adminService';
import { UniqueField, validationService } from '@/lib/api/validationService';
import Swal from 'sweetalert2';
import { useFormFieldHandlers } from '@/hooks/useFormFieldHandlers';
import { useUniquenessCheck } from '@/hooks/useUniqueCheck';
export default function AdminProfilePage() {
  const { state, logout } = useAuth();
  const user = state.user;

  const [admin, setAdmin] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Reuse shared form hooks
const { checkUniqueness, checking } = useUniquenessCheck(setErrors);

const { 
  handleValidatedChange, 
  handleUniqueBlur, 
  fieldError 
} = useFormFieldHandlers(
  (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  },
  setErrors,
  checkUniqueness,
  () => formData,
  // Admin-specific validation rules
  (name: string, value: string) => {
    let error = '';

    if (name === "email") {
      if (!value.trim()) error = "Email is required";
      else if (!/^[a-zA-Z0-9._%+-]+@digiquadsolutions\.com$/.test(value)) {
        error = "Email must end with @digiquadsolutions.com";
      }
    }

    if (name === "contactNumber") {
      if (!value.trim()) error = "Contact number is required";
      else if (!/^[6-9]\d{9}$/.test(value)) {
        error = "Invalid 10-digit mobile number (starts with 6-9)";
      }
    }

    return error;
  }
);
  // ⭐ LOAD ADMIN PROFILE
  const loadAdmin = async () => {
    try {
      const res = await adminService.getAdminProfile();
      if (res.flag && res.response) {
        setAdmin(res.response);
        setFormData({
          fullName: res.response.fullName,
          email: res.response.email,
          contactNumber: res.response.contactNumber,
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsOtpStep(false);
    setOtp('');
    setError('');
    setSuccess('');
    loadAdmin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("Sending update request...");

    try {
      const res = await adminService.requestAdminUpdate(formData);

      if (res.flag) {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: "A verification OTP has been sent to your email.",
          confirmButtonColor: "#4f46e5",
        });

        setIsOtpStep(true);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: err.message || "Something went wrong",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setStatusMessage("Verifying OTP...");

    try {
      const res = await adminService.verifyAdminOtp(otp);

      if (res.flag) {
        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Your profile has been updated successfully.",
          confirmButtonColor: "#10b981",
        });

        setIsOtpStep(false);
        setIsEditing(false);
        loadAdmin();
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: err.message || "Please try again",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };


  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  const initials = admin.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
 






  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-3 sm:py-8 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {loading && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[999]">
              <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium text-gray-700">{statusMessage || "Processing..."}</p>
              </div>
            </div>
          )}
          {/* PROFILE CARD */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">

                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                    {initials}
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <User className="w-8 h-8" />
                    {admin.fullName}
                  </h1>
                  <p className="text-indigo-100 mt-1 text-lg">Administrator</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {new Date(admin.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT PROFILE SECTION */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Edit3 className="w-6 h-6 text-indigo-600" />
                Edit Profile
              </h2>

              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl shadow"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button onClick={handleCancel} className="px-5 py-3 border rounded-xl">
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="profileForm"
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl shadow"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* FORM */}
            <form id="profileForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* FULL NAME – simple, no uniqueness */}
  <div className="space-y-1">
    <label className="block font-semibold mb-2 text-gray-700">
      Full Name
    </label>
    <input
      type="text"
      name="fullName"
      disabled={!isEditing}
      value={formData.fullName}
      onChange={handleValidatedChange}
      placeholder="Enter full name"
      className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-xl text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </div>

  {/* EMAIL – with real-time validation + uniqueness on blur */}
  <div className="space-y-1">
    <label className="block font-semibold mb-2 text-gray-700">
      Email <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type="email"
        name="email"
        disabled={!isEditing}
        value={formData.email}
        onChange={handleValidatedChange}
        onBlur={() => handleUniqueBlur(
          "EMAIL",             // field type for API
          "email",             // DB column name
          "email",             // error key
          admin?.adminId       // exclude current admin ID
        )}
        placeholder="admin@digiquadsolutions.com"
        className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-xl text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {checking.has("email") && (
        <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600" />
      )}
    </div>

    {fieldError(errors, "email")}
  </div>

  {/* CONTACT NUMBER – with real-time validation + uniqueness on blur */}
  <div className="space-y-1">
    <label className="block font-semibold mb-2 text-gray-700">
      Contact Number <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type="text"
        name="contactNumber"
        disabled={!isEditing}
        value={formData.contactNumber}
        onChange={(e) => {
          if (/^\d*$/.test(e.target.value)) {
            handleValidatedChange(e);
          }
        }}  
        onBlur={() => handleUniqueBlur(
          "CONTACT_NUMBER",
          "contact_number",
          "contactNumber",
          admin?.adminId
        )}
        maxLength={10}
        placeholder="9876543210"
        className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-xl text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {checking.has("contactNumber") && (
        <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600" />
      )}
    </div>

    {fieldError(errors, "contactNumber")}
  </div>

</div>
            </form>

          </div>
        </div>
      </div>

      {/* ==========================
        ⭐ OTP POPUP UI
      ========================== */}
      {isOtpStep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              Enter OTP
            </h2>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl mb-4"
              placeholder="Enter OTP"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
