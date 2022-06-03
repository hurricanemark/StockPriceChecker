'use strict';

const StockModel = require('../models').Stock;
//import fetch from 'node-fetch';
//const fetch = require("node-fetch");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// const { stock, like } = req.query;
//const URI = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote";

async function fetchStock(stock) {
  const URI = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${ stock }/quote`;
  console.log(URI);
  const response = await fetch(URI);
  const { symbol, latestPrice } = await response.json();
  
  return { symbol, latestPrice};
}

async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol : stock,
    likes : like ? [ip] : [],
  });
  
  try { 
    return await newStock.save();
  } catch(err) { console.log(err); }
}

async function findStock(stock) {
  try {
    return await StockModel.findOne({ symbol: stock }).exec();
  } catch(err) { console.log(err); }
}

async function saveStock(stock, like, ip) {
  let record = {};
  const foundStock = await findStock(stock);
  console.log("Found Stock: ", foundStock);
  if (!foundStock) {
    try {
      const createRecord = await createStock(stock, like, ip);
      record = createRecord;
      console.log(record);
      return record;
    } catch(err) { console.log(err); }
  } else {
    return foundStock;
  }
}



/*------------------------------------*/
/* main driver */
module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const { stock, like } = req.query;
      // console.log("From req.body: ",stock, like);
      const ip = req.ip;

      /* two symbols query */
      if (Array.isArray(stock)) {
        /* Compare likes between two stock symbols */
        let stockData = [];
        const { symbol, latestPrice } = await fetchStock(stock[0]);
        const { symbol: symbolx, latestPrice: latestPricex } = await fetchStock(stock[1]);

        const record = await saveStock(stock[0], like, ip);
        const recordx = await saveStock(stock[1], like, ip);

        if (!symbol) {
          stockData.push({
            rel_likes : record.likes.length - recordx.likes.length,
          });
        } else {
          stockData.push({
            stock : symbol,
            price : parseFloat(latestPrice,2),
            rel_likes : record.likes.length - recordx.likes.length,
          });
        }

        if (!symbolx) {
          stockData.push({
            rel_likes : recordx.likes.length - record.likes.length,
          });
        } else {
          stockData.push({
            stock : symbolx,
            price : parseFloat(latestPricex,2),
            rel_likes : recordx.likes.length - record.likes.length,
          });
        }
        
        res.json({ stockData });
        return;
      }

      /* single or none stock symbol query */
      try {
        const { symbol, latestPrice } = await fetchStock(stock);
        // console.log("stock:", stock, " Symbol: ", symbol, " Price: ", latestPrice);

        if (!symbol) {
          res.json({ 
            stockData: { 
              symbol : '',
              price : 0,
              likes: like ? 1 : 0 
            }
          });
          return;
        }

        /* valid data? let's save */
        try {
          const aStockData = await saveStock(symbol, like, req.ip);

          console.log("Stock Data: ", symbol, latestPrice);

          /* return GET */
          res.json({
            stockData: {
              stock : symbol.toString(),
              price : parseInt(latestPrice),
              likes : parseInt(aStockData.likes.length),
            }
          })
        } catch(err) { console.log(err); }

      } catch(err) {
        console.log(err)
      }
    });
};