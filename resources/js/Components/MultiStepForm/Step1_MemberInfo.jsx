import React, { useEffect, useState } from 'react';
import { Head } from "@inertiajs/react";
import { getRegions, getProvincesByRegion, getCitiesByProvince, getBarangaysByCity } from '@/utils/phAddressUtils';
import InputLabel from '../InputLabel';
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function Step1_MemberInfo({ data, onChange, onNext }) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
      const handleScroll = () => {
          setShowScrollButton(window.scrollY > 300);
      };

      window.addEventListener("scroll", handleScroll);
      return () => {
          window.removeEventListener("scroll", handleScroll);
      };
  }, []);

  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [state, setState] = useState({
    formData: { ...data, age: data.age || '' },
    lists: { regions: [], provinces: [], cities: [], barangays: [] },
  });

  const suffixOptions = ['JR', 'SR', 'II', 'III'];
  const genderOptions = ['MALE', 'FEMALE'];
  const civilStatusOptions = ['SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED'];
  const officeBranchOptions = ['Main Office', 'Cubao Satellite Office', 'Fort Magsaysay Satellite Office'];
  

  useEffect(() => {
    const { formData } = state;
    const regions = getRegions();
    let provinces = [];
    let cities = [];
    let barangays = [];
    const updated = {};

    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      updated.age = age;
    }

    if (formData.region) {
      const region = regions.find(r => r.code === formData.region);
      updated.regionName = region?.name || '';
      provinces = getProvincesByRegion(formData.region);
    }

    if (formData.province) {
      const prov = provinces.find(p => p.code === formData.province);
      updated.provinceName = prov?.name || '';
      cities = getCitiesByProvince(formData.region, formData.province);
    }

    if (formData.city) {
      const city = cities.find(c => c.code === formData.city);
      updated.cityName = city?.name || '';
      barangays = getBarangaysByCity(formData.region, formData.province, formData.city);
    }

    if (formData.barangay) {
      const bgy = barangays.find(b => b.code === formData.barangay);
      updated.barangayName = bgy?.name || '';
    }

    setState(prev => ({
      formData: { ...prev.formData, ...updated },
      lists: { regions, provinces, cities, barangays }
    }));
  }, [state.formData.region, state.formData.province, state.formData.city, state.formData.barangay, state.formData.dob]);

  const sanitize = (value) => typeof value === 'string' ? value.replace(/<[^>]*>?/gm, '').toUpperCase() : value;

  const updateForm = (key, value) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [key]: sanitize(value) },
    }));
  };

  const updateExactForm = (key, value) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [key]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      onChange(state.formData);
      onNext();
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const inputBaseClass = "w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500";

  return (
    <>
      <Head title="Membership Registration - People's Multi-Purpose Cooperative">
          <link rel="icon" href="/images/logo/pis_logo.png" />
      </Head>
      <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-green-700 border-b pb-2">I. Member's Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
          <div>
            <InputLabel htmlFor="lastName" value="Last Name" />
            <input 
              id="lastName"
              type="text"
              value={state.formData.lastName || ''}
              className={inputBaseClass}
              onChange={e => updateForm('lastName', e.target.value)}
              required
            />
          </div> 

          <div>
            <InputLabel htmlFor="firstName" value="First Name" />
            <input
              id="firstName"
              value={state.formData.firstName || ''}
              className={inputBaseClass}
              onChange={e => updateForm('firstName', e.target.value)}
              required
            />
          </div>

          <div>
            <InputLabel htmlFor="middleName" value="Middle Name" />
            <input
              id="middleName"
              value={state.formData.middleName || ''}
              className={inputBaseClass}
              onChange={e => updateForm('middleName', e.target.value)}
            />
          </div>

          <div>
            <InputLabel htmlFor="suffix" value="Suffix" />
            <select
              id="suffix"
              value={state.formData.suffix || ''}
              onChange={e => updateForm('suffix', e.target.value)}
              className={inputBaseClass}
            >
              <option value="">Select Suffix</option>
              {suffixOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel htmlFor="nickname" value="Nickname" />
            <input
              id="nickname"
              value={state.formData.nickname || ''}
              onChange={e => updateForm('nickname', e.target.value)}
              className={inputBaseClass}
            />
          </div>

          <div>
            <InputLabel htmlFor="branch" value="Office Branch" />
            <select
              id="branch"
              value={state.formData.branch || ''}
              onChange={e => updateExactForm('branch', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select Office Branch</option>
              {officeBranchOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel htmlFor="nationality" value="Nationality" />
            <input
              id="nationality"
              value={state.formData.nationality || ''}
              onChange={e => updateForm('nationality', e.target.value)}
              className={inputBaseClass}
            />
          </div>

          <div>
            <InputLabel htmlFor="dob" value="Date of Birth" />
            <input
              id="dob"
              type="date"
              value={state.formData.dob || ''}
              onChange={e => updateForm('dob', e.target.value)}
              className={inputBaseClass}
              required
            />
          </div>

          <div>
            <InputLabel htmlFor="religion" value="Religion" />
            <input
              id="religion"
              value={state.formData.religion || ''}
              onChange={e => updateForm('religion', e.target.value)}
              className={inputBaseClass}
              required
            />
          </div>

          <div>
            <InputLabel htmlFor="contact" value="Contact Number" />
            <input
              id="contact"
              value={state.formData.contact || ''}
              onChange={e => updateForm('contact', e.target.value)}
              pattern="^[0-9]{11}$"
              title="Enter 11-digit contact number"
              className={inputBaseClass}
              required
            />
          </div>

          <div>
            <InputLabel htmlFor="email" value="Email" />
            <input
              id="email"
              type="email"
              value={state.formData.email || ''}
              onChange={e => updateForm('email', e.target.value)}
              pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
              title="Enter a valid email"
              className={inputBaseClass}
              required
            />
          </div>

          <div>
            <InputLabel htmlFor="gender" value="Gender" />
            <select
              id="gender"
              value={state.formData.gender || ''}
              onChange={e => updateForm('gender', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select Gender</option>
              {genderOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel htmlFor="civilStatus" value="Civil Status" />
            <select
              id="civilStatus"
              value={state.formData.civilStatus || ''}
              onChange={e => updateForm('civilStatus', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select Civil Status</option>
              {civilStatusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              id="age"
              type="hidden"
              readOnly value={state.formData.age || ''}
              className={inputBaseClass}
            />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-green-700 border-b pb-2">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InputLabel htmlFor="region" value="Region" />
            <select
              id="region"
              value={state.formData.region || ''}
              onChange={e => updateForm('region', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select Region</option>
              {state.lists.regions.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel htmlFor="province" value="Province" />
            <select
              id="province"
              value={state.formData.province || ''}
              onChange={e => updateForm('province', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select Province</option>
              {state.lists.provinces.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel htmlFor="city" value="City/Municipality" />
            <select
              id="city"
              value={state.formData.city || ''}
              onChange={e => updateForm('city', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select City/Municipality</option>
              {state.lists.cities.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <InputLabel htmlFor="barangay" value="Barangay" />
            <select
              id="barangay"
              value={state.formData.barangay || ''}
              onChange={e => updateForm('barangay', e.target.value)}
              className={inputBaseClass}
              required
            >
              <option value="">Select Barangay</option>
              {state.lists.barangays.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <InputLabel htmlFor="fullAddress" value="Full Address"/>
          <input
            id="fullAddress"
            type="text"
            value={state.formData.fullAddress || ''}
            onChange={e => updateForm('fullAddress', e.target.value)}
            className={inputBaseClass}
          />
        </div>

        <div className="pt-6 text-right">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition">
            Next
          </button>
        </div>
      </form>

      {/* Scroll-To-Top Button */}
      {showScrollButton && (
        <motion.button 
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }} 
            whileHover={{ scale: 1.1 }}
            className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition"
        >
            <ArrowUp size={24} />
        </motion.button>
      )}
    </>
  );
};
