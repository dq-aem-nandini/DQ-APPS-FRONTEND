'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeModel, ClientDTO, Designation, EmployeeDTO } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Client {
  id: string;
  name: string;
}

interface FormEmployeeModel extends Omit<EmployeeModel, 'designation' | 'clientId'> {
  designation: string;
  clientId?: string;
  confirmPanNumber: string;
  confirmAadharNumber: string;
}

const AddEmployeePage = () => {
  const [formData, setFormData] = useState<FormEmployeeModel>({
    firstName: '',
    lastName: '',
    personalEmail: '',
    companyEmail: '',
    contactNumber: '',
    alternateContactNumber: '',
    gender: '',
    reportingManagerId: '',
    maritalStatus: '',
    numberOfChildren: 0,
    employeePhotoUrl: '',
    clientId: '',
    designation: '',
    dateOfBirth: '',
    dateOfJoining: '',
    currency: '',
    rateCard: 0,
    panNumber: '',
    aadharNumber: '',
    confirmPanNumber: '',
    confirmAadharNumber: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<EmployeeDTO[]>([]);
  const [documentFiles, setDocumentFiles] = useState({
    photo: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { state } = useAuth();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const maxJoiningDate = new Date();
  maxJoiningDate.setMonth(maxJoiningDate.getMonth() + 3);
  const maxJoiningDateStr = maxJoiningDate.toISOString().split('T')[0];

  const designations: Designation[] = [
    'INTERN',
    'TRAINEE',
    'ASSOCIATE_ENGINEER',
    'SOFTWARE_ENGINEER',
    'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER',
    'TEAM_LEAD',
    'TECHNICAL_ARCHITECT',
    'REPORTING_MANAGER',
    'DELIVERY_MANAGER',
    'DIRECTOR',
    'VP_ENGINEERING',
    'CTO',
    'HR',
    'FINANCE',
    'OPERATIONS'
  ];

  const managerDesignations: Designation[] = [
    'REPORTING_MANAGER',
    'DELIVERY_MANAGER',
    'DIRECTOR',
    'VP_ENGINEERING',
    'CTO'
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clientList, managerPromises] = await Promise.all([
          adminService.getAllClients(),
          Promise.all(managerDesignations.map(des => adminService.getEmployeesByDesignation(des)))
        ]);
        setClients(clientList.map((client: ClientDTO) => ({
          id: client.clientId,
          name: client.companyName,
        })));
        const managerLists = await Promise.all(managerPromises);
        const allManagers = managerLists.flat();
        setManagers(allManagers);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Please try again.');
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    if (name === 'personalEmail' || name === 'companyEmail') {
      parsedValue = value.toLowerCase();
    } else if (name === 'rateCard') {
      parsedValue = parseFloat(value) || 0;
    } else if (name === 'numberOfChildren') {
      parsedValue = parseInt(value) || 0;
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleFileChange = (field: keyof typeof documentFiles, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Validate mandatory fields
    const requiredFields: (keyof FormEmployeeModel)[] = [
      'firstName', 'lastName', 'personalEmail', 'companyEmail', 'contactNumber',
      'alternateContactNumber', 'designation', 'dateOfBirth', 'dateOfJoining', 
      'gender', 'currency', 'rateCard', 'panNumber', 'aadharNumber',
      'confirmPanNumber', 'confirmAadharNumber'
    ];

    const missingFields = requiredFields.filter((field) => !formData[field] || formData[field] === '');
    if (missingFields.length > 0) {
      setError(`Please fill in all mandatory fields: ${missingFields.map(field => field.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Name validations (firstName, lastName)
    const nameRegex = /^[A-Za-z ]+$/;
    const names = ['firstName', 'lastName'];
    for (const name of names) {
      const value = formData[name as keyof FormEmployeeModel] as string;
      if (value.trim().length < 3 || value.length > 30 || !nameRegex.test(value.trim())) {
        setError(`${name.replace(/([A-Z])/g, ' $1').toLowerCase()} must be 3-30 characters with alphabets and spaces only`);
        setIsSubmitting(false);
        return;
      }
    }

    // Email validations
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i;

    if (!emailRegex.test(formData.personalEmail) || !emailRegex.test(formData.companyEmail)) {
      setError('Personal and company emails must be valid email addresses');
      setIsSubmitting(false);
      return;
    }

    // PAN validation
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.panNumber)) {
      setError('PAN must be 10 alphanumeric characters (5 letters + 4 digits + 1 letter)');
      setIsSubmitting(false);
      return;
    }

    // Confirm PAN match
    if (formData.panNumber !== formData.confirmPanNumber) {
      setError('PAN number confirmation does not match');
      setIsSubmitting(false);
      return;
    }

    // Aadhar validation
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(formData.aadharNumber)) {
      setError('Aadhar number must be exactly 12 digits');
      setIsSubmitting(false);
      return;
    }

    // Confirm Aadhar match
    if (formData.aadharNumber !== formData.confirmAadharNumber) {
      setError('Aadhar number confirmation does not match');
      setIsSubmitting(false);
      return;
    }

    // Contact numbers validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contactNumber) || !phoneRegex.test(formData.alternateContactNumber)) {
      setError('Contact and alternative numbers must be 10 digits starting with 6-9');
      setIsSubmitting(false);
      return;
    }

    // Validate designation is one of the allowed values
    if (!designations.includes(formData.designation as Designation)) {
      setError('Please select a valid designation');
      setIsSubmitting(false);
      return;
    }

    // Check uniqueness for PAN and Aadhar
    try {
      const employeeList = await adminService.getAllEmployees();
      const existingPan = employeeList.some((emp: EmployeeDTO) => emp.panNumber === formData.panNumber);
      const existingAadhar = employeeList.some((emp: EmployeeDTO) => emp.aadharNumber === formData.aadharNumber);

      if (existingPan) {
        setError('PAN number already exists');
        setIsSubmitting(false);
        return;
      }

      if (existingAadhar) {
        setError('Aadhar number already exists');
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      setError('Failed to verify uniqueness. Please try again.');
      setIsSubmitting(false);
      return;
    }

    let photoUrl = '';
    if (documentFiles.photo) {
      try {
        photoUrl = await adminService.uploadFile(documentFiles.photo);
      } catch (uploadErr: any) {
        setError('Failed to upload photo. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    const { confirmPanNumber, confirmAadharNumber, ...baseData } = formData;
    const employeeData: EmployeeModel = {
      ...baseData,
      designation: formData.designation as Designation,
      clientId: formData.clientId || undefined,
      maritalStatus: formData.maritalStatus || undefined,
      numberOfChildren: formData.numberOfChildren,
      employeePhotoUrl: photoUrl,
    };

    try {
      await adminService.addEmployee(employeeData);
      setSuccess('Employee added successfully!');
      setTimeout(() => {
        router.push('/admin-dashboard/employees/list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Employee</h2>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Personal Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    maxLength={30}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, up to 30 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    maxLength={30}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, up to 30 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Email *
                  </label>
                  <input
                    type="email"
                    id="personalEmail"
                    name="personalEmail"
                    required
                    value={formData.personalEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    required
                    value={formData.panNumber}
                    onChange={handleChange}
                    pattern="[A-Z]{5}\d{4}[A-Z]{1}"
                    title="5 uppercase letters + 4 digits + 1 uppercase letter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPanNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm PAN Number *
                  </label>
                  <input
                    type="text"
                    id="confirmPanNumber"
                    name="confirmPanNumber"
                    required
                    value={formData.confirmPanNumber}
                    onChange={handleChange}
                    pattern="[A-Z]{5}\d{4}[A-Z]{1}"
                    title="Must match PAN number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number *
                  </label>
                  <input
                    type="text"
                    id="aadharNumber"
                    name="aadharNumber"
                    required
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    pattern="\d{12}"
                    title="Exactly 12 digits"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="confirmAadharNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Aadhar Number *
                  </label>
                  <input
                    type="text"
                    id="confirmAadharNumber"
                    name="confirmAadharNumber"
                    required
                    value={formData.confirmAadharNumber}
                    onChange={handleChange}
                    pattern="\d{12}"
                    title="Must match Aadhar number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Marital Status
                  </label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Marital Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="numberOfChildren" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    id="numberOfChildren"
                    name="numberOfChildren"
                    value={formData.numberOfChildren}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo
                  </label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {documentFiles.photo && <p className="text-sm text-gray-500 mt-1">Selected: {documentFiles.photo.name}</p>}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    required
                    value={formData.contactNumber}
                    onChange={handleChange}
                    pattern="[6-9]\d{9}"
                    title="10 digits starting with 6-9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="alternateContactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="alternateContactNumber"
                    name="alternateContactNumber"
                    required
                    value={formData.alternateContactNumber}
                    onChange={handleChange}
                    pattern="[6-9]\d{9}"
                    title="10 digits starting with 6-9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email *
                  </label>
                  <input
                    type="email"
                    id="companyEmail"
                    name="companyEmail"
                    required
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                    Designation *
                  </label>
                  <select
                    id="designation"
                    name="designation"
                    required
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((des) => (
                      <option key={des} value={des}>
                        {des}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Client (Optional)</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    id="dateOfJoining"
                    name="dateOfJoining"
                    required
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    min={today}
                    max={maxJoiningDateStr}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="reportingManagerId" className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting Manager
                  </label>
                  <select
                    id="reportingManagerId"
                    name="reportingManagerId"
                    value={formData.reportingManagerId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Reporting Manager (Optional)</option>
                    {managers.map((manager) => (
                      <option key={manager.employeeId} value={manager.employeeId}>
                        {manager.firstName} {manager.lastName} ({manager.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Billing Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    required
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Currency</option>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rateCard" className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Card *
                  </label>
                  <input
                    type="number"
                    id="rateCard"
                    name="rateCard"
                    required
                    value={formData.rateCard}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm p-2 bg-green-50 rounded">{success}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AddEmployeePage;