"use client";

import React, { useState, useEffect } from 'react';

import {
  EmployeeDTO,
  AddressModel,
  EmployeeSalaryDTO,
  EmployeeAdditionalDetailsDTO,
  EmployeeEmploymentDetailsDTO,
  EmployeeInsuranceDetailsDTO,
  EmployeeStatutoryDetailsDTO,
  EmployeeEquipmentDTO,
  EmployeeDocumentDTO,
  Designation,
  EmploymentType,
  WebResponseDTOString,
  WebResponseDTOEmployeeDTO,
} from '@/lib/api/types'; // Adjust path to your types file
import { adminService } from '@/lib/api/adminService';

interface EmployeeEditPageProps {
  employeeId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const EmployeeEditPage: React.FC<EmployeeEditPageProps> = ({ employeeId, onSave, onCancel }) => {
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - Use Partial<EmployeeDTO> but extend for nested handling
  const [formData, setFormData] = useState<Partial<EmployeeDTO>>({});

  // For file uploads, track new files
  const [newDocuments, setNewDocuments] = useState<{ file: File; docType: string }[]>([]);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        const response: WebResponseDTOEmployeeDTO = await adminService.getEmployeeById(employeeId);
        if (!response.flag) throw new Error(response.message);
        const data = response.response!;
        setEmployee(data);
        setFormData(data); // Initialize form with fetched data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const handleInputChange = (field: keyof EmployeeDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNestedChange = (
    nestedKey: keyof EmployeeDTO,
    field: keyof any,
    value: any,
    index?: number,
    subKey?: string
  ) => {
    setFormData((prev) => {
      let nested: any;
      if (index !== undefined) {
        const arr = (prev[nestedKey] as AddressModel[] | EmployeeDocumentDTO[] | EmployeeEquipmentDTO[] | undefined) || [];
        nested = [...arr];
      } else {
        const obj = (prev[nestedKey] as EmployeeSalaryDTO | EmployeeAdditionalDetailsDTO | EmployeeEmploymentDetailsDTO | EmployeeInsuranceDetailsDTO | EmployeeStatutoryDetailsDTO | undefined) || {};
        nested = { ...obj };
      }
      if (index !== undefined && Array.isArray(nested)) {
        if (subKey) {
          nested[index][subKey] = { ...nested[index][subKey], [field]: value };
        } else {
          nested[index] = { ...nested[index], [field]: value };
        }
      } else if (subKey) {
        nested[subKey] = { ...nested[subKey], [field]: value };
      } else {
        nested[field] = value;
      }
      return { ...prev, [nestedKey]: nested };
    });
    setError(null);
  };

  const handleAddAddress = () => {
    const newAddress: AddressModel = {
      addressId: '', // Will be generated on save
      houseNo: '',
      streetName: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      addressType: '',
    };
    setFormData((prev) => ({
      ...prev,
      addresses: [...(prev.addresses || []), newAddress],
    }));
  };

  const handleRemoveAddress = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addresses: (prev.addresses || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddDocument = (file: File, docType: string) => {
    setNewDocuments((prev) => [...prev, { file, docType }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    try {
      setSaving(true);
      // Handle new document uploads first
      const uploadedDocUrls: string[] = [];
      for (const doc of newDocuments) {
        const uploadResponse = await adminService.uploadFile(doc.file);
        if (uploadResponse.flag) {
          uploadedDocUrls.push(uploadResponse.response!);
          // Append to existing documents
          const newDoc: EmployeeDocumentDTO = {
            documentId: '', // Generated
            docType: doc.docType as any,
            fileUrl: uploadResponse.response!,
            uploadedAt: new Date().toISOString(),
            verified: false,
          };
          setFormData((prev) => ({
            ...prev,
            documents: [...(prev.documents || []), newDoc],
          }));
        }
      }

      // Map formData to EmployeeModel if needed (assuming compatible)
      const employeeModel = formData as any; // Type assertion for compatibility

      const updateResponse: WebResponseDTOString = await adminService.updateEmployee(employeeId, employeeModel);
      if (!updateResponse.flag) throw new Error(updateResponse.message);

      if (onSave) onSave();
      alert('Employee updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  if (loading) return <div>Loading employee data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!employee) return <div>Employee not found.</div>;

  const designations: Designation[] = [
    "INTERN", "TRAINEE", "ASSOCIATE_ENGINEER", "SOFTWARE_ENGINEER", "SENIOR_SOFTWARE_ENGINEER",
    "LEAD_ENGINEER", "TEAM_LEAD", "TECHNICAL_ARCHITECT", "REPORTING_MANAGER", "DELIVERY_MANAGER",
    "DIRECTOR", "VP_ENGINEERING", "CTO", "HR", "FINANCE", "OPERATIONS"
  ];

  const employmentTypes: EmploymentType[] = ["CONTRACTOR", "FREELANCER", "FULLTIME"];

  return (
    <div className="employee-edit-page p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Employee: {employee.firstName} {employee.lastName}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="email"
              placeholder="Personal Email"
              value={formData.personalEmail || ''}
              onChange={(e) => handleInputChange('personalEmail', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="email"
              placeholder="Company Email"
              value={formData.companyEmail || ''}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              className="border p-2 rounded"
              required
            />
            <input
              type="tel"
              placeholder="Contact Number"
              value={formData.contactNumber || ''}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="tel"
              placeholder="Alternate Contact Number"
              value={formData.alternateContactNumber || ''}
              onChange={(e) => handleInputChange('alternateContactNumber', e.target.value)}
              className="border p-2 rounded"
            />
            <select
              value={formData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={formData.maritalStatus || ''}
              onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Marital Status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
            </select>
            <input
              type="number"
              placeholder="Number of Children"
              value={formData.numberOfChildren || 0}
              onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value) || 0)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              placeholder="Date of Birth"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="url"
              placeholder="Employee Photo URL"
              value={formData.employeePhotoUrl || ''}
              onChange={(e) => handleInputChange('employeePhotoUrl', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Nationality"
              value={formData.nationality || ''}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Emergency Contact Name"
              value={formData.emergencyContactName || ''}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="tel"
              placeholder="Emergency Contact Number"
              value={formData.emergencyContactNumber || ''}
              onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
              className="border p-2 rounded"
            />
            <textarea
              placeholder="Remarks"
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              className="border p-2 rounded col-span-2"
              rows={3}
            />
            <textarea
              placeholder="Skills and Certification"
              value={formData.skillsAndCertification || ''}
              onChange={(e) => handleInputChange('skillsAndCertification', e.target.value)}
              className="border p-2 rounded col-span-2"
              rows={3}
            />
          </div>
        </section>

        {/* Employment Details Section */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Employment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              placeholder="Date of Joining"
              value={formData.dateOfJoining || ''}
              onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.designation || ''}
              onChange={(e) => handleInputChange('designation', e.target.value as Designation)}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Designation</option>
              {designations.map((des) => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
            <select
              value={formData.employmentType || ''}
              onChange={(e) => handleInputChange('employmentType', e.target.value as EmploymentType)}
              className="border p-2 rounded"
            >
              <option value="">Employment Type</option>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Rate Card"
              value={formData.rateCard || 0}
              onChange={(e) => handleInputChange('rateCard', parseFloat(e.target.value) || 0)}
              className="border p-2 rounded"
              step="0.01"
            />
            <input
              type="text"
              placeholder="PAN Number"
              value={formData.panNumber || ''}
              onChange={(e) => handleInputChange('panNumber', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Aadhar Number"
              value={formData.aadharNumber || ''}
              onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Company ID"
              value={formData.companyId || ''}
              onChange={(e) => handleInputChange('companyId', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Client ID"
              value={formData.clientId || ''}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Client Name"
              value={formData.clientName || ''}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Reporting Manager ID"
              value={formData.reportingManagerId || ''}
              onChange={(e) => handleInputChange('reportingManagerId', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Reporting Manager Name"
              value={formData.reportingManagerName || ''}
              onChange={(e) => handleInputChange('reportingManagerName', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Available Leaves"
              value={formData.availableLeaves || 0}
              onChange={(e) => handleInputChange('availableLeaves', parseFloat(e.target.value) || 0)}
              className="border p-2 rounded"
            />
          </div>
        </section>

        {/* Bank Details */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Account Number"
              value={formData.accountNumber || ''}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Account Holder Name"
              value={formData.accountHolderName || ''}
              onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Bank Name"
              value={formData.bankName || ''}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="IFSC Code"
              value={formData.ifscCode || ''}
              onChange={(e) => handleInputChange('ifscCode', e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Branch Name"
              value={formData.branchName || ''}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        </section>

        {/* Addresses Section */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Addresses</h2>
          {(formData.addresses || []).map((addr: AddressModel, index: number) => (
            <div key={index} className="border mb-4 p-4 rounded">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="House No"
                  value={addr.houseNo || ''}
                  onChange={(e) => handleNestedChange('addresses', 'houseNo', e.target.value, index)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Street Name"
                  value={addr.streetName || ''}
                  onChange={(e) => handleNestedChange('addresses', 'streetName', e.target.value, index)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={addr.city || ''}
                  onChange={(e) => handleNestedChange('addresses', 'city', e.target.value, index)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addr.state || ''}
                  onChange={(e) => handleNestedChange('addresses', 'state', e.target.value, index)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={addr.country || ''}
                  onChange={(e) => handleNestedChange('addresses', 'country', e.target.value, index)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={addr.pincode || ''}
                  onChange={(e) => handleNestedChange('addresses', 'pincode', e.target.value, index)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Address Type"
                  value={addr.addressType || ''}
                  onChange={(e) => handleNestedChange('addresses', 'addressType', e.target.value, index)}
                  className="border p-2 rounded"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAddress(index)}
                className="mt-2 bg-red-500 text-white px-4 py-1 rounded"
              >
                Remove Address
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAddress}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Address
          </button>
        </section>

        {/* Documents Section */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Documents</h2>
          {(formData.documents || []).map((doc: EmployeeDocumentDTO, index: number) => (
            <div key={index} className="border mb-4 p-4 rounded">
              <p>Document Type: {doc.docType}</p>
              <p>URL: <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">{doc.fileUrl}</a></p>
              <p>Verified: {doc.verified ? 'Yes' : 'No'}</p>
              {/* For editing, perhaps allow re-upload or verification toggle */}
              <label>
                <input
                  type="checkbox"
                  checked={doc.verified || false}
                  onChange={(e) => handleNestedChange('documents', 'verified', e.target.checked, index)}
                />
                Verified
              </label>
            </div>
          ))}
          <div className="mb-4">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const docType = prompt('Enter Document Type (e.g., OFFER_LETTER)');
                  if (docType) handleAddDocument(file, docType);
                }
              }}
              className="border p-2 rounded"
            />
          </div>
        </section>

        {/* Salary Details Section - Simplified */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Salary Details</h2>
          {formData.employeeSalaryDTO && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Basic Pay"
                value={formData.employeeSalaryDTO.basicPay || 0}
                onChange={(e) => handleNestedChange('employeeSalaryDTO', 'basicPay', parseFloat(e.target.value) || 0)}
                className="border p-2 rounded"
                step="0.01"
              />
              <input
                type="text"
                placeholder="Pay Type"
                value={formData.employeeSalaryDTO.payType || ''}
                onChange={(e) => handleNestedChange('employeeSalaryDTO', 'payType', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Standard Hours"
                value={formData.employeeSalaryDTO.standardHours || 0}
                onChange={(e) => handleNestedChange('employeeSalaryDTO', 'standardHours', parseFloat(e.target.value) || 0)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Bank Account Number"
                value={formData.employeeSalaryDTO.bankAccountNumber || ''}
                onChange={(e) => handleNestedChange('employeeSalaryDTO', 'bankAccountNumber', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={formData.employeeSalaryDTO.ifscCode || ''}
                onChange={(e) => handleNestedChange('employeeSalaryDTO', 'ifscCode', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Pay Class"
                value={formData.employeeSalaryDTO.payClass || ''}
                onChange={(e) => handleNestedChange('employeeSalaryDTO', 'payClass', e.target.value)}
                className="border p-2 rounded"
              />
              {/* Allowances and Deductions can be added as arrays if needed */}
            </div>
          )}
        </section>

        {/* Other Nested Sections - Additional, Employment, Insurance, Statutory, Equipment */}
        {/* Similar structure for each: EmployeeAdditionalDetailsDTO, etc. */}
        {/* For brevity, implement as needed; example for Employment Details */}
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Employment Details</h2>
          {formData.employeeEmploymentDetailsDTO && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Notice Period Duration"
                value={formData.employeeEmploymentDetailsDTO.noticePeriodDuration || ''}
                onChange={(e) => handleNestedChange('employeeEmploymentDetailsDTO', 'noticePeriodDuration', e.target.value)}
                className="border p-2 rounded"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.employeeEmploymentDetailsDTO.probationApplicable || false}
                  onChange={(e) => handleNestedChange('employeeEmploymentDetailsDTO', 'probationApplicable', e.target.checked)}
                />
                Probation Applicable
              </label>
              {/* Add more fields similarly */}
            </div>
          )}
        </section>

        {/* Status and Timestamps - Read-only */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Status"
            value={formData.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="border p-2 rounded"
          />
          <p>Created: {employee.createdAt}</p>
          <p>Updated: {employee.updatedAt}</p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEditPage;