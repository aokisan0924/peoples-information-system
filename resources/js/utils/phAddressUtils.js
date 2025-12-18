import phAddresses from '../data/ph-addresses.json';

//Region list
export const getRegions = () => {
    return Object.entries(phAddresses).map(([code, data]) => ({
        code, // region code
        name: data.region_name,
    }));
};

//Province list
export const getProvincesByRegion = (regionCode) => {
    const region = phAddresses[regionCode];
    if (!region) return [];

    return Object.entries(region.province_list).map(([provinceName], index) => ({
        code: provinceName, // using province name as the code
        name: provinceName,
    }));
};

//City/Municipality list
export const getCitiesByProvince = (regionCode, provinceName) => {
    const province = phAddresses[regionCode]?.province_list?.[provinceName];
    if (!province) return [];

    return Object.entries(province.municipality_list).map(([cityName]) => ({
        code: cityName,
        name: cityName,
    }));
};

// Barangay list
export const getBarangaysByCity = (regionCode, provinceName, cityName) => {
    const barangayList = phAddresses[regionCode]?.province_list?.[provinceName]
        ?.municipality_list?.[cityName]?.barangay_list;

    return barangayList ? barangayList.map(name => ({ code: name, name })) : [];
};
