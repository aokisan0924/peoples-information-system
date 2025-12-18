import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

import Step1_MemberInfo from './Step1_MemberInfo';
import Step2_AFPInfo from './Step2_AFPInfo';
import Step3_MemberBranchService from './Step3_MemberBranchService';
import Step4_ParentsInfo from './Step4_ParentsInfo';
import Step5_IdentificationInfo from './Step5_IdentificationInfo';
import Step6_SpouseInfo from './Step6_SpouseInfo';
import Step7_DependentsInfo from './Step7_DependentsInfo';
import Step8_ContactPersonInfo from './Step8_ContactPersonInfo';
import Step9_UserProfilePicture from './Step9_UserProfilePicture';
import Step10_UserSignature from './Step10_UserSignature';
import Step11_ReviewInfo from './Step11_ReviewInfo';

const TOTAL_STEPS = 11;

const stepComponents = [
  Step1_MemberInfo,
  Step2_AFPInfo,
  Step3_MemberBranchService,
  Step4_ParentsInfo,
  Step5_IdentificationInfo,
  Step6_SpouseInfo,
  Step7_DependentsInfo,
  Step8_ContactPersonInfo,
  Step9_UserProfilePicture,
  Step10_UserSignature,
  Step11_ReviewInfo,
];

const ProgressBar = ({ currentStep }) => (
  <div className="w-full bg-gray-300 rounded-full h-2 mb-6">
    <div
      className="bg-green-700 h-2 rounded-full transition-all"
      style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
    ></div>
  </div>
);

const StepWrapper = ({ children }) => (
  <div className="max-w-5xl mx-auto p-6">{children}</div>
);

const StepRouter = ({ state, setStep, handleDataChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = () => {
    const formData = new FormData();

    for (const key in state.formData) {
      const value = state.formData[key];

      if (Array.isArray(value)) {
        value.forEach((item, i) => {
          for (const subKey in item) {
            formData.append(`dependents[${i}][${subKey}]`, item[subKey]);
          }
        });
      } else if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, value);
      }
    }

    router.post(route('member.store'), formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success('Registration successful!');
        setTimeout(() => {
          router.visit('login');
        }, 1500);
      },
      onError: (errors) => {
        console.log('Validation Errors:', errors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error('Validation failed.');
      },
      onFinish: () => {
        toast.dismiss();
      },
    });
  };

  const generateStepProps = (index) => ({
    data: state.formData,
    onChange: handleDataChange,
    onNext: () => {
      setStep(index + 2);
      navigate(`/register/step${index + 2}`);
    },
    onBack: index > 0 ? () => {
      setStep(index);
      navigate(`/register/step${index}`);
    } : undefined,
    onSubmit: index === TOTAL_STEPS - 1 ? handleSubmit : undefined,
  });

  return (
    <StepWrapper>
      <h1 className="text-2xl font-bold mb-4">Membership Registration</h1>
      <ProgressBar currentStep={state.step} />
      <Routes location={location}>
        {stepComponents.map((Component, index) => (
          <Route
            key={index}
            path={`/register/step${index + 1}`}
            element={<Component {...generateStepProps(index)} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/register/step1" replace />} />
      </Routes>
    </StepWrapper>
  );
};

export default function MultiStepForm() {
  const [state, setState] = useState({ step: 1, formData: {} });

  const handleDataChange = (updated) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...updated },
    }));
  };

  const setStep = (step) => setState((prev) => ({ ...prev, step }));

  return (
    <MemoryRouter initialEntries={['/register/step1']}>
      <StepRouter state={state} setStep={setStep} handleDataChange={handleDataChange} />
    </MemoryRouter>
  );
}