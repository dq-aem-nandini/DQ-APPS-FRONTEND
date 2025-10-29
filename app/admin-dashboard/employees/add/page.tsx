'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import {
  EmployeeDTO,
  ClientDTO,
  Designation,
  EmployeeDocumentDTO,
  EmployeeSalaryDTO,
  EmployeeAdditionalDetailsDTO,
  EmployeeEmploymentDetailsDTO,
  EmployeeInsuranceDetailsDTO,
  EmployeeStatutoryDetailsDTO,
  EmployeeEquipmentDTO,
  DocumentType,
  EmploymentType,
  EmployeeModel,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import BackButton from '@/components/ui/BackButton';

interface Client {
  id: string;
  name: string;
}

const AddEmployeePage = () => {
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
    documents: [],
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
      probationApplicable: false,
      bondApplicable: false,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useAuth();
  const router = useRouter();

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

  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<EmployeeDTO[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clientResponse, managerResponses] = await Promise.all([
          adminService.getAllClients().catch(err => ({
            flag: false,
            message: `Failed to fetch clients: ${err.message}`,
            response: null,
          })),
          Promise.all(
            managerDesignations.map(des =>
              adminService.getEmployeesByDesignation(des).catch(err => {
                console.error(`Failed to fetch managers for designation ${des}:`, err);
                return [];
              })
            )
          ),
        ]);

        if (clientResponse.flag && Array.isArray(clientResponse.response)) {
          setClients(
            clientResponse.response.map((client: ClientDTO) => ({
              id: client.clientId,
              name: client.companyName,
            }))
          );
        } else {
          console.error('Client fetch failed:', clientResponse.message);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: clientResponse.message || 'Failed to fetch clients',
          });
        }

        const allManagers = managerResponses.flat().filter(manager => manager !== null);
        if (allManagers.length > 0) {
          setManagers(allManagers);
        } else {
          console.warn('No managers found for the specified designations');
          setManagers([]);
        }
      } catch (err: any) {
        console.error('Error in fetchInitialData:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to load data. Please try again.',
        });
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    if (name === 'personalEmail' || name === 'companyEmail') {
      parsedValue = value.toLowerCase();
    } else if (
      name === 'employeeSalaryDTO.basicPay' ||
      name === 'employeeSalaryDTO.standardHours'
    ) {
      parsedValue = parseFloat(value) || 0;
    } else if (
      name.includes('employeeEmploymentDetailsDTO.probationApplicable') ||
      name.includes('employeeEmploymentDetailsDTO.bondApplicable') ||
      name.includes('employeeInsuranceDetailsDTO.groupInsurance')
    ) {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      const objectFields: (keyof EmployeeModel)[] = [
        'employeeSalaryDTO',
        'employeeAdditionalDetailsDTO',
        'employeeEmploymentDetailsDTO',
        'employeeInsuranceDetailsDTO',
        'employeeStatutoryDetailsDTO',
      ];

      if (objectFields.includes(parent as keyof EmployeeModel)) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof EmployeeModel] as Record<string, any> | undefined) ?? {},
            [child]: parsedValue,
          },
        }));
      } else {
        console.warn(`Attempted to update nested field on non-object: ${parent}.${child}`);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleDocumentChange = (index: number, field: 'docType' | 'file', value: DocumentType | File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index
          ? {
              ...doc,
              [field]: value,
              documentId: doc.documentId || crypto.randomUUID(),
              fileUrl: field === 'file' && value ? '' : doc.fileUrl || '',
              uploadedAt: doc.uploadedAt || new Date().toISOString(),
              verified: doc.verified || false,
            }
          : doc
      ),
    }));
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          documentId: crypto.randomUUID(),
          docType: 'OTHER' as DocumentType,
          fileUrl: '',
          uploadedAt: new Date().toISOString(),
          verified: false,
        },
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
      ) ?? [{ equipmentId: crypto.randomUUID(), equipmentType: '', serialNumber: '', [field]: value }],
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
    setIsSubmitting(true);

    const requiredFields: (keyof EmployeeModel)[] = [
      'firstName', 'lastName', 'personalEmail', 'companyEmail', 'contactNumber',
      'designation', 'dateOfBirth', 'dateOfJoining', 'gender', 'nationality',
      'clientId', 'reportingManagerId', 'skillsAndCertification',
    ];

    const missingFields = requiredFields.filter(field => !formData[field] || formData[field] === '');
    if (missingFields.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: `Please fill in all mandatory fields: ${missingFields.join(', ')}`,
      });
      setIsSubmitting(false);
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(formData.firstName) || !/^[A-Za-z\s]+$/.test(formData.lastName)) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'First and last names must contain only letters and spaces.',
      });
      setIsSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter valid email addresses.',
      });
      setIsSubmitting(false);
      return;
    }

    // Validate probationDuration and bondDuration
    if (formData.employeeEmploymentDetailsDTO?.probationApplicable && formData.employeeEmploymentDetailsDTO?.probationDuration) {
      if (!/^\d+\s*(months|years)?$/.test(formData.employeeEmploymentDetailsDTO.probationDuration)) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Probation duration must be a number optionally followed by "months" or "years" (e.g., "6 months")',
        });
        setIsSubmitting(false);
        return;
      }
    }
    if (formData.employeeEmploymentDetailsDTO?.bondApplicable && formData.employeeEmploymentDetailsDTO?.bondDuration) {
      if (!/^\d+\s*(months|years)?$/.test(formData.employeeEmploymentDetailsDTO.bondDuration)) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Bond duration must be a number optionally followed by "months" or "years" (e.g., "6 months")',
        });
        setIsSubmitting(false);
        return;
      }
    }

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
          setIsSubmitting(false);
          return;
        }
      }
    }

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
          Swal.fire({
            icon: 'error',
            title: 'Upload Error',
            text: err.message || `Failed to upload ${key}. Please try again.`,
          });
          setIsSubmitting(false);
          return;
        }
      }
    }

    const employeeData: EmployeeModel = {
      ...formData,
      documents: uploadedDocuments.length > 0 ? uploadedDocuments : formData.documents,
      employeeSalaryDTO: formData.employeeSalaryDTO?.basicPay
        ? { ...formData.employeeSalaryDTO }
        : undefined,
      employeeAdditionalDetailsDTO: {
        ...formData.employeeAdditionalDetailsDTO,
        offerLetterUrl: additionalFiles.offerLetter || formData.employeeAdditionalDetailsDTO?.offerLetterUrl || '',
        contractUrl: additionalFiles.contract || formData.employeeAdditionalDetailsDTO?.contractUrl || '',
        taxDeclarationFormUrl: additionalFiles.taxDeclarationForm || formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl || '',
        workPermitUrl: additionalFiles.workPermit || formData.employeeAdditionalDetailsDTO?.workPermitUrl || '',
        remarks: formData.employeeAdditionalDetailsDTO?.remarks || formData.skillsAndCertification,
      },
      employeeEmploymentDetailsDTO: formData.employeeEmploymentDetailsDTO?.workingModel
        ? formData.employeeEmploymentDetailsDTO
        : undefined,
      employeeInsuranceDetailsDTO: formData.employeeInsuranceDetailsDTO?.policyNumber
        ? formData.employeeInsuranceDetailsDTO
        : undefined,
      employeeStatutoryDetailsDTO: formData.employeeStatutoryDetailsDTO?.passportNumber || formData.employeeStatutoryDetailsDTO?.pfUanNumber
        ? formData.employeeStatutoryDetailsDTO
        : undefined,
      employeeEquipmentDTO: formData.employeeEquipmentDTO && formData.employeeEquipmentDTO.filter(eq => eq.equipmentType).length > 0
        ? formData.employeeEquipmentDTO
        : undefined,
    };

    try {
      const response = await adminService.addEmployee(employeeData);
      if (response.flag && response.response) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Employee added successfully!',
          confirmButtonColor: '#3085d6',
        });
        router.push('/admin-dashboard/employees/list');
      } else {
        throw new Error(response.message || 'Failed to add employee');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to add employee. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute left-0">
            <BackButton  />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Add Employee
          </h1>
        </div>
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
                    title="Alphabets and spaces only, 3-30 characters"
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
                    title="Alphabets and spaces only, 3-30 characters"
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
                    pattern="[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)"
                    title="Must be a valid email (e.g., gmail.com, yahoo.com, outlook.com, hotmail.com)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                    title="Must be a valid email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    required
                    value={formData.nationality}
                    onChange={handleChange}
                    maxLength={50}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, 2-50 characters"
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
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reportingManagerId" className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting Manager *
                  </label>
                  <select
                    id="reportingManagerId"
                    name="reportingManagerId"
                    required
                    value={formData.reportingManagerId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Manager</option>
                    {managers.map(manager => (
                      <option key={manager.employeeId} value={manager.employeeId}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
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
                    {designations.map(des => (
                      <option key={des} value={des}>
                        {des.replace('_', ' ')}
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
                    max={maxJoiningDateStr}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    required
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Employment Type</option>
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="employeeEmploymentDetailsDTO.workingModel" className="block text-sm font-medium text-gray-700 mb-2">
                    Working Model
                  </label>
                  <select
                    id="employeeEmploymentDetailsDTO.workingModel"
                    name="employeeEmploymentDetailsDTO.workingModel"
                    value={formData.employeeEmploymentDetailsDTO?.workingModel || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Working Model</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="employeeEmploymentDetailsDTO.department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    id="employeeEmploymentDetailsDTO.department"
                    name="employeeEmploymentDetailsDTO.department"
                    value={formData.employeeEmploymentDetailsDTO?.department || ''}
                    onChange={handleChange}
                       placeholder="e.g. Engineering"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
 {/* Shift Timing */}
 <div>
                  <label htmlFor="shiftTiming" className="block text-sm font-medium text-gray-700 mb-2">
                    Shift Timing
                  </label>
                  <input
                    type="text"
                    id="shiftTiming"
                    name="employeeEmploymentDetailsDTO.shiftTiming"
                    value={formData.employeeEmploymentDetailsDTO?.shiftTiming || ''}
                    onChange={handleChange}
                    placeholder="e.g. 9:00 AM - 6:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Notice Period Duration */}
                <div>
                  <label htmlFor="noticePeriodDuration" className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Period Duration
                  </label>
                  <input
                    type="text"
                    id="noticePeriodDuration"
                    name="employeeEmploymentDetailsDTO.noticePeriodDuration"
                    value={formData.employeeEmploymentDetailsDTO?.noticePeriodDuration || ''}
                    onChange={handleChange}
                    placeholder="e.g. 30 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Probation Applicable */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="probationApplicable"
                    name="employeeEmploymentDetailsDTO.probationApplicable"
                    checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="probationApplicable" className="text-sm font-medium text-gray-700">
                    Probation Applicable
                  </label>
                </div>

                {/* Conditional: Probation Duration */}
                {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                  <div>
                    <label htmlFor="probationDuration" className="block text-sm font-medium text-gray-700 mb-2">
                      Probation Duration
                    </label>
                    <input
                      type="text"
                      id="probationDuration"
                      name="employeeEmploymentDetailsDTO.probationDuration"
                      value={formData.employeeEmploymentDetailsDTO?.probationDuration || ''}
                      onChange={handleChange}
                      placeholder="e.g. 3 months"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Conditional: Probation Notice Period */}
                {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                  <div>
                    <label htmlFor="probationNoticePeriod" className="block text-sm font-medium text-gray-700 mb-2">
                      Probation Notice Period
                    </label>
                    <input
                      type="text"
                      id="probationNoticePeriod"
                      name="employeeEmploymentDetailsDTO.probationNoticePeriod"
                      value={formData.employeeEmploymentDetailsDTO?.probationNoticePeriod || ''}
                      onChange={handleChange}
                      placeholder="e.g. 15 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Bond Applicable */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="bondApplicable"
                    name="employeeEmploymentDetailsDTO.bondApplicable"
                    checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="bondApplicable" className="text-sm font-medium text-gray-700">
                    Bond Applicable
                  </label>
                </div>

                {/* Conditional: Bond Duration */}
                {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                  <div>
                    <label htmlFor="bondDuration" className="block text-sm font-medium text-gray-700 mb-2">
                      Bond Duration
                    </label>
                    <input
                      type="text"
                      id="bondDuration"
                      name="employeeEmploymentDetailsDTO.bondDuration"
                      value={formData.employeeEmploymentDetailsDTO?.bondDuration || ''}
                      onChange={handleChange}
                      placeholder="e.g. 12 months"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Date of Confirmation */}
                <div>
                  <label htmlFor="dateOfConfirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Confirmation
                  </label>
                  <input
                    type="date"
                    id="dateOfConfirmation"
                    name="employeeEmploymentDetailsDTO.dateOfConfirmation"
                    value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              {formData.documents.map((doc, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`docType-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Document Type
                      </label>
                      <select
                        id={`docType-${index}`}
                        value={doc.docType}
                        onChange={(e) => handleDocumentChange(index, 'docType', e.target.value as DocumentType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Document Type</option>
                        {documentTypes.map(type => (
                          <option key={type} value={type}>
                            {type.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`file-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Upload File
                      </label>
                      <input
                        type="file"
                        id={`file-${index}`}
                        onChange={(e) => handleDocumentChange(index, 'file', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.documents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="mt-2 text-red-600 hover:text-red-800"
                    >
                      Remove Document
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDocument}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Add Document
              </button>
            </div>

            {/* Equipment Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Details</h3>
              {formData.employeeEquipmentDTO?.map((eq, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`equipmentType-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Equipment Type
                      </label>
                      <input
                        type="text"
                        id={`equipmentType-${index}`}
                        value={eq.equipmentType || ''}
                        onChange={(e) => handleEquipmentChange(index, 'equipmentType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`serialNumber-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        id={`serialNumber-${index}`}
                        value={eq.serialNumber || ''}
                        onChange={(e) => handleEquipmentChange(index, 'serialNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`issuedDate-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Issued Date
                      </label>
                      <input
                        type="date"
                        id={`issuedDate-${index}`}
                        value={eq.issuedDate || ''}
                        onChange={(e) => handleEquipmentChange(index, 'issuedDate', e.target.value)}
                        max={today}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.employeeEquipmentDTO && formData.employeeEquipmentDTO.length > 0 && (
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="mt-2 text-red-600 hover:text-red-800"
                    >
                      Remove Equipment
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEquipment}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Add Equipment
              </button>
            </div>

            {/* Additional Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employeeAdditionalDetailsDTO.offerLetterUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Letter
                  </label>
                  <input
                    type="file"
                    id="employeeAdditionalDetailsDTO.offerLetterUrl"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('offerLetter', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="employeeAdditionalDetailsDTO.contractUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Contract
                  </label>
                  <input
                    type="file"
                    id="employeeAdditionalDetailsDTO.contractUrl"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('contract', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="employeeAdditionalDetailsDTO.taxDeclarationFormUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Declaration Form
                  </label>
                  <input
                    type="file"
                    id="employeeAdditionalDetailsDTO.taxDeclarationFormUrl"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('taxDeclarationForm', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="employeeAdditionalDetailsDTO.workPermitUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Work Permit
                  </label>
                  <input
                    type="file"
                    id="employeeAdditionalDetailsDTO.workPermitUrl"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('workPermit', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="employeeAdditionalDetailsDTO.remarks" className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    id="employeeAdditionalDetailsDTO.remarks"
                    name="employeeAdditionalDetailsDTO.remarks"
                    value={formData.employeeAdditionalDetailsDTO?.remarks || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="skillsAndCertification" className="block text-sm font-medium text-gray-700 mb-2">
                    Skills and Certifications *
                  </label>
                  <textarea
                    id="skillsAndCertification"
                    name="skillsAndCertification"
                    required
                    value={formData.skillsAndCertification}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="employeeAdditionalDetailsDTO.backgroundCheckStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Background Check Status
                  </label>
                  <input
                    type="text"
                    id="employeeAdditionalDetailsDTO.backgroundCheckStatus"
                    name="employeeAdditionalDetailsDTO.backgroundCheckStatus"
                    value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"                  />
                </div>
              </div>
            </div>

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
                <div>
                  <label htmlFor="employeeInsuranceDetailsDTO.groupInsurance" className="block text-sm font-medium text-gray-700 mb-2">
                    Group Insurance
                  </label>
                  <input
                    type="checkbox"
                    id="employeeInsuranceDetailsDTO.groupInsurance"
                    name="employeeInsuranceDetailsDTO.groupInsurance"
                    checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
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

            {/* Form Submission Controls */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin-dashboard/employees/list')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AddEmployeePage;