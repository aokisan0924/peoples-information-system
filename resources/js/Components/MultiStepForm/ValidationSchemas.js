import * as Yup from 'yup';

export const memberInfoSchema = Yup.object({
    lastName: Yup.string().required('Last name is required'),
    firstName: Yup.string().required('First name is required'),
    dob: Yup.date().required('Date of birth is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    contact: Yup.string().required('Contact number is required'),
    branch: Yup.string().required('Office branch is required'),
    region: Yup.string().required('Region is required'),
    province: Yup.string().required('Province is required'),
    city: Yup.string().required('City/Municipality is required'),
    barangay: Yup.string().required('Barangay is required'),
});

export const afpInfoSchema = Yup.object({
    afpsn: Yup.string().optional(),
    designation: Yup.string().optional(),
    afpId: Yup.string().optional(),
    assignment: Yup.string().optional(),
    yearsInService: Yup.number()
        .min(0, 'Years in service must be positive')
        .nullable()
        .transform((_, val) => (val !== '' ? Number(val) : null))
        .optional(),
    cadDate: Yup.date().nullable().optional(),
    retirementDate: Yup.date().nullable().optional(),
    pensionDate: Yup.date().nullable().optional(),
});
