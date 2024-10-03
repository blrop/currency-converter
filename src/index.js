/*
- loading indicator
- scale
- currency choose
*/

import { CURRENCY_LIST, RULER_VALUES } from './constants';

import './css/style.css';

const WILDCARD = '%';
const API_URL = `https://open.er-api.com/v6/latest/${WILDCARD}`;
const RATES_LS_KEY = `rates_${WILDCARD}`;
const CURRENCY_2_LS_KEY = `currency_2`;
const MILLISECONDS_IN_DAY = 86400000;
const RULER_STEP_HEIGHT = 50;
const DEFAULT_CURRENCY_1 = 'EUR';
const DEFAULT_CURRENCY_2 = 'USD';

const insertSubstring = (str, subStr, index) => {
	return str.slice(0, index) + subStr + str.slice(index);
};

const formatNumber = (number) => {
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

const getParametrizedString = (template, value) => {
	return template.replace(WILDCARD, value);
};

const isTimestampTooOld = (timestamp) => {
	if (!timestamp) {
		return true;
	}

	const givenDate = new Date(timestamp);
	const currentDate = new Date();
	return currentDate.getTime() - givenDate.getTime() > MILLISECONDS_IN_DAY;
};

const getRates = async (currencyCode) => {
	const response = await fetch(getParametrizedString(API_URL, currencyCode));
	return await response.json();
};

const getRatesCached = async (currencyCode) => {
	const storageKey = getParametrizedString(RATES_LS_KEY, currencyCode);
	const savedDataRaw = localStorage.getItem(storageKey);

	let savedData;
	try {
		savedData = JSON.parse(savedDataRaw);
	} catch (error) {
		savedData = null;
	}

	if (!savedData || isTimestampTooOld(savedData.lastUpdate)) {
		const newRatesData = await getRates(currencyCode);
		const dataToSave = {
			lastUpdate: new Date(),
			data: newRatesData,
		};
		localStorage.setItem(storageKey, JSON.stringify(dataToSave));
		return newRatesData;
	}

	return savedData.data;
};

const createElement = (tagName, attributes) => {
	const tag = document.createElement(tagName);
	attributes.forEach((item) => {
		tag[item.name] = item.value;
	});
	return tag;
};

const showElement = ($el) => {
	$el.classList.remove('hidden');
};

const hideElement = ($el) => {
	$el.classList.add('hidden');
};

const renderRulerItems = ($parent, currency1, currency2, rate) => {
	$parent.innerHTML = '';
	
	RULER_VALUES.forEach((item) => {
		const $rulerItem = createElement('div', [
			{ name: 'className', value: 'ruler__item' },
			{ name: 'style', value: `height: ${RULER_STEP_HEIGHT}px` },
		]);
		$rulerItem.innerHTML = `
			<div>
				<b>${formatNumber(item.value)}</b>
				${currency1}
				=
				<b>${formatNumber(item.value * rate)}</b>
				${currency2}
			</div>
		`;

		$parent.appendChild($rulerItem);
	});
};

const renderCurrencyList = ($parent) => {
	CURRENCY_LIST.forEach((item) => {
		const currencyCode = item.substring(0, 3);
		const currencyName = item.substring(5);

		const $listItem = document.createElement('div');
		$listItem.className = 'currency-list__item text-button';
		$listItem.dataset.code = currencyCode;
		$listItem.appendChild(document.createTextNode(`${currencyCode} - ${currencyName}`));

		$parent.appendChild($listItem);
	});
};

const renderRates = ($ruler, currency1, currency2, rates) => {
	const rate = rates[currency2];
	renderRulerItems($ruler, currency1, currency2, rate);
	const $rulerPadding = document.createElement('div');
	$rulerPadding.className = 'ruler__padding';
	$ruler.appendChild($rulerPadding);
};

window.onload = async () => {
	const $mainScreen = document.getElementById('main-screen');
	const $chooseCurrencyScreen = document.getElementById('choose-currency-screen');
	const $ruler = document.getElementById('ruler');
	const $fromValue = document.getElementById('from-value');
	const $fromCurrency = document.getElementById('from-currency');
	const $toValue = document.getElementById('to-value');
	const $toCurrency = document.getElementById('to-currency');
	const $currencyList = document.getElementById('currency-list');

	const currency1 = 'EUR';
	let currency2 = localStorage.getItem(CURRENCY_2_LS_KEY) || DEFAULT_CURRENCY_2;
	
	$fromCurrency.innerText = currency1;
	$toCurrency.innerText = currency2;

	const data = await getRatesCached(currency1);
	const rates = data.rates;

	const onRulerScroll = () => {
		const rate = rates[currency2];

		const stepNumber = Math.floor($ruler.scrollTop / RULER_STEP_HEIGHT);
		if (stepNumber >= RULER_VALUES.length) {
			return;
		}

		const distanceFromLastStep = $ruler.scrollTop % RULER_STEP_HEIGHT;
		const distancePercent = distanceFromLastStep * (1 / RULER_STEP_HEIGHT);
		const stepInfo = RULER_VALUES[stepNumber];
		const screenValueCurrency1 = stepInfo.value + distancePercent * stepInfo.factor;
		const screenValueCurrency2 = screenValueCurrency1 * rate;
		$fromValue.innerText = formatNumber(screenValueCurrency1);
		$toValue.innerText = formatNumber(screenValueCurrency2);
	};

	renderRates($ruler, currency1, currency2, rates);

	renderCurrencyList($currencyList);

	$ruler.addEventListener('scroll', onRulerScroll);
	onRulerScroll();

	$fromCurrency.addEventListener('click', () => {
		// hideElement($mainScreen);
		// showElement($chooseCurrencyScreen);
	});

	$toCurrency.addEventListener('click', () => {
		hideElement($mainScreen);
		showElement($chooseCurrencyScreen);
	});

	$currencyList.addEventListener('click', (e) => {
		currency2 = e.target.dataset.code;

		renderRates($ruler, DEFAULT_CURRENCY_1, currency2, rates);
		$toCurrency.innerText = currency2;

		localStorage.setItem(CURRENCY_2_LS_KEY, currency2);

		hideElement($chooseCurrencyScreen);
		showElement($mainScreen);
	});
};