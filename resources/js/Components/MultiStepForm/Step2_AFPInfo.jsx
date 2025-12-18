import React, { useEffect ,useState } from 'react';
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import InputLabel from '../InputLabel';

export default function Step2_AFPInfo ({ data, onChange, onNext, onBack }) {
    const [formData, setFormData] = useState({
      afpsn: data.afpsn || '',
      rank: data.rank || '',
      designation: data.designation || '',
      afpId: data.afpId || '',
      presentAssignment: data.presentAssignment || '',
      controlNo: data.controlNo || '',
      yearsInService: data.yearsInService || '',
      cadEnlistment: data.cadEnlistment || '',
      retirementDate: data.retirementDate || '',
      pensionDate: data.pensionDate || '',
    });
  
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
    const handleChange = (key, value) => {
      setFormData(prev => ({
        ...prev,
        [key]: value,
      }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onChange(formData);
      onNext();
    };
    const inputBaseClass = "w-full rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500";
    return (
      <>
        <Head title="Membership Registration - People's Multi-Purpose Cooperative">
          <link rel="icon" href="/images/logo/pis_logo.png" />
        </Head>
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-green-700 border-b pb-2">II. AFP Information</h2>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InputLabel htmlFor="afpsn" value="AFPSN" />
              <input
                id="afpsn"
                type="text"
                value={formData.afpsn}
                onChange={e => handleChange('afpsn', e.target.value)}
                className={inputBaseClass}
                required
              />
            </div>
    
            <div>
              <InputLabel htmlFor="rank" value="Rank" />
              <input
                id="rank"
                type="text"
                value={formData.rank}
                onChange={e => handleChange('rank', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="designation" value="Designation" />
              <input
                id="designation"
                type="text"
                value={formData.designation}
                onChange={e => handleChange('designation', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="afpId" value="AFP ID No." />
              <input
                id="afpId"
                type="text"
                value={formData.afpId}
                onChange={e => handleChange('afpId', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="presentAssignment" value="Present Assignment" />
              <input
                id="presentAssignment"
                type="text"
                value={formData.presentAssignment}
                onChange={e => handleChange('presentAssignment', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="controlNo" value="Control No." />
              <input
                id="controlNo"
                type="text"
                value={formData.controlNo}
                onChange={e => handleChange('controlNo', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="yearsInService" value="Years in Service" />
              <input
                id="yearsInService"
                type="number"
                value={formData.yearsInService}
                onChange={e => handleChange('yearsInService', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="cadEnlistment" value="CAD/Enlistment Date" />
              <input
                id="cadEnlistment"
                type="date"
                value={formData.cadEnlistment}
                onChange={e => handleChange('cadEnlistment', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="retirementDate" value="Retirement Date" />
              <input
                id="retirementDate"
                type="date"
                value={formData.retirementDate}
                onChange={e => handleChange('retirementDate', e.target.value)}
                className={inputBaseClass}
              />
            </div>
    
            <div>
              <InputLabel htmlFor="pensionDate" value="Pension Date" />
              <input
                id="pensionDate"
                type="date"
                value={formData.pensionDate}
                onChange={e => handleChange('pensionDate', e.target.value)}
                className={inputBaseClass}
              />
            </div>
          </div>
    
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
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