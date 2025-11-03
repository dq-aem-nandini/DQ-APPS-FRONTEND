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

// ────── Custom File Input (Choose file / No file chosen) ──────
type FileInputProps = {
  id: string;
  onChange: (file: File | null) => void;
  currentFile?: File | null;
  existingUrl?: string;
  onClear?: () => void;
};

const FileInput: React.FC<FileInputProps> = ({ id, onChange, currentFile, existingUrl, onClear }) => {
  const [fileName, setFileName] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? '');
    onChange(file);
  };

  const displayName = fileName || (existingUrl ? existingUrl.split('/').pop() : 'No file chosen');

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
      >
        Choose file
        <input id={id} type="file" className="hidden" onChange={handleChange} />
      </label>
      <span className="text-sm text-gray-600 truncate max-w-[180px]">{displayName}</span>
      {(currentFile || existingUrl) && onClear && (
        <button type="button" onClick={onClear} className="text-red-600 hover:underline text-sm">
          Remove
        </button>
      )}
    </div>
  );
};

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
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EmployeeModel] as any),
          [child]: isCheckbox ? checked : value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    }
  };

  // ────── DOCUMENTS ──────
  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          documentId: "",
          docType: 'OTHER' as DocumentType,
          fileUrl: '',
          uploadedAt: new Date().toISOString(),
          verified: false,
          file: null,
        },
      ],
    }));
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

  const confirmAndRemoveDocument = async (index: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await removeDocument(index);
      Swal.fire('Deleted!', 'Document has been removed.', 'success');
    }
  };

  const removeDocument = async (index: number) => {
    const doc = formData.documents[index];
    if (doc.documentId) {
      const res = await adminService.deleteEmployeeDocument(params.id as string, doc.documentId);
      if (!res.flag) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message });
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  // ────── EQUIPMENT ──────
  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: "", equipmentType: '', serialNumber: '', issuedDate: '' },
      ],
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

  const confirmAndRemoveEquipment = async (index: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this equipment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await removeEquipment(index);
      Swal.fire('Deleted!', 'Equipment has been removed.', 'success');
    }
  };

  const removeEquipment = async (index: number) => {
    const eq = formData.employeeEquipmentDTO?.[index];
    if (eq?.equipmentId) {
      const res = await adminService.deleteEmployeeEquipmentInfo(eq.equipmentId); // Only 1 arg
  
      if (!res.flag) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message });
        return;
      }
    }
  
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
    }));
  };

  const handleFileChange = (field: keyof typeof documentFiles, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field]: file }));
  };

  const clearAdditionalFile = (field: keyof typeof documentFiles) => {
    setDocumentFiles(prev => ({ ...prev, [field]: null }));
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
      let fileUrl = doc.fileUrl;
      if ((doc as FormDocument).file) {
        const fileToUpload = (doc as FormDocument).file!;
        const uploadResponse = await adminService.uploadFile(fileToUpload);
        if (!uploadResponse.flag || !uploadResponse.response) {
          throw new Error(uploadResponse.message || `Failed to upload ${doc.docType}`);
        }
        fileUrl = uploadResponse.response;
      }

      if (fileUrl) {
        const { file, ...rest } = doc as any;
        if (!rest.documentId) {
          const { documentId, ...noId } = rest;
          uploadedDocuments.push(noId);
        } else {
          uploadedDocuments.push(rest);
        }
      }
    }

    // Upload additional files
    const additionalFiles: { [key: string]: string } = {};
    for (const [key, file] of Object.entries(documentFiles)) {
      if (file) {
        const uploadResponse = await adminService.uploadFile(file);
        if (uploadResponse.flag && uploadResponse.response) {
          additionalFiles[key] = uploadResponse.response;
        } else {
          throw new Error(uploadResponse.message || `Failed to upload ${key}`);
        }
      }
    }

    // Clean equipment
    const finalEquip: EmployeeEquipmentDTO[] = (formData.employeeEquipmentDTO ?? []).map(eq => {
      if (!eq.equipmentId) {
        return { ...eq, equipmentId: '' };
      }
      return eq;
    });

    // Final payload
    const payload: EmployeeModel = {
      ...formData,
      documents: uploadedDocuments,
      employeeEquipmentDTO: finalEquip,
      employeeAdditionalDetailsDTO: {
        ...formData.employeeAdditionalDetailsDTO,
        offerLetterUrl: additionalFiles.offerLetter || (documentFiles.offerLetter === null ? '' : formData.employeeAdditionalDetailsDTO?.offerLetterUrl || ''),
        contractUrl: additionalFiles.contract || (documentFiles.contract === null ? '' : formData.employeeAdditionalDetailsDTO?.contractUrl || ''),
        taxDeclarationFormUrl: additionalFiles.taxDeclarationForm || (documentFiles.taxDeclarationForm === null ? '' : formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl || ''),
        workPermitUrl: additionalFiles.workPermit || (documentFiles.workPermit === null ? '' : formData.employeeAdditionalDetailsDTO?.workPermitUrl || ''),
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

  const hasFile = (doc: EmployeeDocumentDTO): doc is FormDocument => {
    return 'file' in doc;
  };

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
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-1">Personal Email *</label>
                  <input id="personalEmail" name="personalEmail" value={formData.personalEmail} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">Company Email *</label>
                  <input id="companyEmail" name="companyEmail" value={formData.companyEmail} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input id="contactNumber" name="contactNumber" value={formData.contactNumber ?? ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                  <input id="nationality" name="nationality" value={formData.nationality ?? ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label htmlFor="skillsAndCertification" className="block text-sm font-medium text-gray-700 mb-1">Skills & Certification *</label>
                  <textarea id="skillsAndCertification" name="skillsAndCertification" value={formData.skillsAndCertification} onChange={handleChange} required rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </section>

            {/* Employment Details */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="reportingManagerId" className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager *</label>
                  <select id="reportingManagerId" name="reportingManagerId" value={formData.reportingManagerId ?? ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Reporting Manager</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <select id="designation" name="designation" value={formData.designation} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Designation</option>
                    {designations.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
                  <input type="date" id="dateOfJoining" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                  <select id="employmentType" name="employmentType" value={formData.employmentType ?? ""} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Type</option>
                    {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="workingModel" className="block text-sm font-medium text-gray-700 mb-1">Working Model</label>
                  <select id="workingModel" name="employeeEmploymentDetailsDTO.workingModel" value={formData.employeeEmploymentDetailsDTO?.workingModel || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input id="department" name="employeeEmploymentDetailsDTO.department" value={formData.employeeEmploymentDetailsDTO?.department || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input id="location" name="employeeEmploymentDetailsDTO.location" value={formData.employeeEmploymentDetailsDTO?.location || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="noticePeriodDuration" className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                  <input id="noticePeriodDuration" name="employeeEmploymentDetailsDTO.noticePeriodDuration" value={formData.employeeEmploymentDetailsDTO?.noticePeriodDuration || ''} onChange={handleChange} placeholder="e.g. 30 days" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="probationApplicable" type="checkbox" name="employeeEmploymentDetailsDTO.probationApplicable" checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <label htmlFor="probationApplicable" className="text-sm font-medium text-gray-700">Probation Applicable</label>
                </div>
                {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                  <>
                    <div>
                      <label htmlFor="probationDuration" className="block text-sm font-medium text-gray-700 mb-1">Probation Duration</label>
                      <input id="probationDuration" name="employeeEmploymentDetailsDTO.probationDuration" value={formData.employeeEmploymentDetailsDTO?.probationDuration || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label htmlFor="probationNoticePeriod" className="block text-sm font-medium text-gray-700 mb-1">Probation Notice Period</label>
                      <input id="probationNoticePeriod" name="employeeEmploymentDetailsDTO.probationNoticePeriod" value={formData.employeeEmploymentDetailsDTO?.probationNoticePeriod || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <input id="bondApplicable" type="checkbox" name="employeeEmploymentDetailsDTO.bondApplicable" checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <label htmlFor="bondApplicable" className="text-sm font-medium text-gray-700">Bond Applicable</label>
                </div>
                {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                  <div>
                    <label htmlFor="bondDuration" className="block text-sm font-medium text-gray-700 mb-1">Bond Duration</label>
                    <input id="bondDuration" name="employeeEmploymentDetailsDTO.bondDuration" value={formData.employeeEmploymentDetailsDTO?.bondDuration || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                )}
                <div>
                  <label htmlFor="dateOfConfirmation" className="block text-sm font-medium text-gray-700 mb-1">Date of Confirmation</label>
                  <input type="date" id="dateOfConfirmation" name="employeeEmploymentDetailsDTO.dateOfConfirmation" value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </section>

            {/* ==================== DOCUMENTS ==================== */}
            <section className="border-b border-gray-200 pb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                  Documents
                </h3>
                <button
                  type="button"
                  onClick={addDocument}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  + Add Document
                </button>
              </div>

              <div className="space-y-6">
                {formData.documents.map((doc, i) => (
                  <div
                    key={doc.documentId || i}
                    className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50 relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Document Type</label>
                        <select
                          value={doc.docType}
                          onChange={e => handleDocumentChange(i, 'docType', e.target.value as DocumentType)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Type</option>
                          {documentTypes.map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Upload Document</label>
                        <FileInput
                          id={`doc-upload-${i}`}
                          onChange={file => handleDocumentChange(i, 'file', file)}
                          currentFile={(doc as FormDocument).file ?? null}
                          existingUrl={doc.fileUrl}
                          onClear={() => handleDocumentChange(i, 'file', null)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => confirmAndRemoveDocument(i)}
                      className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ==================== EQUIPMENT ==================== */}
            <section className="border-b border-gray-200 pb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-8 bg-green-600 rounded-full"></span>
                  Equipment Details
                </h3>
                <button
                  type="button"
                  onClick={addEquipment}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  + Add Equipment
                </button>
              </div>

              <div className="space-y-6">
                {formData.employeeEquipmentDTO?.map((eq, i) => (
                  <div
                    key={eq.equipmentId || i}
                    className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-green-50 relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Equipment Type</label>
                        <input
                          value={eq.equipmentType || ''}
                          onChange={e => handleEquipmentChange(i, 'equipmentType', e.target.value)}
                          placeholder="Enter Type"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Serial Number</label>
                        <input
                          value={eq.serialNumber || ''}
                          onChange={e => handleEquipmentChange(i, 'serialNumber', e.target.value)}
                          placeholder="Enter Serial"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Issued Date</label>
                        <input
                          type="date"
                          value={eq.issuedDate || ''}
                          onChange={e => handleEquipmentChange(i, 'issuedDate', e.target.value)}
                          max={today}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => confirmAndRemoveEquipment(i)}
                      className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Additional Details */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Letter</label>
                  <FileInput
                    id="offerLetter"
                    onChange={file => handleFileChange('offerLetter', file)}
                    currentFile={documentFiles.offerLetter}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.offerLetterUrl}
                    onClear={() => clearAdditionalFile('offerLetter')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                  <FileInput
                    id="contract"
                    onChange={file => handleFileChange('contract', file)}
                    currentFile={documentFiles.contract}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.contractUrl}
                    onClear={() => clearAdditionalFile('contract')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Declaration Form</label>
                  <FileInput
                    id="taxDeclarationForm"
                    onChange={file => handleFileChange('taxDeclarationForm', file)}
                    currentFile={documentFiles.taxDeclarationForm}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl}
                    onClear={() => clearAdditionalFile('taxDeclarationForm')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit</label>
                  <FileInput
                    id="workPermit"
                    onChange={file => handleFileChange('workPermit', file)}
                    currentFile={documentFiles.workPermit}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.workPermitUrl}
                    onClear={() => clearAdditionalFile('workPermit')}
                  />
                </div>
                <div>
                  <label htmlFor="additionalRemarks" className="block text-sm font-medium text-gray-700 mb-1">Additional Remarks</label>
                  <textarea id="additionalRemarks" name="employeeAdditionalDetailsDTO.remarks" value={formData.employeeAdditionalDetailsDTO?.remarks || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="generalRemarks" className="block text-sm font-medium text-gray-700 mb-1">General Remarks</label>
                  <textarea id="generalRemarks" name="remarks" value={formData.remarks ?? ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="backgroundCheckStatus" className="block text-sm font-medium text-gray-700 mb-1">Background Check Status</label>
                  <input id="backgroundCheckStatus" name="employeeAdditionalDetailsDTO.backgroundCheckStatus" value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </section>

            {/* Insurance & Statutory */}
            <section className="pb-6 space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label><input type="text" name="employeeInsuranceDetailsDTO.policyNumber" value={formData.employeeInsuranceDetailsDTO?.policyNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label><input type="text" name="employeeInsuranceDetailsDTO.providerName" value={formData.employeeInsuranceDetailsDTO?.providerName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Coverage Start</label><input type="date" name="employeeInsuranceDetailsDTO.coverageStart" value={formData.employeeInsuranceDetailsDTO?.coverageStart || ''} onChange={handleChange} max={today} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Coverage End</label><input type="date" name="employeeInsuranceDetailsDTO.coverageEnd" value={formData.employeeInsuranceDetailsDTO?.coverageEnd || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominee Name</label><input type="text" name="employeeInsuranceDetailsDTO.nomineeName" value={formData.employeeInsuranceDetailsDTO?.nomineeName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominee Relation</label><input type="text" name="employeeInsuranceDetailsDTO.nomineeRelation" value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominee Contact</label><input type="tel" name="employeeInsuranceDetailsDTO.nomineeContact" value={formData.employeeInsuranceDetailsDTO?.nomineeContact || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div className="flex items-center gap-3"><label className="text-sm font-medium text-gray-700">Group Insurance</label><input type="checkbox" name="employeeInsuranceDetailsDTO.groupInsurance" checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false} onChange={handleChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /></div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statutory Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label><input type="text" name="employeeStatutoryDetailsDTO.passportNumber" value={formData.employeeStatutoryDetailsDTO?.passportNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">PF UAN Number</label><input type="text" name="employeeStatutoryDetailsDTO.pfUanNumber" value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Tax Regime</label><input type="text" name="employeeStatutoryDetailsDTO.taxRegime" value={formData.employeeStatutoryDetailsDTO?.taxRegime || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">ESI Number</label><input type="text" name="employeeStatutoryDetailsDTO.esiNumber" value={formData.employeeStatutoryDetailsDTO?.esiNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">SSN Number</label><input type="text" name="employeeStatutoryDetailsDTO.ssnNumber" value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/admin-dashboard/employees/list" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</Link>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2">
                {submitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
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