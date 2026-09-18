var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var indiaLocationFilter_exports = {};
__export(indiaLocationFilter_exports, {
  IndiaLocationFilter: () => IndiaLocationFilter
});
module.exports = __toCommonJS(indiaLocationFilter_exports);
const INDIAN_STATES_AND_UTS = [
  "kerala",
  "karnataka",
  "tamil nadu",
  "tamilnadu",
  "telangana",
  "maharashtra",
  "delhi",
  "new delhi",
  "ncr",
  "national capital region",
  "gujarat",
  "haryana",
  "uttar pradesh",
  "up",
  "west bengal",
  "bengal",
  "rajasthan",
  "andhra pradesh",
  "punjab",
  "chandigarh",
  "madhya pradesh",
  "mp",
  "odisha",
  "orissa",
  "bihar",
  "jharkhand",
  "assam",
  "goa",
  "himachal pradesh",
  "uttarakhand",
  "jammu and kashmir",
  "jammu & kashmir",
  "j&k",
  "ladakh",
  "puducherry",
  "pondicherry",
  "chhattisgarh",
  "tripura",
  "meghalaya",
  "manipur",
  "nagaland",
  "mizoram",
  "arunachal pradesh",
  "sikkim",
  "andaman and nicobar",
  "dadra and nagar haveli",
  "daman and diu",
  "lakshadweep"
];
const INDIAN_CITIES = [
  // Kerala
  "kochi",
  "cochin",
  "ernakulam",
  "thiruvananthapuram",
  "trivandrum",
  "kozhikode",
  "calicut",
  "alappuzha",
  "thrissur",
  "trichur",
  "palakkad",
  "kollam",
  "kottayam",
  "kannur",
  "kasaragod",
  "malappuram",
  "wayanad",
  "idukki",
  "pathanamthitta",
  // Karnataka
  "bangalore",
  "bengaluru",
  "mysore",
  "mysuru",
  "mangalore",
  "mangaluru",
  "hubli",
  "dharwad",
  "belgaum",
  "belagavi",
  "manipal",
  "udupi",
  // Tamil Nadu
  "chennai",
  "madras",
  "coimbatore",
  "madurai",
  "tiruchirappalli",
  "trichy",
  "salem",
  "tirunelveli",
  "erode",
  "vellore",
  // Telangana
  "hyderabad",
  "secunderabad",
  "cyberabad",
  "warangal",
  "nizamabad",
  "karimnagar",
  // Maharashtra
  "mumbai",
  "bombay",
  "pune",
  "nagpur",
  "nashik",
  "thane",
  "navi mumbai",
  "aurangabad",
  "chhatrapati sambhaji nagar",
  "solapur",
  "kolhapur",
  // Delhi NCR & Haryana & Uttar Pradesh
  "delhi",
  "new delhi",
  "noida",
  "greater noida",
  "gurgaon",
  "gurugram",
  "faridabad",
  "ghaziabad",
  "lucknow",
  "kanpur",
  "agra",
  "varanasi",
  "prayagraj",
  "allahabad",
  "panipat",
  // Gujarat
  "ahmedabad",
  "gandhinagar",
  "surat",
  "vadodara",
  "baroda",
  "rajkot",
  "bhavnagar",
  // West Bengal
  "kolkata",
  "calcutta",
  "howrah",
  "siliguri",
  "durgapur",
  "asansol",
  // Rajasthan
  "jaipur",
  "jodhpur",
  "udaipur",
  "kota",
  "ajmer",
  // Andhra Pradesh
  "visakhapatnam",
  "vizag",
  "vijayawada",
  "guntur",
  "tirupati",
  "amaravati",
  // Punjab & Chandigarh
  "chandigarh",
  "mohali",
  "ludhiana",
  "amritsar",
  "jalandhar",
  // Madhya Pradesh
  "indore",
  "bhopal",
  "gwalior",
  "jabalpur",
  // Odisha
  "bhubaneswar",
  "cuttack",
  "rourkela",
  // Bihar & Jharkhand
  "patna",
  "ranchi",
  "jamshedpur",
  "dhanbad",
  // Others
  "guwahati",
  "panaji",
  "dehradun",
  "shimla",
  "srinagar",
  "jammu"
];
const FOREIGN_COUNTRY_CODES = /* @__PURE__ */ new Set([
  "PK",
  "PAK",
  "US",
  "USA",
  "GB",
  "GBR",
  "UK",
  "CA",
  "CAN",
  "AU",
  "AUS",
  "DE",
  "DEU",
  "FR",
  "FRA",
  "SG",
  "SGP",
  "AE",
  "ARE",
  "SA",
  "SAU",
  "QA",
  "QAT",
  "BD",
  "BGD",
  "NP",
  "NPL",
  "LK",
  "LKA",
  "CN",
  "CHN",
  "JP",
  "JPN",
  "MY",
  "MYS",
  "NZ",
  "NZL",
  "IE",
  "IRL",
  "NL",
  "NLD",
  "SE",
  "SWE",
  "CH",
  "CHE",
  "IL",
  "ISR",
  "PH",
  "PHL",
  "VN",
  "VNM",
  "NG",
  "NGA",
  "KE",
  "KEN",
  "ZA",
  "ZAF",
  "BR",
  "BRA",
  "MX",
  "MEX",
  "RU",
  "RUS",
  "EG",
  "EGY",
  "TR",
  "TUR",
  "ID",
  "IDN",
  "TH",
  "THA"
]);
const FOREIGN_COUNTRIES = [
  "pakistan",
  "united states",
  "usa",
  "united states of america",
  "united kingdom",
  "uk",
  "great britain",
  "england",
  "scotland",
  "wales",
  "canada",
  "australia",
  "germany",
  "france",
  "singapore",
  "united arab emirates",
  "uae",
  "dubai",
  "abu dhabi",
  "saudi arabia",
  "qatar",
  "kuwait",
  "oman",
  "bahrain",
  "bangladesh",
  "nepal",
  "sri lanka",
  "china",
  "japan",
  "malaysia",
  "new zealand",
  "ireland",
  "netherlands",
  "sweden",
  "switzerland",
  "israel",
  "philippines",
  "vietnam",
  "nigeria",
  "kenya",
  "south africa",
  "brazil",
  "mexico",
  "russia",
  "egypt",
  "indonesia",
  "thailand",
  "turkey",
  "italy",
  "spain",
  "poland",
  "belgium",
  "austria",
  "norway",
  "denmark",
  "finland",
  "portugal",
  "greece",
  "czech republic"
];
const FOREIGN_CITIES_AND_REGIONS = [
  // Pakistan
  "lahore",
  "karachi",
  "islamabad",
  "rawalpindi",
  "faisalabad",
  "multan",
  "peshawar",
  "quetta",
  "sialkot",
  "gujranwala",
  // USA
  "new york",
  "nyc",
  "san francisco",
  "seattle",
  "austin",
  "boston",
  "chicago",
  "los angeles",
  "san jose",
  "sunnyvale",
  "mountain view",
  "palo alto",
  "atlanta",
  "denver",
  "dallas",
  "houston",
  "washington dc",
  "california",
  "texas",
  "washington state",
  // UK
  "london",
  "manchester",
  "birmingham",
  "edinburgh",
  "glasgow",
  "bristol",
  "cambridge",
  "oxford",
  "leeds",
  // Canada
  "toronto",
  "vancouver",
  "montreal",
  "ottawa",
  "calgary",
  "waterloo",
  "ontario",
  "british columbia",
  "quebec",
  // UAE & Gulf
  "dubai",
  "abu dhabi",
  "sharjah",
  "doha",
  "riyadh",
  "jeddah",
  "kuwait city",
  "manama",
  "muscat",
  // Others
  "sydney",
  "melbourne",
  "brisbane",
  "perth",
  "berlin",
  "munich",
  "frankfurt",
  "paris",
  "amsterdam",
  "dublin",
  "tokyo",
  "zurich",
  "beijing",
  "shanghai",
  "hong kong",
  "taipei",
  "seoul",
  "dhaka",
  "colombo",
  "kathmandu"
];
class IndiaLocationFilter {
  /**
   * Evaluates any combination of structured metadata and free text location fields.
   * Enforces the hard rule:
   *   IF location inside India -> ACCEPT (isIndia: true)
   *   ELSE -> REJECT (isIndia: false)
   */
  static evaluateLocation(input) {
    const rawCode = (input.countryCode || "").trim().toUpperCase();
    if (rawCode) {
      if (rawCode === "IN" || rawCode === "IND") {
        const locLower2 = (input.location || "").toLowerCase();
        const contradictsWithForeign = FOREIGN_CITIES_AND_REGIONS.some(
          (fc) => new RegExp(`\\b${fc}\\b`, "i").test(locLower2)
        );
        if (!contradictsWithForeign) {
          return {
            isIndia: true,
            countryCode: "IN",
            normalizedLocation: this.formatNormalizedLocation(input.location || "India", "IN"),
            isRemoteInIndia: /remote|wfh|work from home/i.test(input.location || "")
          };
        }
      }
      if (FOREIGN_COUNTRY_CODES.has(rawCode)) {
        return {
          isIndia: false,
          countryCode: rawCode,
          normalizedLocation: input.location || rawCode,
          isRemoteInIndia: false,
          rejectionReason: `Rejected foreign country code: ${rawCode}`
        };
      }
    }
    const rawCountry = (input.country || "").trim().toLowerCase();
    if (rawCountry) {
      if (rawCountry === "india" || rawCountry === "republic of india" || rawCountry === "bharat") {
        const locLower2 = (input.location || "").toLowerCase();
        const contradicts = FOREIGN_CITIES_AND_REGIONS.some(
          (fc) => new RegExp(`\\b${fc}\\b`, "i").test(locLower2)
        );
        if (!contradicts) {
          return {
            isIndia: true,
            countryCode: "IN",
            normalizedLocation: this.formatNormalizedLocation(input.location || "India", "IN"),
            isRemoteInIndia: /remote|wfh|work from home/i.test(input.location || "")
          };
        }
      }
      for (const fc of FOREIGN_COUNTRIES) {
        if (rawCountry === fc || rawCountry.includes(fc)) {
          return {
            isIndia: false,
            countryCode: void 0,
            normalizedLocation: input.location || input.country || "Foreign Location",
            isRemoteInIndia: false,
            rejectionReason: `Rejected foreign country: ${input.country}`
          };
        }
      }
    }
    if (input.rawPayload && typeof input.rawPayload === "object") {
      const p = input.rawPayload;
      const ashbyCountry = p.address?.postalAddress?.addressCountry;
      if (ashbyCountry) {
        const ashbyCode = String(ashbyCountry).trim().toUpperCase();
        if (ashbyCode === "IN" || ashbyCode === "IND" || ashbyCode.toLowerCase() === "india") {
          return {
            isIndia: true,
            countryCode: "IN",
            normalizedLocation: this.formatNormalizedLocation(input.location || "India", "IN"),
            isRemoteInIndia: Boolean(p.isRemote)
          };
        } else if (FOREIGN_COUNTRY_CODES.has(ashbyCode) || FOREIGN_COUNTRIES.includes(ashbyCode.toLowerCase())) {
          return {
            isIndia: false,
            countryCode: ashbyCode,
            normalizedLocation: input.location || ashbyCode,
            isRemoteInIndia: false,
            rejectionReason: `Rejected structured ATS country: ${ashbyCountry}`
          };
        }
      }
      if (Array.isArray(p.offices) && p.offices.length > 0) {
        const hasIndiaOffice = p.offices.some((o) => {
          const oName = `${o.name || ""} ${o.location || ""}`.toLowerCase();
          return oName.includes("india") || INDIAN_CITIES.some((c) => oName.includes(c));
        });
        const hasOnlyForeignOffices = p.offices.every((o) => {
          const oName = `${o.name || ""} ${o.location || ""}`.toLowerCase();
          return FOREIGN_COUNTRIES.some((fc) => oName.includes(fc)) || FOREIGN_CITIES_AND_REGIONS.some((fc) => oName.includes(fc));
        });
        if (hasOnlyForeignOffices && !hasIndiaOffice) {
          return {
            isIndia: false,
            normalizedLocation: input.location || "Foreign Office",
            isRemoteInIndia: false,
            rejectionReason: "Greenhouse office locations are outside India"
          };
        }
      }
      if (p.country) {
        const leverCountry = String(p.country).trim().toLowerCase();
        if (leverCountry === "in" || leverCountry === "india") {
          return {
            isIndia: true,
            countryCode: "IN",
            normalizedLocation: this.formatNormalizedLocation(input.location || "India", "IN"),
            isRemoteInIndia: /remote/i.test(input.location || "")
          };
        }
      }
    }
    const locText = (input.location || "").trim();
    if (!locText) {
      return {
        isIndia: false,
        normalizedLocation: "Unspecified Location",
        isRemoteInIndia: false,
        rejectionReason: "Location field is missing or empty"
      };
    }
    const locLower = locText.toLowerCase();
    const isRemote = /remote|work from home|wfh/i.test(locLower);
    if (isRemote) {
      if (/\b(remote\s*[-–—:]\s*(us|usa|united states|uk|united kingdom|europe|apac|emea|canada|australia|latam|germany|singapore))\b/i.test(locLower) || /\b(us|usa|uk|europe|apac|emea|canada)\s*[-–—:]\s*remote\b/i.test(locLower)) {
        return {
          isIndia: false,
          normalizedLocation: locText,
          isRemoteInIndia: false,
          rejectionReason: `Rejected foreign remote location: ${locText}`
        };
      }
      const mentionsIndia = /\b(india|in)\b/i.test(locLower);
      const mentionsIndianStateOrCity = INDIAN_STATES_AND_UTS.some((s) => new RegExp(`\\b${s}\\b`, "i").test(locLower)) || INDIAN_CITIES.some((c) => new RegExp(`\\b${c}\\b`, "i").test(locLower));
      if (mentionsIndia || mentionsIndianStateOrCity) {
        return {
          isIndia: true,
          countryCode: "IN",
          normalizedLocation: this.formatNormalizedLocation(locText, "IN"),
          isRemoteInIndia: true
        };
      }
      return {
        isIndia: false,
        normalizedLocation: locText,
        isRemoteInIndia: false,
        rejectionReason: `Excluded ambiguous remote job without verified India eligibility: "${locText}"`
      };
    }
    for (const fc of FOREIGN_COUNTRIES) {
      const regex = new RegExp(`\\b${fc}\\b`, "i");
      if (regex.test(locLower)) {
        return {
          isIndia: false,
          normalizedLocation: locText,
          isRemoteInIndia: false,
          rejectionReason: `Rejected foreign location matching country "${fc}": ${locText}`
        };
      }
    }
    for (const fc of FOREIGN_CITIES_AND_REGIONS) {
      const regex = new RegExp(`\\b${fc}\\b`, "i");
      if (regex.test(locLower)) {
        return {
          isIndia: false,
          normalizedLocation: locText,
          isRemoteInIndia: false,
          rejectionReason: `Rejected foreign location matching city/region "${fc}": ${locText}`
        };
      }
    }
    if (/\bindia\b/i.test(locLower) || /\brepublic of india\b/i.test(locLower) || /([,\/\(]\s*IN\s*[\)\/]?$)/i.test(locText) || /\b(IN)\b/.test(locText)) {
      return {
        isIndia: true,
        countryCode: "IN",
        normalizedLocation: this.formatNormalizedLocation(locText, "IN"),
        isRemoteInIndia: false
      };
    }
    for (const state of INDIAN_STATES_AND_UTS) {
      const regex = new RegExp(`\\b${state}\\b`, "i");
      if (regex.test(locLower)) {
        return {
          isIndia: true,
          countryCode: "IN",
          detectedState: state.charAt(0).toUpperCase() + state.slice(1),
          normalizedLocation: this.formatNormalizedLocation(locText, "IN"),
          isRemoteInIndia: false
        };
      }
    }
    for (const city of INDIAN_CITIES) {
      const regex = new RegExp(`\\b${city}\\b`, "i");
      if (regex.test(locLower)) {
        return {
          isIndia: true,
          countryCode: "IN",
          detectedCity: city.charAt(0).toUpperCase() + city.slice(1),
          normalizedLocation: this.formatNormalizedLocation(locText, "IN"),
          isRemoteInIndia: false
        };
      }
    }
    return {
      isIndia: false,
      normalizedLocation: locText,
      isRemoteInIndia: false,
      rejectionReason: `Location "${locText}" could not be confirmed as inside India`
    };
  }
  /**
   * Helper to ensure formatted location clearly indicates India
   */
  static formatNormalizedLocation(original, countryCode) {
    const trimmed = original.trim();
    if (!trimmed) return "India";
    if (/india/i.test(trimmed)) return trimmed;
    if (countryCode === "IN") {
      return `${trimmed}, India`;
    }
    return trimmed;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IndiaLocationFilter
});
