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
  const [checking, setChecking] = useState<Set<string>>(new Set());
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

  // ⭐SUBMIT UPDATE (send OTP)

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setSuccess('');
  //   setLoading(true);
  //   setStatusMessage('Sending update request...');
  //   try {
  //     const res = await adminService.requestAdminUpdate(formData);

  //     if (res.flag) {
  //       setStatusMessage('OTP sent to your email. Please check your inbox.');
  //       setIsOtpStep(true); // show OTP popup
  //       // setSuccess('OTP sent to your email.');
  //       Swal.fire({
  //         icon: "success",
  //         title: "OTP Sent!",
  //         text: "A verification OTP has been sent to your email.",
  //         confirmButtonColor: "#4f46e5",
  //       });

  //     }
  //   } catch (err: any) {
  //     setError(err.message);
  //     setStatusMessage('');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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



  // ⭐ VERIFY OTP & SAVE UPDATE

  // const handleVerifyOtp = async () => {
  //   setError('');
  //   setSuccess('');
  //   setLoading(true);
  //   setStatusMessage('Verifying OTP...');
  //   try {
  //     const res = await adminService.verifyAdminOtp(otp);

  //     if (res.flag) {
  //       // setSuccess('Profile updated successfully!');
  //       Swal.fire({
  //         icon: "success",
  //         title: "Profile Updated!",
  //         text: "Your profile has been updated successfully.",
  //         confirmButtonColor: "#10b981",
  //       });

  //       setIsOtpStep(false);
  //       setIsEditing(false);
  //       setStatusMessage('');
  //       loadAdmin();
  //     }
  //   } catch (err: any) {
  //     // setError(err.message);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Something went wrong",
  //       text: err.message || "Please try again",
  //       confirmButtonColor: "#dc2626",
  //     });

  //     setStatusMessage('');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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
  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    uiField: string,
    fieldColumn: string,
    excludeId?: string
  ) => {
    setChecking((prev) => new Set(prev).add(uiField));

    const res = await validationService.validateField({
      field,
      value,
      mode: "edit",
      excludeId,
      fieldColumn,
    });

    setChecking((prev) => {
      const newSet = new Set(prev);
      newSet.delete(uiField);
      return newSet;
    });

    setErrors((prev: any) => ({
      ...prev,
      [uiField]: res.exists ? res.message : "",
    }));
  };

  // ⭐ REGEX RULES

  const adminEmailRegex = /^[a-zA-Z0-9._%+-]+@digiquadsolutions\.com$/;
  // const adminEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const adminPhoneRegex = /^[6-9]\d{9}$/;

  // ⭐ MANUAL VALIDATION FUNCTION
  const validateField = (name: string, value: string) => {
    let error = '';

    // ⭐ EMAIL
    if (name === "email") {
      if (!value) error = "Required";
      else if (!adminEmailRegex.test(value)) {
        error = "Email must be @digiquadsolutions.com";
      }
    }

    // ⭐ CONTACT NUMBER
    if (name === "contactNumber") {
      if (!value) error = "Required";
      else if (!adminPhoneRegex.test(value)) {
        error = "Invalid 10-digit mobile number";
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleFieldValidation = async (name: string, value: string) => {
    const manualError = validateField(name, value);
    if (manualError) return; // stop if regex/manual fails

    setChecking((prev) => new Set(prev).add(name));

    const res = await validationService.validateField({
      field: name === "email" ? "EMAIL" : "CONTACT_NUMBER",
      value,
      mode: "edit",
      fieldColumn: name === "contactNumber" ? "contact_number" : "email",
      excludeId: admin.adminId,
    });

    setChecking((prev) => {
      const s = new Set(prev);
      s.delete(name);
      return s;
    });

    setErrors((prev) => ({
      ...prev,
      [name]: res.exists ? `${name === "email" ? "Email" : "Contact number"} already exists` : "",
    }));
  };


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

                {/* FULL NAME */}
                <div>
                  <label className="block font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    disabled={!isEditing}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-xl text-sm sm:text-base"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    onBlur={(e) => handleFieldValidation("email", e.target.value.trim())}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-xl text-sm sm:text-base"
                  />

                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}

                  {checking.has("email") && (
                    <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                  )}
                </div>

                {/* CONTACT NUMBER */}
                <div>
                  <label className="block font-semibold mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="contactNumber"
                    disabled={!isEditing}
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNumber: e.target.value })
                    }
                    onBlur={(e) =>
                      handleFieldValidation("contactNumber", e.target.value.trim())
                    }
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-xl text-sm sm:text-base"
                  />

                  {errors.contactNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>
                  )}

                  {checking.has("contactNumber") && (
                    <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                  )}
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
