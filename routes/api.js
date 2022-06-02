'use strict';

const StockModel = require('../models').Stock;
//import fetch from 'node-fetch';
//const fetch = require("node-fetch");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// const { stock, like } = req.query;
//const URI = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote";

async function fetchStock(stock) {
  const URI = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote";
  const response = await fetch(URI);
  const { symbol, latestPrice } = await response.json();
  return { symbol, latestPrice};
}

async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol : stock,
    likes : like ? [ip] : [],
  });
  const saveStock = await newStock.save();
  return saveStock;
}

async function findStock(stock) {
  return await StockModel.findOne({ symbol : stock }).exec();
}

async function saveStock(stock, like, ip) {
  let record = [];
  const foundStock = await findStock(stock);
  if (!foundStock) {
    const createRecord = await createStock(stock, like, ip);
    record = createRecord;
    return record;
  }
}
/*------------------------------------*/
/* main driver */
module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const { stock, like } = req.query;
      const { symbol, latestPrice } = await fetchStock(stock);
      
      if (!symbol) {
        res.json({ stockData: { likes: like ? 1 : 0 }});
        return;
      }

      /* valid data? let's save */
      const aStockData = await saveStock(symbol, like, req.ip);
      console.log("Stock Data: ", aStockData);

      /* return GET */
      res.json({
        stock : symbol,
        price : latestPrice,
        likes : aStockDatalikes.length,
      });
  
      
    })
    
};