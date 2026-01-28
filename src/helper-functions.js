import { API_URL, MILLISECONDS_IN_DAY, RATES_LOCAL_STORAGE_KEY, WILDCARD } from "./constants";

const insertSubstring = (str, subStr, index) => {
    return str.slice(0, index) + subStr + str.slice(index);
};

const isTimestampTooOld = (timestamp) => {
    if (!timestamp) {
        return true;
    }

    const givenDate = new Date(timestamp);
    const currentDate = new Date();
    return currentDate.getTime() - givenDate.getTime() > MILLISECONDS_IN_DAY;
};

const getCurrencyRatesFromAPI = async (currencyCode) => {
    const response = await fetch(getParametrizedString(API_URL, currencyCode));
    return await response.json();
};

/**
 * Show fractional part for numbers below 100; insert spaces in bigger numbers (examples: 50.35; 120; 1 000)
 * @param number
 * @returns {string}
 */
export const formatNumber = (number) => {
    // add numbers after point, only in this case
    if (number < 100) {
        return number.toFixed(2);
    }

    // don't add numbers after point, add spaces instead
    let s = Math.round(number).toString();
    const spacesNumber = Math.floor((s.length - 1) / 3);
    for (let i = spacesNumber; i > 0; i--) {
        s = insertSubstring(s, ' ', s.length - i * 3);
    }
    return s;
};

/**
 * get a string with a wildcard replaced by the value
 * @param template
 * @param value
 * @returns {*}
 */
export const getParametrizedString = (template, value) => {
    return template.replace(WILDCARD, value);
};

/**
 * takes currency rates from the cache (if present) or fetches it from API and caches it
 * @param currencyCode
 * @returns {Promise<*>}
 */
export const getCurrencyRatesCached = async (currencyCode) => {
    const storageKey = getParametrizedString(RATES_LOCAL_STORAGE_KEY, currencyCode);
    const savedDataRaw = localStorage.getItem(storageKey);

    let savedData;
    try {
        savedData = JSON.parse(savedDataRaw);
    } catch (error) {
        savedData = null;
    }

    if (!savedData || isTimestampTooOld(savedData.lastUpdate)) {
        const newRatesData = await getCurrencyRatesFromAPI(currencyCode);
        const dataToSave = {
            lastUpdate: new Date(),
            data: newRatesData,
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        return newRatesData;
    }

    return savedData.data;
};

export const createElement = (tagName, attributes) => {
    const tag = document.createElement(tagName);
    attributes.forEach((item) => {
        tag[item.name] = item.value;
    });
    return tag;
};

export const showElement = ($el) => {
    $el.classList.remove('hidden');
};

export const hideElement = ($el) => {
    $el.classList.add('hidden');
};
