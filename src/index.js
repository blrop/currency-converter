import {
	CURRENCY_2_LOCAL_STORAGE_KEY,
	CURRENCY_LIST,
	DEFAULT_CURRENCY_1, DEFAULT_CURRENCY_2,
	RULER_STEP_HEIGHT,
	RULER_VALUES
} from './constants';
import { createElement, formatNumber, getCurrencyRatesCached, hideElement, showElement } from './helper-functions';

import './css/style.css';

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
	const $backButton = document.getElementById('back-button');

	const currency1 = 'EUR';
	let currency2 = localStorage.getItem(CURRENCY_2_LOCAL_STORAGE_KEY) || DEFAULT_CURRENCY_2;
	
	$fromCurrency.innerText = currency1;
	$toCurrency.innerText = currency2;

	const data = await getCurrencyRatesCached(currency1);
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

	$backButton.addEventListener('click', () => {
		hideElement($chooseCurrencyScreen);
		showElement($mainScreen);
	});

	$currencyList.addEventListener('click', (e) => {
		currency2 = e.target.dataset.code;

		renderRates($ruler, DEFAULT_CURRENCY_1, currency2, rates);
		$toCurrency.innerText = currency2;

		localStorage.setItem(CURRENCY_2_LOCAL_STORAGE_KEY, currency2);

		hideElement($chooseCurrencyScreen);
		showElement($mainScreen);
	});
};
