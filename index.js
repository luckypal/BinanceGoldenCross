const fs = require('fs');
const Binance = require('binance-api-node').default
const sma = require('trading-indicator').sma
const client = Binance();

// const TIMEFRAME = '5m';
const TIMEFRAME = '15m';
const RATIO_DIFF_AB = 0.006;
const RATIO_DIFF_BC = 0.01;
const LOG_FILE = 'logs/cross.txt';

const pastPairStatus = {};
let futurePrices = {};

const mSleep = async (mSec) => {
  return new Promise((resolve) => setTimeout(resolve, mSec));
}

const getFiatPairs = async (fiatCurrency) => {
  const prices = await client.futuresPrices()
  const pairs = Object.keys(prices)
    .filter(pair => pair.endsWith(fiatCurrency))
    .filter(pair => pair.replace(fiatCurrency).indexOf('USD') === -1)
    .map(pair => pair.replace(fiatCurrency, `/${fiatCurrency}`));
  return pairs;
}

const currentDateTime = () => {
  return (new Date()).toLocaleString();
}

const checkGoldenCross = async (pair) => {
  const sizes = [7, 25, 99];
  const maData = [];
  let isGoldenCross = null;

  try {
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      let smaData = await sma(size, "close", "binance", pair, TIMEFRAME, true);
      maData.push(smaData[smaData.length - 1]);
    }

    const a = maData[0];
    const b = maData[1];
    const c = maData[2];
    const diffAB = a / b - 1;
    const diffBC = b / c - 1;
    if (diffAB >= 0
      && diffBC >= 0
      && diffAB <= RATIO_DIFF_AB
      && diffBC <= RATIO_DIFF_BC
    ) isGoldenCross = true;
    else if (diffAB < 0
      && diffBC < 0
      && diffAB >= -RATIO_DIFF_AB
      && diffBC >= -RATIO_DIFF_BC
    ) isGoldenCross = false;

    if (isGoldenCross !== null && pastPairStatus[pair] !== isGoldenCross) {
      const price = futurePrices[pair.replace('/', '')];
      const direction = isGoldenCross ? 'LONG' : 'SHORT';
      const message = `${direction} ${pair} ${price}\n`;
      addLogs(message);
    }

    pastPairStatus[pair] = isGoldenCross;
  } catch (e) {
    if (e != 'Ticker is not supported') console.log('ERROR - ', pair, e);
  }
}

const initLogs = () => {
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
}

const addLogs = (message) => {
  message = `${currentDateTime()} ${message}`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, message, { encoding: 'utf8' });
}

const onInit = async () => {
  console.log('MACD RADAR - FUTURES');
  console.log('TIMEFRAME: ', TIMEFRAME);
  console.log('DIFF: ', RATIO_DIFF_AB, RATIO_DIFF_BC);
  initLogs();

  const pairs = await getFiatPairs('USDT');
  let index = 0;

  while (true) {
    if (index == 0) {
      futurePrices = await client.futuresPrices();
    }

    const pair = pairs[index];
    checkGoldenCross(pair);

    index += 1;
    if (index >= pairs.length) index = 0;

    await mSleep(1000);
  }
};

onInit();
