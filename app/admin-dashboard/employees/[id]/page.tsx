'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeDTO, DocumentType } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import { User } from 'lucide-react';

const ViewEmployee = () => {
  const params = useParams();
  const { state } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!params.id || typeof params.id !== 'string') {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Invalid employee ID' });
        setLoading(false);
        return;
      }
      try {
        const response = await adminService.getEmployeeById(params.id);
        if (response.flag && response.response) {
          setEmployee(response.response);
        } else {
          throw new Error(response.message || 'Failed to fetch employee');
        }
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to fetch employee' });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="text-center py-12 text-gray-500">Employee not found</div>
      </ProtectedRoute>
    );
  }

  const hasValue = (val: any): boolean => val != null && val !== '' && val !== 'null' && val !== 'undefined';

  const formatEnum = (value: string | undefined) =>
    value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null;

  const formatDuration = (value: string | undefined) => value || null;

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              {employee.designation} {employee.clientName ? `• ${employee.clientName}` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin-dashboard/employees/${employee.employeeId}/edit`}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Edit Employee
            </Link>
            <Link
              href="/admin-dashboard/employees/list"
              className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Personal Information */}
        {(employee.employeePhotoUrl ||
          hasValue(employee.firstName) ||
          hasValue(employee.lastName) ||
          hasValue(employee.personalEmail) ||
          hasValue(employee.companyEmail) ||
          hasValue(employee.contactNumber) ||
          hasValue(employee.alternateContactNumber) ||
          hasValue(employee.gender) ||
          hasValue(employee.maritalStatus) ||
          hasValue(employee.numberOfChildren) ||
          hasValue(employee.dateOfBirth) ||
          hasValue(employee.nationality) ||
          hasValue(employee.emergencyContactName) ||
          hasValue(employee.emergencyContactNumber) ||
          hasValue(employee.skillsAndCertification) ||
          hasValue(employee.remarks)) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* {employee.employeePhotoUrl && (
                  <div className="md:col-span-2 flex justify-center mb-4">
                    <img
                      src={employee.employeePhotoUrl}
                      alt="Employee"
                      className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow-md"
                    />
                  </div>
                )} */}
                <div className="md:col-span-2 flex justify-center mb-4">
                  <div className="w-28 h-28 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center shadow-md">
                    <User className="w-14 h-14 text-blue-600" />
                  </div>
                </div>
                {hasValue(employee.firstName) && <InfoItem label="First Name" value={employee.firstName!} />}
                {hasValue(employee.lastName) && <InfoItem label="Last Name" value={employee.lastName!} />}
                {hasValue(employee.personalEmail) && <InfoItem label="Personal Email" value={employee.personalEmail!} />}
                {hasValue(employee.companyEmail) && <InfoItem label="Company Email" value={employee.companyEmail!} />}
                {hasValue(employee.contactNumber) && <InfoItem label="Contact Number" value={employee.contactNumber!} />}
                {hasValue(employee.alternateContactNumber) && <InfoItem label="Alternate Number" value={employee.alternateContactNumber!} />}
                {hasValue(employee.gender) && <InfoItem label="Gender" value={employee.gender!} />}
                {hasValue(employee.maritalStatus) && <InfoItem label="Marital Status" value={employee.maritalStatus!} />}
                {hasValue(employee.numberOfChildren) && <InfoItem label="Children" value={String(employee.numberOfChildren!)} />}
                {hasValue(employee.dateOfBirth) && <InfoItem label="Date of Birth" value={employee.dateOfBirth!} />}
                {hasValue(employee.nationality) && <InfoItem label="Nationality" value={employee.nationality!} />}
                {(hasValue(employee.emergencyContactName) || hasValue(employee.emergencyContactNumber)) && (
                  <InfoItem
                    label="Emergency Contact"
                    value={`${employee.emergencyContactName || ''} (${employee.emergencyContactNumber || ''})`.trim()}
                  />
                )}
                {hasValue(employee.skillsAndCertification) && <InfoItem label="Skills & Certifications" value={employee.skillsAndCertification!} />}
                {hasValue(employee.remarks) && <InfoItem label="Remarks" value={employee.remarks!} className="md:col-span-2" />}
              </div>
            </div>
          )}

        {/* Professional Details */}
        {(hasValue(employee.designation) ||
          hasValue(employee.dateOfJoining) ||
          hasValue(employee.clientName) ||
          hasValue(employee.clientStatus) ||
          hasValue(employee.employmentType) ||
          hasValue(employee.rateCard) ||
          hasValue(employee.availableLeaves) ||
          hasValue(employee.reportingManagerName)) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Professional Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hasValue(employee.designation) && <InfoItem label="Designation" value={employee.designation!} />}
                {hasValue(employee.dateOfJoining) && <InfoItem label="Date of Joining" value={employee.dateOfJoining!} />}
                {hasValue(employee.clientName) && <InfoItem label="Company" value={employee.clientName!} />}
                {hasValue(employee.clientStatus) && <InfoItem label="Client Status" value={employee.clientStatus!} />}
                {hasValue(employee.employmentType) && <InfoItem label="Employment Type" value={employee.employmentType!} />}
                {hasValue(employee.rateCard) && <InfoItem label="Rate Card" value={String(employee.rateCard!)} />}              {hasValue(employee.availableLeaves) && <InfoItem label="Available Leaves" value={String(employee.availableLeaves!)} />}
                {hasValue(employee.reportingManagerName) && <InfoItem label="Reporting Manager" value={employee.reportingManagerName!} />}
              </div>
            </div>
          )}

        {/* Bank & Identity */}
        {(hasValue(employee.accountHolderName) ||
          hasValue(employee.bankName) ||
          hasValue(employee.accountNumber) ||
          hasValue(employee.ifscCode) ||
          hasValue(employee.branchName) ||
          hasValue(employee.panNumber) ||
          hasValue(employee.aadharNumber)) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                Bank & Identity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hasValue(employee.accountHolderName) && <InfoItem label="Account Holder" value={employee.accountHolderName!} />}
                {hasValue(employee.bankName) && <InfoItem label="Bank Name" value={employee.bankName!} />}
                {hasValue(employee.accountNumber) && <InfoItem label="Account Number" value={employee.accountNumber!} />}
                {hasValue(employee.ifscCode) && <InfoItem label="IFSC Code" value={employee.ifscCode!} />}
                {hasValue(employee.branchName) && <InfoItem label="Branch" value={employee.branchName!} />}
                {hasValue(employee.panNumber) && <InfoItem label="PAN Number" value={employee.panNumber!} />}
                {hasValue(employee.aadharNumber) && <InfoItem label="Aadhar Number" value={employee.aadharNumber!} />}
              </div>
            </div>
          )}

        {/* Address Details */}
        {employee.addresses?.some(addr =>
          hasValue(addr.houseNo) ||
          hasValue(addr.streetName) ||
          hasValue(addr.city) ||
          hasValue(addr.state) ||
          hasValue(addr.pincode) ||
          hasValue(addr.country)
        ) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                Address Details
              </h2>
              <div className="space-y-6">
                {employee.addresses
                  .filter(addr =>
                    hasValue(addr.houseNo) ||
                    hasValue(addr.streetName) ||
                    hasValue(addr.city) ||
                    hasValue(addr.state) ||
                    hasValue(addr.pincode) ||
                    hasValue(addr.country)
                  )
                  .map((addr, i) => (
                    <div key={addr.addressId || i} className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">
                        {addr.addressType ? `${addr.addressType} Address` : `Address ${i + 1}`}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {hasValue(addr.houseNo) && <InfoItem label="House No" value={addr.houseNo!} compact />}
                        {hasValue(addr.streetName) && <InfoItem label="Street" value={addr.streetName!} compact />}
                        {hasValue(addr.city) && <InfoItem label="City" value={addr.city!} compact />}
                        {hasValue(addr.state) && <InfoItem label="State" value={addr.state!} compact />}
                        {hasValue(addr.pincode) && <InfoItem label="Pincode" value={addr.pincode!} compact />}
                        {hasValue(addr.country) && <InfoItem label="Country" value={addr.country!} compact />}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Documents */}
        {employee.documents?.some(d => hasValue(d.fileUrl)) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></span>
              Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employee.documents.find(d => d.docType === 'OFFER_LETTER' && hasValue(d.fileUrl)) && <DocItem label="Offer Letter" url={employee.documents.find(d => d.docType === 'OFFER_LETTER')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'CONTRACT' && hasValue(d.fileUrl)) && <DocItem label="Contract" url={employee.documents.find(d => d.docType === 'CONTRACT')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'TAX_DECLARATION_FORM' && hasValue(d.fileUrl)) && <DocItem label="Tax Declaration" url={employee.documents.find(d => d.docType === 'TAX_DECLARATION_FORM')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'WORK_PERMIT' && hasValue(d.fileUrl)) && <DocItem label="Work Permit" url={employee.documents.find(d => d.docType === 'WORK_PERMIT')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'PAN_CARD' && hasValue(d.fileUrl)) && <DocItem label="PAN Card" url={employee.documents.find(d => d.docType === 'PAN_CARD')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'AADHAR_CARD' && hasValue(d.fileUrl)) && <DocItem label="Aadhar Card" url={employee.documents.find(d => d.docType === 'AADHAR_CARD')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'BANK_PASSBOOK' && hasValue(d.fileUrl)) && <DocItem label="Bank Passbook" url={employee.documents.find(d => d.docType === 'BANK_PASSBOOK')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'TENTH_CERTIFICATE' && hasValue(d.fileUrl)) && <DocItem label="10th Certificate" url={employee.documents.find(d => d.docType === 'TENTH_CERTIFICATE')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'INTERMEDIATE_CERTIFICATE' && hasValue(d.fileUrl)) && <DocItem label="Intermediate" url={employee.documents.find(d => d.docType === 'INTERMEDIATE_CERTIFICATE')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'DEGREE_CERTIFICATE' && hasValue(d.fileUrl)) && <DocItem label="Degree" url={employee.documents.find(d => d.docType === 'DEGREE_CERTIFICATE')!.fileUrl!} />}
              {employee.documents.find(d => d.docType === 'POST_GRADUATION_CERTIFICATE' && hasValue(d.fileUrl)) && <DocItem label="Post Graduation" url={employee.documents.find(d => d.docType === 'POST_GRADUATION_CERTIFICATE')!.fileUrl!} />}
            </div>

            {employee.documents.filter(d => d.docType === 'OTHER' && hasValue(d.fileUrl)).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Other Documents</h4>
                <div className="space-y-2">
                  {employee.documents
                    .filter(d => d.docType === 'OTHER' && hasValue(d.fileUrl))
                    .map((doc, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="font-medium">Document {i + 1}</span>
                        <a href={doc.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salary & Compensation */}
        {employee.employeeSalaryDTO && (
          hasValue(employee.employeeSalaryDTO.ctc) ||
          hasValue(employee.employeeSalaryDTO.payType) ||
          hasValue(employee.employeeSalaryDTO.standardHours) ||
          hasValue(employee.employeeSalaryDTO.payClass) ||
          (employee.employeeSalaryDTO.allowances?.length ?? 0) > 0 ||
          (employee.employeeSalaryDTO.deductions?.length ?? 0) > 0
        ) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-teal-600 rounded-full mr-3"></span>
                Salary & Compensation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hasValue(employee.employeeSalaryDTO.ctc) && <InfoItem label="CTC" value={String(employee.employeeSalaryDTO.ctc!)} />}
                {hasValue(employee.employeeSalaryDTO.payType) && <InfoItem label="Pay Type" value={employee.employeeSalaryDTO.payType!} />}
                {hasValue(employee.employeeSalaryDTO.standardHours) && <InfoItem label="Standard Hours" value={String(employee.employeeSalaryDTO.standardHours!)} />}
                {hasValue(employee.employeeSalaryDTO.payClass) && <InfoItem label="Pay Class" value={employee.employeeSalaryDTO.payClass!} />}
              </div>

              {employee.employeeSalaryDTO.allowances && employee.employeeSalaryDTO.allowances.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-3">Allowances</h4>
                  <div className="space-y-2">
                    {employee.employeeSalaryDTO.allowances.map((a, i) => (
                      <div key={i} className="bg-green-50 p-3 rounded-lg text-sm">
                        <strong>{a.allowanceType}:</strong> ₹{a.amount} (from {a.effectiveDate})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {employee.employeeSalaryDTO.deductions && employee.employeeSalaryDTO.deductions.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-3">Deductions</h4>
                  <div className="space-y-2">
                    {employee.employeeSalaryDTO.deductions.map((d, i) => (
                      <div key={i} className="bg-red-50 p-3 rounded-lg text-sm">
                        <strong>{d.deductionType}:</strong> ₹{d.amount} (from {d.effectiveDate})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Employment Terms */}
        {employee.employeeEmploymentDetailsDTO && (
          hasValue(employee.employeeEmploymentDetailsDTO.noticePeriodDurationLabel) ||
          employee.employeeEmploymentDetailsDTO.probationApplicable ||
          employee.employeeEmploymentDetailsDTO.bondApplicable ||
          hasValue(employee.employeeEmploymentDetailsDTO.workingModel) ||
          hasValue(employee.employeeEmploymentDetailsDTO.shiftTimingLabel) ||
          hasValue(employee.employeeEmploymentDetailsDTO.department) ||
          hasValue(employee.employeeEmploymentDetailsDTO.location) ||
          hasValue(employee.employeeEmploymentDetailsDTO.dateOfConfirmation)
        ) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
                Employment Terms
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hasValue(employee.employeeEmploymentDetailsDTO.noticePeriodDurationLabel) && (
                  <InfoItem label="Notice Period" value={formatDuration(employee.employeeEmploymentDetailsDTO.noticePeriodDurationLabel)!} />
                )}
                {employee.employeeEmploymentDetailsDTO.probationApplicable && (
                  <>
                    {hasValue(employee.employeeEmploymentDetailsDTO.probationDurationLabel) && (
                      <InfoItem label="Probation Duration" value={formatDuration(employee.employeeEmploymentDetailsDTO.probationDurationLabel)!} />
                    )}
                    {hasValue(employee.employeeEmploymentDetailsDTO.probationNoticePeriodLabel) && (
                      <InfoItem label="Probation Notice" value={formatDuration(employee.employeeEmploymentDetailsDTO.probationNoticePeriodLabel)!} />
                    )}
                  </>
                )}
                {employee.employeeEmploymentDetailsDTO.bondApplicable && hasValue(employee.employeeEmploymentDetailsDTO.bondDurationLabel) && (
                  <InfoItem label="Bond Duration" value={formatDuration(employee.employeeEmploymentDetailsDTO.bondDurationLabel)!} />
                )}
                {hasValue(employee.employeeEmploymentDetailsDTO.workingModel) && (
                  <InfoItem label="Working Model" value={formatEnum(employee.employeeEmploymentDetailsDTO.workingModel)!} />
                )}
                {hasValue(employee.employeeEmploymentDetailsDTO.shiftTimingLabel) && (
                  <InfoItem label="Shift Timing" value={formatDuration(employee.employeeEmploymentDetailsDTO.shiftTimingLabel)!} />
                )}
                {hasValue(employee.employeeEmploymentDetailsDTO.department) && (
                  <InfoItem label="Department" value={formatEnum(employee.employeeEmploymentDetailsDTO.department)!} />
                )}
                {hasValue(employee.employeeEmploymentDetailsDTO.location) && (
                  <InfoItem label="Location" value={employee.employeeEmploymentDetailsDTO.location!} />
                )}
                {hasValue(employee.employeeEmploymentDetailsDTO.dateOfConfirmation) && (
                  <InfoItem label="Date of Confirmation" value={employee.employeeEmploymentDetailsDTO.dateOfConfirmation!} />
                )}
              </div>
            </div>
          )}

        {/* Insurance & Benefits */}
        {employee.employeeInsuranceDetailsDTO && (
          hasValue(employee.employeeInsuranceDetailsDTO.policyNumber) ||
          hasValue(employee.employeeInsuranceDetailsDTO.providerName) ||
          hasValue(employee.employeeInsuranceDetailsDTO.coverageStart) ||
          hasValue(employee.employeeInsuranceDetailsDTO.coverageEnd) ||
          hasValue(employee.employeeInsuranceDetailsDTO.nomineeName) ||
          hasValue(employee.employeeInsuranceDetailsDTO.nomineeRelation) ||
          employee.employeeInsuranceDetailsDTO.groupInsurance != null
        ) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-pink-600 rounded-full mr-3"></span>
                Insurance & Benefits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hasValue(employee.employeeInsuranceDetailsDTO.policyNumber) && <InfoItem label="Policy Number" value={employee.employeeInsuranceDetailsDTO.policyNumber!} />}
                {hasValue(employee.employeeInsuranceDetailsDTO.providerName) && <InfoItem label="Provider" value={employee.employeeInsuranceDetailsDTO.providerName!} />}
                {(hasValue(employee.employeeInsuranceDetailsDTO.coverageStart) || hasValue(employee.employeeInsuranceDetailsDTO.coverageEnd)) && (
                  <InfoItem label="Coverage Period" value={`${employee.employeeInsuranceDetailsDTO.coverageStart || ''} to ${employee.employeeInsuranceDetailsDTO.coverageEnd || ''}`.trim()} />
                )}
                {(hasValue(employee.employeeInsuranceDetailsDTO.nomineeName) || hasValue(employee.employeeInsuranceDetailsDTO.nomineeRelation)) && (
                  <InfoItem label="Nominee" value={`${employee.employeeInsuranceDetailsDTO.nomineeName || ''} (${employee.employeeInsuranceDetailsDTO.nomineeRelation || ''})`.trim()} />
                )}
                {employee.employeeInsuranceDetailsDTO.groupInsurance != null && (
                  <InfoItem label="Group Insurance" value={employee.employeeInsuranceDetailsDTO.groupInsurance ? 'Yes' : 'No'} />
                )}
              </div>
            </div>
          )}

        {/* Assigned Equipment */}
        {employee.employeeEquipmentDTO?.some(eq =>
          hasValue(eq.equipmentType) ||
          hasValue(eq.serialNumber) ||
          hasValue(eq.issuedDate)
        ) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-cyan-600 rounded-full mr-3"></span>
                Assigned Equipment
              </h2>
              <div className="space-y-4">
                {employee.employeeEquipmentDTO
                  .filter(eq => hasValue(eq.equipmentType) || hasValue(eq.serialNumber) || hasValue(eq.issuedDate))
                  .map((eq, i) => (
                    <div key={eq.equipmentId || i} className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {hasValue(eq.equipmentType) && <InfoItem label="Type" value={eq.equipmentType!} compact />}
                        {hasValue(eq.serialNumber) && <InfoItem label="Serial No" value={eq.serialNumber!} compact />}
                        {hasValue(eq.issuedDate) && <InfoItem label="Issued On" value={eq.issuedDate!} compact />}
                        {hasValue(eq.returnedDate) && <InfoItem label="Returned On" value={eq.returnedDate!} compact />}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Statutory Information */}
        {employee.employeeStatutoryDetailsDTO && (
          hasValue(employee.employeeStatutoryDetailsDTO.passportNumber) ||
          hasValue(employee.employeeStatutoryDetailsDTO.taxRegime) ||
          hasValue(employee.employeeStatutoryDetailsDTO.pfUanNumber) ||
          hasValue(employee.employeeStatutoryDetailsDTO.esiNumber) ||
          hasValue(employee.employeeStatutoryDetailsDTO.ssnNumber)
        ) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                Statutory Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {hasValue(employee.employeeStatutoryDetailsDTO.passportNumber) && <InfoItem label="Passport" value={employee.employeeStatutoryDetailsDTO.passportNumber!} />}
                {hasValue(employee.employeeStatutoryDetailsDTO.taxRegime) && <InfoItem label="Tax Regime" value={employee.employeeStatutoryDetailsDTO.taxRegime!} />}
                {hasValue(employee.employeeStatutoryDetailsDTO.pfUanNumber) && <InfoItem label="PF UAN" value={employee.employeeStatutoryDetailsDTO.pfUanNumber!} />}
                {hasValue(employee.employeeStatutoryDetailsDTO.esiNumber) && <InfoItem label="ESI Number" value={employee.employeeStatutoryDetailsDTO.esiNumber!} />}
                {hasValue(employee.employeeStatutoryDetailsDTO.ssnNumber) && <InfoItem label="SSN" value={employee.employeeStatutoryDetailsDTO.ssnNumber!} />}
              </div>
            </div>
          )}
      </div>
    </ProtectedRoute>
  );
};

const InfoItem = ({ label, value, compact = false, className = '' }: { label: string; value: string; compact?: boolean; className?: string }) => (
  <div className={`${compact ? 'text-sm' : ''} ${className}`}>
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className="mt-1 font-medium text-gray-900">{value}</p>
  </div>
);

const DocItem = ({ label, url }: { label: string; url: string }) => (
  <div>
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className="mt-1">
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
        View Document
      </a>
    </p>
  </div>
);

export default ViewEmployee;