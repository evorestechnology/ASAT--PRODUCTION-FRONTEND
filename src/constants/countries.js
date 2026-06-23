// Comprehensive country list with tax zone classification
// zone: 'india' | 'usa' | 'row'
export const COUNTRIES = [
  { name: 'India',                  code: 'IN',  zone: 'india' },
  { name: 'United States',          code: 'US',  zone: 'usa'   },
  { name: 'United Kingdom',         code: 'GB',  zone: 'row'   },
  { name: 'United Arab Emirates',   code: 'AE',  zone: 'row'   },
  { name: 'Australia',              code: 'AU',  zone: 'row'   },
  { name: 'Canada',                 code: 'CA',  zone: 'row'   },
  { name: 'Germany',                code: 'DE',  zone: 'row'   },
  { name: 'France',                 code: 'FR',  zone: 'row'   },
  { name: 'Singapore',              code: 'SG',  zone: 'row'   },
  { name: 'New Zealand',            code: 'NZ',  zone: 'row'   },
  { name: 'Netherlands',            code: 'NL',  zone: 'row'   },
  { name: 'Sweden',                 code: 'SE',  zone: 'row'   },
  { name: 'Norway',                 code: 'NO',  zone: 'row'   },
  { name: 'Denmark',                code: 'DK',  zone: 'row'   },
  { name: 'Switzerland',            code: 'CH',  zone: 'row'   },
  { name: 'Italy',                  code: 'IT',  zone: 'row'   },
  { name: 'Spain',                  code: 'ES',  zone: 'row'   },
  { name: 'Portugal',               code: 'PT',  zone: 'row'   },
  { name: 'Belgium',                code: 'BE',  zone: 'row'   },
  { name: 'Austria',                code: 'AT',  zone: 'row'   },
  { name: 'Ireland',                code: 'IE',  zone: 'row'   },
  { name: 'Poland',                 code: 'PL',  zone: 'row'   },
  { name: 'Czech Republic',         code: 'CZ',  zone: 'row'   },
  { name: 'South Africa',           code: 'ZA',  zone: 'row'   },
  { name: 'Nigeria',                code: 'NG',  zone: 'row'   },
  { name: 'Kenya',                  code: 'KE',  zone: 'row'   },
  { name: 'Japan',                  code: 'JP',  zone: 'row'   },
  { name: 'South Korea',            code: 'KR',  zone: 'row'   },
  { name: 'China',                  code: 'CN',  zone: 'row'   },
  { name: 'Hong Kong',              code: 'HK',  zone: 'row'   },
  { name: 'Taiwan',                 code: 'TW',  zone: 'row'   },
  { name: 'Malaysia',               code: 'MY',  zone: 'row'   },
  { name: 'Thailand',               code: 'TH',  zone: 'row'   },
  { name: 'Philippines',            code: 'PH',  zone: 'row'   },
  { name: 'Indonesia',              code: 'ID',  zone: 'row'   },
  { name: 'Vietnam',                code: 'VN',  zone: 'row'   },
  { name: 'Bangladesh',             code: 'BD',  zone: 'row'   },
  { name: 'Pakistan',               code: 'PK',  zone: 'row'   },
  { name: 'Sri Lanka',              code: 'LK',  zone: 'row'   },
  { name: 'Nepal',                  code: 'NP',  zone: 'row'   },
  { name: 'Saudi Arabia',           code: 'SA',  zone: 'row'   },
  { name: 'Qatar',                  code: 'QA',  zone: 'row'   },
  { name: 'Kuwait',                 code: 'KW',  zone: 'row'   },
  { name: 'Bahrain',                code: 'BH',  zone: 'row'   },
  { name: 'Oman',                   code: 'OM',  zone: 'row'   },
  { name: 'Israel',                 code: 'IL',  zone: 'row'   },
  { name: 'Turkey',                 code: 'TR',  zone: 'row'   },
  { name: 'Brazil',                 code: 'BR',  zone: 'row'   },
  { name: 'Mexico',                 code: 'MX',  zone: 'row'   },
  { name: 'Argentina',              code: 'AR',  zone: 'row'   },
  { name: 'Russia',                 code: 'RU',  zone: 'row'   },
  { name: 'Other',                  code: 'XX',  zone: 'row'   },
];

// Cities that qualify as Mumbai-local shipping
export const MUMBAI_CITIES = [
  'Mumbai', 'Navi Mumbai', 'Thane', 'Kalyan', 'Dombivli',
  'Mira Road', 'Bhayandar', 'Vasai', 'Virar', 'Panvel',
];

/**
 * Determine shipping zone string from country name + city name.
 * Returns: 'mumbai' | 'india' | 'usa' | 'row'
 */
export function getShippingZone(countryName, cityName = '') {
  if (countryName === 'India') {
    const city = (cityName || '').trim();
    const isMumbai = MUMBAI_CITIES.some(
      m => city.toLowerCase() === m.toLowerCase()
    );
    return isMumbai ? 'mumbai' : 'india';
  }
  const c = COUNTRIES.find(c => c.name === countryName);
  return c ? c.zone : 'row';
}
