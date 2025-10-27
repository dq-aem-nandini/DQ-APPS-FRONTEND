'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeDTO, DocumentType } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';

const ViewEmployee = () => {
  const params = useParams();
  const { state } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!params.id || typeof params.id !== 'string') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Invalid employee ID',
        });
        setLoading(false);
        return;
      }
      try {
        const response = await adminService.getEmployeeById(params.id);
        console.log('Backend Employee Response:', response);
        if (response.flag && response.response) {
          setEmployee(response.response);
        } else {
          throw new Error(response.message || 'Failed to fetch employee');
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to fetch employee',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center">Loading employee details...</div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center text-gray-500">Employee not found</div>
      </ProtectedRoute>
    );
  }

  const getFieldValue = (value: string | number | boolean | undefined) => value != null ? String(value) : 'N/A';

  const getDocumentUrl = (type: DocumentType) => {
    const doc = employee.documents.find(doc => doc.docType === type);
    return doc ? (
      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
    ) : 'N/A';
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
          <div className="space-x-2">
            <Link
              href={`/admin-dashboard/employees/${employee.employeeId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit
            </Link>
            <Link
              href="/admin-dashboard/employees/list"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to List
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Name:</strong> {employee.firstName} {employee.lastName}</p>
                {employee.employeePhotoUrl && (
                  <div className="col-span-2">
                    <p><strong>Photo:</strong></p>
                    <img src={employee.employeePhotoUrl} alt="Employee Photo" className="w-20 h-20 rounded object-cover mt-1" />
                  </div>
                )}
                <p><strong>Personal Email:</strong> {getFieldValue(employee.personalEmail)}</p>
                <p><strong>Company Email:</strong> {getFieldValue(employee.companyEmail)}</p>
                <p><strong>Contact Number:</strong> {getFieldValue(employee.contactNumber)}</p>
                <p><strong>Alternate Contact Number:</strong> {getFieldValue(employee.alternateContactNumber)}</p>
                <p><strong>Gender:</strong> {getFieldValue(employee.gender)}</p>
                <p><strong>Marital Status:</strong> {getFieldValue(employee.maritalStatus)}</p>
                <p><strong>Number of Children:</strong> {getFieldValue(employee.numberOfChildren)}</p>
                <p><strong>Date of Birth:</strong> {getFieldValue(employee.dateOfBirth)}</p>
                <p><strong>Nationality:</strong> {getFieldValue(employee.nationality)}</p>
                <p><strong>Emergency Contact Name:</strong> {getFieldValue(employee.emergencyContactName)}</p>
                <p><strong>Emergency Contact Number:</strong> {getFieldValue(employee.emergencyContactNumber)}</p>
                <p><strong>Remarks:</strong> {getFieldValue(employee.remarks)}</p>
                <p><strong>Skills and Certifications:</strong> {getFieldValue(employee.skillsAndCertification)}</p>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Employee ID:</strong> {getFieldValue(employee.employeeId)}</p>
                <p><strong>Designation:</strong> {getFieldValue(employee.designation)}</p>
                <p><strong>Date of Joining:</strong> {getFieldValue(employee.dateOfJoining)}</p>
                <p><strong>Employment Type:</strong> {getFieldValue(employee.employmentType)}</p>
                <p><strong>Rate Card:</strong> {getFieldValue(employee.rateCard)}</p>
                <p><strong>Available Leaves:</strong> {getFieldValue(employee.availableLeaves)}</p>
                <p><strong>Client ID:</strong> {getFieldValue(employee.clientId)}</p>
                <p><strong>Client Name:</strong> {getFieldValue(employee.clientName)}</p>
                <p><strong>Reporting Manager ID:</strong> {getFieldValue(employee.reportingManagerId)}</p>
                <p><strong>Reporting Manager Name:</strong> {getFieldValue(employee.reportingManagerName)}</p>
                <p><strong>Company ID:</strong> {getFieldValue(employee.companyId)}</p>
                <p><strong>Status:</strong>
                  <span className={`inline-flex px-2 py-1 ml-2 text-xs font-semibold rounded-full ${
                    employee.status.toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    employee.status.toUpperCase() === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status}
                  </span>
                </p>
                <p><strong>Created At:</strong> {getFieldValue(employee.createdAt)}</p>
                <p><strong>Updated At:</strong> {getFieldValue(employee.updatedAt)}</p>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Account Number:</strong> {getFieldValue(employee.accountNumber)}</p>
                <p><strong>Account Holder Name:</strong> {getFieldValue(employee.accountHolderName)}</p>
                <p><strong>Bank Name:</strong> {getFieldValue(employee.bankName)}</p>
                <p><strong>IFSC Code:</strong> {getFieldValue(employee.ifscCode)}</p>
                <p><strong>Branch Name:</strong> {getFieldValue(employee.branchName)}</p>
                <p><strong>PAN Number:</strong> {getFieldValue(employee.panNumber)}</p>
                <p><strong>Aadhar Number:</strong> {getFieldValue(employee.aadharNumber)}</p>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Address Details</h3>
              {employee.addresses.length > 0 ? (
                employee.addresses.map((address, index) => (
                  <div key={address.addressId || index} className="mb-4 border-t pt-2">
                    <h4 className="text-md font-medium text-gray-700">
                      {address.addressType ? `${address.addressType} Address` : `Address ${index + 1}`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p><strong>House No:</strong> {getFieldValue(address.houseNo)}</p>
                      <p><strong>Street Name:</strong> {getFieldValue(address.streetName)}</p>
                      <p><strong>City:</strong> {getFieldValue(address.city)}</p>
                      <p><strong>State:</strong> {getFieldValue(address.state)}</p>
                      <p><strong>Pincode:</strong> {getFieldValue(address.pincode)}</p>
                      <p><strong>Country:</strong> {getFieldValue(address.country)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No addresses available</p>
              )}
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <p><strong>Offer Letter:</strong> {getDocumentUrl('OFFER_LETTER')}</p>
                <p><strong>Contract:</strong> {getDocumentUrl('CONTRACT')}</p>
                <p><strong>Tax Declaration Form:</strong> {getDocumentUrl('TAX_DECLARATION_FORM')}</p>
                <p><strong>Work Permit:</strong> {getDocumentUrl('WORK_PERMIT')}</p>
                <p><strong>PAN Card:</strong> {getDocumentUrl('PAN_CARD')}</p>
                <p><strong>Aadhar Card:</strong> {getDocumentUrl('AADHAR_CARD')}</p>
                <p><strong>Bank Passbook:</strong> {getDocumentUrl('BANK_PASSBOOK')}</p>
                <p><strong>10th Certificate:</strong> {getDocumentUrl('TENTH_CERTIFICATE')}</p>
                <p><strong>Intermediate Certificate:</strong> {getDocumentUrl('INTERMEDIATE_CERTIFICATE')}</p>
                <p><strong>Degree Certificate:</strong> {getDocumentUrl('DEGREE_CERTIFICATE')}</p>
                <p><strong>Post Graduation Certificate:</strong> {getDocumentUrl('POST_GRADUATION_CERTIFICATE')}</p>
                {employee.documents.some(doc => doc.docType === 'OTHER') && (
                  <div className="col-span-3">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Other Documents</h4>
                    {employee.documents
                      .filter(doc => doc.docType === 'OTHER')
                      .map((doc, index) => (
                        <p key={index}>
                          <strong>Other Document {index + 1}:</strong>{' '}
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                          <span className="ml-2 text-sm text-gray-500">(Uploaded: {getFieldValue(doc.uploadedAt)}, Verified: {getFieldValue(doc.verified)})</span>
                        </p>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Salary Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Salary Details</h3>
              {employee.employeeSalaryDTO ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Employee ID:</strong> {getFieldValue(employee.employeeSalaryDTO.employeeId)}</p>
                    <p><strong>Basic Pay:</strong> {getFieldValue(employee.employeeSalaryDTO.basicPay)}</p>
                    <p><strong>Pay Type:</strong> {getFieldValue(employee.employeeSalaryDTO.payType)}</p>
                    <p><strong>Standard Hours:</strong> {getFieldValue(employee.employeeSalaryDTO.standardHours)}</p>
                    <p><strong>Bank Account Number:</strong> {getFieldValue(employee.employeeSalaryDTO.bankAccountNumber)}</p>
                    <p><strong>IFSC Code:</strong> {getFieldValue(employee.employeeSalaryDTO.ifscCode)}</p>
                    <p><strong>Pay Class:</strong> {getFieldValue(employee.employeeSalaryDTO.payClass)}</p>
                  </div>
                  {/* Allowances */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Allowances</h4>
                    {employee.employeeSalaryDTO.allowances && employee.employeeSalaryDTO.allowances.length > 0 ? (
                      employee.employeeSalaryDTO.allowances.map((allowance, index) => (
                        <div key={allowance.allowanceId || index} className="mb-2 border-t pt-2">
                          <p><strong>Allowance {index + 1} Type:</strong> {getFieldValue(allowance.allowanceType)}</p>
                          <p><strong>Amount:</strong> {getFieldValue(allowance.amount)}</p>
                          <p><strong>Effective Date:</strong> {getFieldValue(allowance.effectiveDate)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No allowances available</p>
                    )}
                  </div>
                  {/* Deductions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Deductions</h4>
                    {employee.employeeSalaryDTO.deductions && employee.employeeSalaryDTO.deductions.length > 0 ? (
                      employee.employeeSalaryDTO.deductions.map((deduction, index) => (
                        <div key={deduction.deductionId || index} className="mb-2 border-t pt-2">
                          <p><strong>Deduction {index + 1} Type:</strong> {getFieldValue(deduction.deductionType)}</p>
                          <p><strong>Amount:</strong> {getFieldValue(deduction.amount)}</p>
                          <p><strong>Effective Date:</strong> {getFieldValue(deduction.effectiveDate)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No deductions available</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No salary details available</p>
              )}
            </div>

            {/* Additional Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Details</h3>
              {employee.employeeAdditionalDetailsDTO ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><strong>Offer Letter:</strong> {employee.employeeAdditionalDetailsDTO.offerLetterUrl ? (
                    <a href={employee.employeeAdditionalDetailsDTO.offerLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                  ) : 'N/A'}</p>
                  <p><strong>Contract:</strong> {employee.employeeAdditionalDetailsDTO.contractUrl ? (
                    <a href={employee.employeeAdditionalDetailsDTO.contractUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                  ) : 'N/A'}</p>
                  <p><strong>Tax Declaration Form:</strong> {employee.employeeAdditionalDetailsDTO.taxDeclarationFormUrl ? (
                    <a href={employee.employeeAdditionalDetailsDTO.taxDeclarationFormUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                  ) : 'N/A'}</p>
                  <p><strong>Work Permit:</strong> {employee.employeeAdditionalDetailsDTO.workPermitUrl ? (
                    <a href={employee.employeeAdditionalDetailsDTO.workPermitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                  ) : 'N/A'}</p>
                  <p><strong>Background Check Status:</strong> {getFieldValue(employee.employeeAdditionalDetailsDTO.backgroundCheckStatus)}</p>
                  <p><strong>Remarks:</strong> {getFieldValue(employee.employeeAdditionalDetailsDTO.remarks)}</p>
                </div>
              ) : (
                <p className="text-gray-500">No additional details available</p>
              )}
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Employment Details</h3>
              {employee.employeeEmploymentDetailsDTO ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><strong>Employment ID:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.employmentId)}</p>
                  <p><strong>Employee ID:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.employeeId)}</p>
                  <p><strong>Notice Period Duration:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.noticePeriodDuration)}</p>
                  <p><strong>Probation Applicable:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.probationApplicable)}</p>
                  <p><strong>Probation Duration:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.probationDuration)}</p>
                  <p><strong>Probation Notice Period:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.probationNoticePeriod)}</p>
                  <p><strong>Bond Applicable:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.bondApplicable)}</p>
                  <p><strong>Bond Duration:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.bondDuration)}</p>
                  <p><strong>Working Model:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.workingModel)}</p>
                  <p><strong>Shift Timing:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.shiftTiming)}</p>
                  <p><strong>Department:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.department)}</p>
                  <p><strong>Date of Confirmation:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.dateOfConfirmation)}</p>
                  <p><strong>Location:</strong> {getFieldValue(employee.employeeEmploymentDetailsDTO.location)}</p>
                </div>
              ) : (
                <p className="text-gray-500">No employment details available</p>
              )}
            </div>

            {/* Insurance Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Insurance Details</h3>
              {employee.employeeInsuranceDetailsDTO ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><strong>Insurance ID:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.insuranceId)}</p>
                  <p><strong>Employee ID:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.employeeId)}</p>
                  <p><strong>Policy Number:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.policyNumber)}</p>
                  <p><strong>Provider Name:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.providerName)}</p>
                  <p><strong>Coverage Start:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.coverageStart)}</p>
                  <p><strong>Coverage End:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.coverageEnd)}</p>
                  <p><strong>Nominee Name:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.nomineeName)}</p>
                  <p><strong>Nominee Relation:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.nomineeRelation)}</p>
                  <p><strong>Nominee Contact:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.nomineeContact)}</p>
                  <p><strong>Group Insurance:</strong> {getFieldValue(employee.employeeInsuranceDetailsDTO.groupInsurance)}</p>
                  {employee.employeeInsuranceDetailsDTO.otherBenefits && Object.keys(employee.employeeInsuranceDetailsDTO.otherBenefits).length > 0 ? (
                    <div className="col-span-2">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Other Benefits</h4>
                      {Object.entries(employee.employeeInsuranceDetailsDTO.otherBenefits).map(([key, value], index) => (
                        <p key={index}><strong>{key}:</strong> {getFieldValue(value)}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="col-span-2 text-gray-500">No other benefits available</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No insurance details available</p>
              )}
            </div>

            {/* Equipment Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Details</h3>
              {employee.employeeEquipmentDTO && employee.employeeEquipmentDTO.length > 0 ? (
                employee.employeeEquipmentDTO.map((equipment, index) => (
                  <div key={equipment.equipmentId || index} className="mb-4 border-t pt-2">
                    <h4 className="text-md font-medium text-gray-700">Equipment {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <p><strong>Equipment ID:</strong> {getFieldValue(equipment.equipmentId)}</p>
                      <p><strong>Equipment Type:</strong> {getFieldValue(equipment.equipmentType)}</p>
                      <p><strong>Serial Number:</strong> {getFieldValue(equipment.serialNumber)}</p>
                      <p><strong>Issued Date:</strong> {getFieldValue(equipment.issuedDate)}</p>
                      <p><strong>Returned Date:</strong> {getFieldValue(equipment.returnedDate)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No equipment details available</p>
              )}
            </div>

            {/* Statutory Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Statutory Details</h3>
              {employee.employeeStatutoryDetailsDTO ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><strong>Statutory ID:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.statutoryId)}</p>
                  <p><strong>Employee ID:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.employeeId)}</p>
                  <p><strong>Passport Number:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.passportNumber)}</p>
                  <p><strong>Tax Regime:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.taxRegime)}</p>
                  <p><strong>PF UAN Number:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.pfUanNumber)}</p>
                  <p><strong>ESI Number:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.esiNumber)}</p>
                  <p><strong>SSN Number:</strong> {getFieldValue(employee.employeeStatutoryDetailsDTO.ssnNumber)}</p>
                </div>
              ) : (
                <p className="text-gray-500">No statutory details available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ViewEmployee;