const axios = require('axios');

// Cache for country data to avoid repeated API calls
let countriesCache = null;
let lastFetch = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch countries from external API or cache
 */
const fetchCountries = async () => {
  // Check if we have valid cached data
  const now = Date.now();
  if (countriesCache && lastFetch && (now - lastFetch < CACHE_DURATION)) {
    return countriesCache;
  }
  
  try {
    // Fetch countries from REST Countries API
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags,cca2,idd');
    
    // Transform data to the format we need
    const countries = response.data.map(country => ({
      name: country.name.common,
      code: country.cca2,
      flag: country.flags.png,
      dialCode: country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : '')
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // Update cache
    countriesCache = countries;
    lastFetch = now;
    
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    
    // If we have any cached data, return it even if expired
    if (countriesCache) {
      return countriesCache;
    }
    
    // Otherwise, return a minimal list of countries
    return [
      { name: 'United States', code: 'US', dialCode: '+1' },
      { name: 'Costa Rica', code: 'CR', dialCode: '+506' },
      { name: 'Mexico', code: 'MX', dialCode: '+52' },
      { name: 'Canada', code: 'CA', dialCode: '+1' },
      { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
      { name: 'Spain', code: 'ES', dialCode: '+34' }
    ];
  }
};

/**
 * Get all countries with their data
 */
const getCountries = async (req, res) => {
  try {
    const countries = await fetchCountries();
    res.status(200).json(countries);
  } catch (error) {
    console.error('Error in getCountries controller:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

/**
 * Get dial code for a specific country
 * @param {string} countryName - Name of the country
 * @returns {string} Country dial code (e.g., '+506')
 */
const getDialCodeByCountry = async (countryName) => {
  try {
    const countries = await fetchCountries();
    const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country ? country.dialCode : '';
  } catch (error) {
    console.error('Error getting dial code:', error);
    return '';
  }
};

/**
 * Get dial code for a specific country by code
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {string} Country dial code (e.g., '+506')
 */
const getDialCodeByCountryCode = async (countryCode) => {
  try {
    const countries = await fetchCountries();
    const country = countries.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
    return country ? country.dialCode : '';
  } catch (error) {
    console.error('Error getting dial code by country code:', error);
    return '';
  }
};

module.exports = {
  getCountries,
  getDialCodeByCountry,
  getDialCodeByCountryCode
};
