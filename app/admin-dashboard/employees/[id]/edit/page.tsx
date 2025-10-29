'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import {
  EmployeeModel,
  ClientDTO,
  Designation,
  DocumentType,
  EmploymentType,
  EmployeeDocumentDTO,
  EmployeeEquipmentDTO,
  EmployeeEmploymentDetailsDTO,
  EmployeeInsuranceDetailsDTO,
  EmployeeStatutoryDetailsDTO,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface Manager {
  id: string;
  name: string;
}

// Form-only document type (has `file`)
interface FormDocument extends EmployeeDocumentDTO {
  file?: File | null;
}

const EditEmployeePage = () => {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();

  const [formData, setFormData] = useState<EmployeeModel>({
    firstName: '',
    lastName: '',
    personalEmail: '',
    companyEmail: '',
    contactNumber: '',
    alternateContactNumber: '',
    gender: '',
    maritalStatus: '',
    numberOfChildren: 0,
    employeePhotoUrl: '',
    nationality: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    remarks: '',
    skillsAndCertification: '',
    clientId: '',
    reportingManagerId: '',
    designation: '' as Designation,
    dateOfBirth: '',
    dateOfJoining: '',
    rateCard: 0,
    employmentType: 'FULLTIME' as EmploymentType,
    panNumber: '',
    aadharNumber: '',
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
    addresses: [],
    documents: [] as FormDocument[],
    employeeSalaryDTO: {
      employeeId: '',
      basicPay: 0,
      payType: 'MONTHLY',
      standardHours: 40,
      bankAccountNumber: '',
      ifscCode: '',
      payClass: 'STANDARD',
    },
    employeeAdditionalDetailsDTO: {
      offerLetterUrl: '',
      contractUrl: '',
      taxDeclarationFormUrl: '',
      workPermitUrl: '',
      backgroundCheckStatus: '',
      remarks: '',
    },
    employeeEmploymentDetailsDTO: {
      employmentId: '',
      employeeId: '',
      noticePeriodDuration: '',
      probationApplicable: false,
      probationDuration: '',
      probationNoticePeriod: '',
      bondApplicable: false,
      bondDuration: '',
      workingModel: '',
      shiftTiming: '',
      department: '',
      dateOfConfirmation: '',
      location: '',
    },
    employeeInsuranceDetailsDTO: {
      insuranceId: '',
      employeeId: '',
      policyNumber: '',
      providerName: '',
      coverageStart: '',
      coverageEnd: '',
      nomineeName: '',
      nomineeRelation: '',
      nomineeContact: '',
      groupInsurance: false,
    },
    employeeStatutoryDetailsDTO: {
      statutoryId: '',
      employeeId: '',
      passportNumber: '',
      taxRegime: '',
      pfUanNumber: '',
      esiNumber: '',
      ssnNumber: '',
    },
    employeeEquipmentDTO: [],
  });

  const [documentFiles, setDocumentFiles] = useState({
    offerLetter: null as File | null,
    contract: null as File | null,
    taxDeclarationForm: null as File | null,
    workPermit: null as File | null,
  });

  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const maxJoiningDate = new Date();
  maxJoiningDate.setMonth(maxJoiningDate.getMonth() + 3);
  const maxJoiningDateStr = maxJoiningDate.toISOString().split('T')[0];

  const designations: Designation[] = [
    'INTERN', 'TRAINEE', 'ASSOCIATE_ENGINEER', 'SOFTWARE_ENGINEER', 'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER', 'TEAM_LEAD', 'TECHNICAL_ARCHITECT', 'REPORTING_MANAGER', 'DELIVERY_MANAGER',
    'DIRECTOR', 'VP_ENGINEERING', 'CTO', 'HR', 'FINANCE', 'OPERATIONS'
  ];

  const managerDesignations: Designation[] = [
    'REPORTING_MANAGER', 'DELIVERY_MANAGER', 'DIRECTOR', 'VP_ENGINEERING', 'CTO'
  ];

  const documentTypes: DocumentType[] = [
    'OFFER_LETTER', 'CONTRACT', 'TAX_DECLARATION_FORM', 'WORK_PERMIT', 'PAN_CARD',
    'AADHAR_CARD', 'BANK_PASSBOOK', 'TENTH_CERTIFICATE', 'INTERMEDIATE_CERTIFICATE',
    'DEGREE_CERTIFICATE', 'POST_GRADUATION_CERTIFICATE', 'OTHER'
  ];

  const employmentTypes: EmploymentType[] = ['CONTRACTOR', 'FREELANCER', 'FULLTIME'];

  // Fetch employee + clients + managers
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== 'string') {
        Swal.fire({ icon: 'error', title: 'Invalid ID' });
        setLoading(false);
        return;
      }

      try {
        const [empRes, clientRes, empListRes] = await Promise.all([
          adminService.getEmployeeById(params.id),
          adminService.getAllClients(),
          adminService.getAllEmployees(),
        ]);

        if (!empRes.flag || !empRes.response) throw new Error('Employee not found');
        if (!clientRes.flag || !clientRes.response) throw new Error('Failed to load clients');

        const emp = empRes.response as EmployeeModel;

        setFormData({
          ...emp,
          employeeEmploymentDetailsDTO: emp.employeeEmploymentDetailsDTO ?? {
            employmentId: '',
            employeeId: '',
            noticePeriodDuration: '',
            probationApplicable: false,
            probationDuration: '',
            probationNoticePeriod: '',
            bondApplicable: false,
            bondDuration: '',
            workingModel: '',
            shiftTiming: '',
            department: '',
            dateOfConfirmation: '',
            location: '',
          },
          employeeInsuranceDetailsDTO: emp.employeeInsuranceDetailsDTO ?? {
            insuranceId: '',
            employeeId: '',
            policyNumber: '',
            providerName: '',
            coverageStart: '',
            coverageEnd: '',
            nomineeName: '',
            nomineeRelation: '',
            nomineeContact: '',
            groupInsurance: false,
          },
          employeeStatutoryDetailsDTO: emp.employeeStatutoryDetailsDTO ?? {
            statutoryId: '',
            employeeId: '',
            passportNumber: '',
            taxRegime: '',
            pfUanNumber: '',
            esiNumber: '',
            ssnNumber: '',
          },
          employeeEquipmentDTO: emp.employeeEquipmentDTO ?? [],
          documents: (emp.documents ?? []).map(doc => ({ ...doc, file: null })) as FormDocument[],
        });

        setClients(clientRes.response);

        const allManagers = empListRes.response
          .filter((e: any) => managerDesignations.includes(e.designation))
          .map((e: any) => ({ id: e.employeeId, name: `${e.firstName} ${e.lastName}` }));
        setManagers(allManagers);

      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Generic change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EmployeeModel] as any),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : parsedValue,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleDocumentChange = (index: number, field: 'docType' | 'file', value: DocumentType | File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index
          ? { ...doc, [field]: value, fileUrl: field === 'file' && value ? '' : doc.fileUrl || '' }
          : doc
      ),
    }));
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        { documentId: crypto.randomUUID(), docType: 'OTHER' as DocumentType, fileUrl: '', uploadedAt: new Date().toISOString(), verified: false, file: null },
      ],
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleEquipmentChange = (index: number, field: keyof EmployeeEquipmentDTO, value: string) => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.map((eq, i) =>
        i === index ? { ...eq, [field]: value } : eq
      ) ?? [],
    }));
  };

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: crypto.randomUUID(), equipmentType: '', serialNumber: '' },
      ],
    }));
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
    }));
  };

  const handleFileChange = (field: keyof typeof documentFiles, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;
    setSubmitting(true);

    const required = [
      'firstName', 'lastName', 'personalEmail', 'companyEmail', 'contactNumber',
      'designation', 'dateOfBirth', 'dateOfJoining', 'gender', 'nationality',
      'clientId', 'reportingManagerId', 'skillsAndCertification',
    ];

    const missing = required.filter(f => !formData[f as keyof EmployeeModel]);
    if (missing.length) {
      Swal.fire({ icon: 'error', title: 'Missing Fields', text: missing.join(', ') });
      setSubmitting(false);
      return;
    }

    // Upload dynamic documents
    const uploadedDocuments: EmployeeDocumentDTO[] = [];
    for (const doc of formData.documents) {
      if (doc.fileUrl) {
        try {
          const uploadResponse = await adminService.uploadFile(doc.fileUrl as any);
          if (uploadResponse.flag && uploadResponse.response) {
            uploadedDocuments.push({
              documentId: doc.documentId,
              docType: doc.docType,
              fileUrl: uploadResponse.response,
              uploadedAt: new Date().toISOString(),
              verified: false,
            });
          } else {
            throw new Error(uploadResponse.message || `Failed to upload document: ${doc.docType}`);
          }
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Upload Error',
            text: err.message || `Failed to upload document: ${doc.docType}`,
          });
          setSubmitting(false);
          return;
        }
      }
    }


    // Upload additional files
    const additionalFiles: { [key: string]: string } = {};
    for (const [key, file] of Object.entries(documentFiles)) {
      if (file) {
        try {
          const uploadResponse = await adminService.uploadFile(file);
          if (uploadResponse.flag && uploadResponse.response) {
            additionalFiles[key] = uploadResponse.response;
          } else {
            throw new Error(uploadResponse.message || `Failed to upload ${key}`);
          }
        } catch (err: any) {
          Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.message || `Failed to upload ${key}` });
          setSubmitting(false);
          return;
        }
      }
    }

    const payload: EmployeeModel = {
      ...formData,
      documents: uploadedDocuments,
      employeeAdditionalDetailsDTO: {
        ...formData.employeeAdditionalDetailsDTO,
        offerLetterUrl: additionalFiles.offerLetter || formData.employeeAdditionalDetailsDTO?.offerLetterUrl || '',
        contractUrl: additionalFiles.contract || formData.employeeAdditionalDetailsDTO?.contractUrl || '',
        taxDeclarationFormUrl: additionalFiles.taxDeclarationForm || formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl || '',
        workPermitUrl: additionalFiles.workPermit || formData.employeeAdditionalDetailsDTO?.workPermitUrl || '',
      },
    };

    try {
      const res = await adminService.updateEmployee(params.id as string, payload);
      if (res.flag) {
        await Swal.fire({ icon: 'success', title: 'Success', text: 'Employee updated!', timer: 1500 });
        router.push('/admin-dashboard/employees/list');
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Update failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Spinner
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-lg font-medium text-gray-700">Loading employee data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Employee</h2>
            <Link
              href="/admin-dashboard/employees/list"
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center gap-2"
            >
              Back to List
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-8">

            {/* Personal Details */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Personal Email */}
                <div>
                  <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-1">Personal Email *</label>
                  <input
                    id="personalEmail"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    placeholder="Enter personal email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Company Email */}
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">Company Email *</label>
                  <input
                    id="companyEmail"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    placeholder="Enter company email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber ?? ''}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={today}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Nationality */}
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                  <input
                    id="nationality"
                    name="nationality"
                    value={formData.nationality ?? ''}                    onChange={handleChange}
                    placeholder="Enter nationality"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

              </div>
            </section>


            {/* Employment Details */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Client */}
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => (
                      <option key={c.clientId} value={c.clientId}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                {/* Reporting Manager */}
                <div>
                  <label htmlFor="reportingManagerId" className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager *</label>
                  <select
                    id="reportingManagerId"
                    name="reportingManagerId"
                    value={formData.reportingManagerId ?? ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Reporting Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <select
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Designation</option>
                    {designations.map(d => (
                      <option key={d} value={d}>{d.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Date of Joining */}
                <div>
                  <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
                  <input
                    type="date"
                    id="dateOfJoining"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    max={maxJoiningDateStr}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Employment Type</option>
                    {employmentTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Working Model */}
                <div>
                  <label htmlFor="workingModel" className="block text-sm font-medium text-gray-700 mb-1">Working Model</label>
                  <select
                    id="workingModel"
                    name="employeeEmploymentDetailsDTO.workingModel"
                    value={formData.employeeEmploymentDetailsDTO?.workingModel || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Working Model</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    id="department"
                    name="employeeEmploymentDetailsDTO.department"
                    value={formData.employeeEmploymentDetailsDTO?.department || ''}
                    onChange={handleChange}
                    placeholder="Enter Department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    id="location"
                    name="employeeEmploymentDetailsDTO.location"
                    value={formData.employeeEmploymentDetailsDTO?.location || ''}
                    onChange={handleChange}
                    placeholder="Enter Location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Notice Period */}
                <div>
                  <label htmlFor="noticePeriodDuration" className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                  <input
                    id="noticePeriodDuration"
                    name="employeeEmploymentDetailsDTO.noticePeriodDuration"
                    value={formData.employeeEmploymentDetailsDTO?.noticePeriodDuration || ''}
                    onChange={handleChange}
                    placeholder="e.g. 30 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Probation Applicable */}
                <div className="flex items-center gap-2">
                  <input
                    id="probationApplicable"
                    type="checkbox"
                    name="employeeEmploymentDetailsDTO.probationApplicable"
                    checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="probationApplicable" className="text-sm font-medium text-gray-700">Probation Applicable</label>
                </div>

                {/* Probation Fields */}
                {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                  <>
                    <div>
                      <label htmlFor="probationDuration" className="block text-sm font-medium text-gray-700 mb-1">Probation Duration</label>
                      <input
                        id="probationDuration"
                        name="employeeEmploymentDetailsDTO.probationDuration"
                        value={formData.employeeEmploymentDetailsDTO?.probationDuration || ''}
                        onChange={handleChange}
                        placeholder="Enter Duration"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="probationNoticePeriod" className="block text-sm font-medium text-gray-700 mb-1">Probation Notice Period</label>
                      <input
                        id="probationNoticePeriod"
                        name="employeeEmploymentDetailsDTO.probationNoticePeriod"
                        value={formData.employeeEmploymentDetailsDTO?.probationNoticePeriod || ''}
                        onChange={handleChange}
                        placeholder="Enter Notice Period"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {/* Bond Applicable */}
                <div className="flex items-center gap-2">
                  <input
                    id="bondApplicable"
                    type="checkbox"
                    name="employeeEmploymentDetailsDTO.bondApplicable"
                    checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="bondApplicable" className="text-sm font-medium text-gray-700">Bond Applicable</label>
                </div>

                {/* Bond Duration */}
                {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                  <div>
                    <label htmlFor="bondDuration" className="block text-sm font-medium text-gray-700 mb-1">Bond Duration</label>
                    <input
                      id="bondDuration"
                      name="employeeEmploymentDetailsDTO.bondDuration"
                      value={formData.employeeEmploymentDetailsDTO?.bondDuration || ''}
                      onChange={handleChange}
                      placeholder="Enter Bond Duration"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Date of Confirmation */}
                <div>
                  <label htmlFor="dateOfConfirmation" className="block text-sm font-medium text-gray-700 mb-1">Date of Confirmation</label>
                  <input
                    type="date"
                    id="dateOfConfirmation"
                    name="employeeEmploymentDetailsDTO.dateOfConfirmation"
                    value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </div>
            </section>

            {/* Documents */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>

              {formData.documents.map((doc, i) => (
                <div key={i} className="mb-4 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Document Type */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Document Type</label>
                      <select
                        value={doc.docType}
                        onChange={e => handleDocumentChange(i, 'docType', e.target.value as DocumentType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Type</option>
                        {documentTypes.map(t => (
                          <option key={t} value={t}>
                            {t.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Upload File */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Upload Document</label>
                      <input
                        type="file"
                        onChange={e => handleDocumentChange(i, 'file', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Existing file display */}
                  {doc.fileUrl && (
                    <p className="text-xs text-green-600 mt-1">
                      Current: {doc.fileUrl.split('/').pop()}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => removeDocument(i)}
                    className="mt-2 text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addDocument}
                className="text-indigo-600 text-sm hover:underline"
              >
                + Add Document
              </button>
            </section>


            {/* Equipment */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Details</h3>

              {formData.employeeEquipmentDTO?.map((eq, i) => (
                <div key={i} className="mb-4 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Equipment Type */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Equipment Type</label>
                      <input
                        value={eq.equipmentType || ''}
                        onChange={e => handleEquipmentChange(i, 'equipmentType', e.target.value)}
                        placeholder="Enter Equipment Type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Serial Number */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Serial Number</label>
                      <input
                        value={eq.serialNumber || ''}
                        onChange={e => handleEquipmentChange(i, 'serialNumber', e.target.value)}
                        placeholder="Enter Serial Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Issued Date */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Issued Date</label>
                      <input
                        type="date"
                        value={eq.issuedDate || ''}
                        onChange={e => handleEquipmentChange(i, 'issuedDate', e.target.value)}
                        max={today}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeEquipment(i)}
                    className="mt-2 text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addEquipment}
                className="text-indigo-600 text-sm hover:underline"
              >
                + Add Equipment
              </button>
            </section>


            {/* Additional Details */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Offer Letter */}
                <div>
                  <label htmlFor="offerLetter" className="block text-sm font-medium text-gray-700 mb-1">Offer Letter</label>
                  <input
                    id="offerLetter"
                    type="file"
                    onChange={e => handleFileChange('offerLetter', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Contract */}
                <div>
                  <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                  <input
                    id="contract"
                    type="file"
                    onChange={e => handleFileChange('contract', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Tax Form */}
                <div>
                  <label htmlFor="taxDeclarationForm" className="block text-sm font-medium text-gray-700 mb-1">Tax Form</label>
                  <input
                    id="taxDeclarationForm"
                    type="file"
                    onChange={e => handleFileChange('taxDeclarationForm', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Work Permit */}
                <div>
                  <label htmlFor="workPermit" className="block text-sm font-medium text-gray-700 mb-1">Work Permit</label>
                  <input
                    id="workPermit"
                    type="file"
                    onChange={e => handleFileChange('workPermit', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>



                {/* Remarks (Additional) */}
                <div>
                  <label htmlFor="additionalRemarks" className="block text-sm font-medium text-gray-700 mb-1">Additional Remarks</label>
                  <textarea
                    id="additionalRemarks"
                    name="employeeAdditionalDetailsDTO.remarks"
                    value={formData.employeeAdditionalDetailsDTO?.remarks || ''}
                    onChange={handleChange}
                    placeholder="Enter any additional remarks"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* General Remarks */}
                <div>
                  <label htmlFor="generalRemarks" className="block text-sm font-medium text-gray-700 mb-1">General Remarks</label>
                  <textarea
                    id="generalRemarks"
                    name="remarks"
                    value={formData.remarks ?? ''}
                    onChange={handleChange}
                    placeholder="Enter general remarks"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Background Check Status */}
                <div>
                  <label htmlFor="backgroundCheckStatus" className="block text-sm font-medium text-gray-700 mb-1">Background Check Status</label>
                  <input
                    id="backgroundCheckStatus"
                    name="employeeAdditionalDetailsDTO.backgroundCheckStatus"
                    value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ''}
                    onChange={handleChange}
                    placeholder="Enter Background Check Status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </div>
            </section>


            {/* Insurance & Statutory Details – Full Add Employee Style */}
            <section className="pb-6 space-y-8">
              {/* Insurance Details */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.policyNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      id="employeeInsuranceDetailsDTO.policyNumber"
                      name="employeeInsuranceDetailsDTO.policyNumber"
                      value={formData.employeeInsuranceDetailsDTO?.policyNumber || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.providerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      id="employeeInsuranceDetailsDTO.providerName"
                      name="employeeInsuranceDetailsDTO.providerName"
                      value={formData.employeeInsuranceDetailsDTO?.providerName || ''}
                      onChange={handleChange}
                      pattern="[A-Za-z ]+"
                      title="Alphabets and spaces only"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.coverageStart" className="block text-sm font-medium text-gray-700 mb-2">
                      Coverage Start Date
                    </label>
                    <input
                      type="date"
                      id="employeeInsuranceDetailsDTO.coverageStart"
                      name="employeeInsuranceDetailsDTO.coverageStart"
                      value={formData.employeeInsuranceDetailsDTO?.coverageStart || ''}
                      onChange={handleChange}
                      max={today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.coverageEnd" className="block text-sm font-medium text-gray-700 mb-2">
                      Coverage End Date
                    </label>
                    <input
                      type="date"
                      id="employeeInsuranceDetailsDTO.coverageEnd"
                      name="employeeInsuranceDetailsDTO.coverageEnd"
                      value={formData.employeeInsuranceDetailsDTO?.coverageEnd || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.nomineeName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nominee Name
                    </label>
                    <input
                      type="text"
                      id="employeeInsuranceDetailsDTO.nomineeName"
                      name="employeeInsuranceDetailsDTO.nomineeName"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeName || ''}
                      onChange={handleChange}
                      pattern="[A-Za-z ]+"
                      title="Alphabets and spaces only"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.nomineeRelation" className="block text-sm font-medium text-gray-700 mb-2">
                      Nominee Relation
                    </label>
                    <input
                      type="text"
                      id="employeeInsuranceDetailsDTO.nomineeRelation"
                      name="employeeInsuranceDetailsDTO.nomineeRelation"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ''}
                      onChange={handleChange}
                      pattern="[A-Za-z ]+"
                      title="Alphabets and spaces only"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeInsuranceDetailsDTO.nomineeContact" className="block text-sm font-medium text-gray-700 mb-2">
                      Nominee Contact
                    </label>
                    <input
                      type="tel"
                      id="employeeInsuranceDetailsDTO.nomineeContact"
                      name="employeeInsuranceDetailsDTO.nomineeContact"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeContact || ''}
                      onChange={handleChange}
                      pattern="[6-9]\d{9}"
                      title="10 digits starting with 6-9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="employeeInsuranceDetailsDTO.groupInsurance" className="block text-sm font-medium text-gray-700">
                      Group Insurance
                    </label>
                    <input
                      type="checkbox"
                      id="employeeInsuranceDetailsDTO.groupInsurance"
                      name="employeeInsuranceDetailsDTO.groupInsurance"
                      checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false}
                      onChange={handleChange}
                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Details */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statutory Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="employeeStatutoryDetailsDTO.passportNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      id="employeeStatutoryDetailsDTO.passportNumber"
                      name="employeeStatutoryDetailsDTO.passportNumber"
                      value={formData.employeeStatutoryDetailsDTO?.passportNumber || ''}
                      onChange={handleChange}
                      pattern="[A-Z0-9]{8,12}"
                      title="8-12 alphanumeric characters"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeStatutoryDetailsDTO.pfUanNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      PF UAN Number
                    </label>
                    <input
                      type="text"
                      id="employeeStatutoryDetailsDTO.pfUanNumber"
                      name="employeeStatutoryDetailsDTO.pfUanNumber"
                      value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ''}
                      onChange={handleChange}
                      pattern="\d{12}"
                      title="Exactly 12 digits"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeStatutoryDetailsDTO.taxRegime" className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Regime
                    </label>
                    <input
                      type="text"
                      id="employeeStatutoryDetailsDTO.taxRegime"
                      name="employeeStatutoryDetailsDTO.taxRegime"
                      value={formData.employeeStatutoryDetailsDTO?.taxRegime || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeStatutoryDetailsDTO.esiNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      ESI Number
                    </label>
                    <input
                      type="text"
                      id="employeeStatutoryDetailsDTO.esiNumber"
                      name="employeeStatutoryDetailsDTO.esiNumber"
                      value={formData.employeeStatutoryDetailsDTO?.esiNumber || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeStatutoryDetailsDTO.ssnNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      SSN Number
                    </label>
                    <input
                      type="text"
                      id="employeeStatutoryDetailsDTO.ssnNumber"
                      name="employeeStatutoryDetailsDTO.ssnNumber"
                      value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/admin-dashboard/employees/list" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Updating...' : 'Update Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditEmployeePage;