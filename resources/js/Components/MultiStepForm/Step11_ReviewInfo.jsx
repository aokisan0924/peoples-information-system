import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";

export default function Step11_ReviewInfo({ data, onBack, onSubmit }) {
  const [state, setState] = useState({
    isClient: false,
    showModal: false,
    captchaValidated: false,
  });

  useEffect(() => {
    setState(prev => ({ ...prev, isClient: true }));
  }, []);

  const formatValue = (val, isDate = false) => {
    if (!val) return "";
    if (isDate) {
      const date = new Date(val);
      if (isNaN(date)) return val;
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return val;
  };

  const renderRow = (label, value, isDate = false) => (
    <tr className="border-b">
      <td className="font-medium text-left w-1/3 py-1 pr-4 align-top">{label}</td>
      <td className="text-left w-2/3 py-1">{formatValue(value, isDate)}</td>
    </tr>
  );

  const handleCaptchaChange = (value) => {
    if (value) {
      setState(prev => ({ ...prev, captchaValidated: true }));
    }
  };

  const handleConfirmSubmission = (e) => {
    e.preventDefault();
    if (!state.captchaValidated) {
      toast.error("Please complete the CAPTCHA before submitting.");
      return;
    }
    onSubmit();
  };

  if (!state.isClient) return null;

  return (
    <>
      <Head title="Membership Registration - People's Multi-Purpose Cooperative" />
      <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl space-y-6">
        <div className="flex justify-between items-start border-b pb-6">
          <div className="flex gap-4">
            <img src="/images/logo/pis_logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="text-green-700 font-bold text-base">PEOPLE'S MULTI-PURPOSE COOPERATIVE</p>
              <p>(MAIN OFFICE) Pricipe Building, Maharlika Hi-Way, Upi, Gamu, Isabela</p>
              <p>(SATELLITE OFFICE) 20-E, 2nd Camarilla St, Brgy San Roque, Cubao, Quezon City</p>
              <p className="italic text-gray-500 text-xs">
                Please fill out this form completely and legibly. Print all entries in CAPITAL LETTERS. Write "N/A" if Not Applicable.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-wide text-center">Membership Form</h2>
            <div className="text-sm text-gray-700">
              Date Signed: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            {data.profileImage && (
              <img
                src={typeof data.profileImage === 'string' ? data.profileImage : URL.createObjectURL(data.profileImage)}
                alt="Profile"
                className="w-[150px] h-[150px] border-2 border-gray-400 object-cover rounded shadow-sm"
              />
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">I. Members Information</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("Last Name", data.lastName)}
                {renderRow("First Name", data.firstName)}
                {renderRow("Middle Name", data.middleName)}
                {renderRow("Suffix", data.suffix)}
                {renderRow("Nickname", data.nickname)}
                {renderRow("Date of Birth", data.dob, true)}
                {renderRow("Age", data.age)}
                {renderRow("Gender", data.gender)}
                {renderRow("Civil Status", data.civilStatus)}
                {renderRow("Nationality", data.nationality)}
                {renderRow("Email Address", data.email)}
                {renderRow("Contact Number", data.contactNumber)}
                {renderRow("Office Branch", data.branch)}
                {renderRow("Address", data.fullAddress)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">II. AFP Member Info</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("AFPSN", data.afpsn)}
                {renderRow("Designation", data.designation)}
                {renderRow("AFP ID", data.afpId)}
                {renderRow("Present Assignment", data.presentAssignment)}
                {renderRow("Control No", data.controlNo)}
                {renderRow("Years in Service", data.yearsInService)}
                {renderRow("Enlistment Date", data.cadEnlistment, true)}
                {renderRow("Retirement Date", data.retirementDate, true)}
                {renderRow("Pension Date", data.pensionDate, true)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">III. Branch of Service</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("Branch Service", data.branchService)}
                {renderRow("Sub-Branch", data.subBranch)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">IV. Parents' Information</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("Mother's Name", data.motherName)}
                {renderRow("Mother's Age", data.motherAge)}
                {renderRow("Father's Name", data.fatherName)}
                {renderRow("Father's Age", data.fatherAge)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">V. Identification Info</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("TIN", data.tinNo)}
                {renderRow("GSIS/SSS", data.gsisNo)}
                {renderRow("CRN/UMID", data.crnUmidNo)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">VI. Spouse Information</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("Spouse Name", data.spouseName)}
                {renderRow("Date of Birth", data.spouseDob, true)}
                {renderRow("Age", data.spouseAge)}
                {renderRow("Date of Marriage", data.dateMarriage, true)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">VII. Dependents</h3>
            <table className="w-full text-sm table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-green-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Date of Birth</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Gender</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data.dependents) && data.dependents.length > 0 ? (
                  data.dependents.map((d, i) => (
                    <tr key={i}>
                      <td className="border border-gray-300 px-2 py-1">{formatValue(d.name)}</td>
                      <td className="border border-gray-300 px-2 py-1">{formatValue(d.dob, true)}</td>
                      <td className="border border-gray-300 px-2 py-1">{formatValue(d.gender)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-2 py-2 text-center">No dependents listed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">VIII. Emergency Contact</h3>
            <table className="w-full text-sm">
              <tbody>
                {renderRow("Contact Person", data.contactPersonName)}
                {renderRow("Address", data.contactPersonAddress)}
                {renderRow("Phone", data.contactPersonPhone)}
                {renderRow("Relation", data.contactPersonRelation)}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-green-700 font-semibold text-sm mb-1 uppercase">IX. Member Declaration</h3>
            <div className="text-sm text-gray-800 italic border p-4">
              I hereby certify under oath that the information above is true and correct and will abide as a member with the People's Multi-Purpose Cooperative policies and procedures.
            </div>
            <div className="flex justify-end mt-4 text-sm">
              <div className="text-center">
                {data.signatureData ? (
                  <img src={data.signatureData} alt="User Signature" className="w-64 h-24 object-contain" />
                ) : (
                  <div className="border-b border-black w-64 h-24 flex items-center justify-center text-gray-400">
                    No Signature Provided
                  </div>
                )}
                <p className="pt-2 font-semibold uppercase">
                  {`${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`}
                </p>
                <div className="border-t border-black w-64 mx-auto" />
                <p className="pt-1">Signature Over Printed Name / Date</p>
              </div>
            </div>
          </section>
        </div>

        {/* BACK and SUBMIT BUTTONS */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={onBack}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Back
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, showModal: true }))}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </div>
      {/* CONFIRMATION MODAL */}
      {state.showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800">Confirm Submission</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please complete the CAPTCHA to proceed with your registration.
            </p>

            {/* CAPTCHA */}
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey="6Lc2GSgrAAAAAG6Zx6OD5MykZu-7p8nSLWm-RorI"
                onChange={handleCaptchaChange}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setState(prev => ({ ...prev, showModal: false, captchaValidated: false }))}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={(e) => handleConfirmSubmission(e)}
                disabled={!state.captchaValidated}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
