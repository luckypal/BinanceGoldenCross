const macd = require('trading-indicator').macd
const ema = require('trading-indicator').sma

// let ticker = await indicators.ticker("binance", symbol, true)

const start = async () => {
  // const list = await macd(12, 26, 9, "close", "binance", "BTC/USDT", "15m", false);
  // for (let i = 0; i < 10; i ++) {
  //   console.log(i, list[list.length - 10 + i]);
  // }
  
  const sizes = [7, 25, 99];
  for (let i = 0; i < 3; i ++) {
    const size = sizes[i];
    let emaData = await ema(size, "close", "binance", "BTC/USDT", "15m", false)
    emaData[emaData.length - 1];
  }
}

start();
