'use strict';
const CONN = process.env.DB;
const MongoClient = require('mongodb').MongoClient;

let likes = [],
    stockData = {},
    arr = [],
    inArr = [];

module.exports = function (app) {
  app.route('/')
    .get(function (req, res) {
      res.send('Welcome to Stock Price Checker');
    });

  app.route('/api/stock-prices')
    .get(function (req, res){
      var ip = req.ip;
      var stock = req.query.stock;
      console.log(stock);

      if (stock === '' || stock === undefined) {
        return res
          .status(400)
          .type('text')
          .send('Stock symbol is required');
      }
      if (Array.isArray(stock)) {
        stock = stock.join(',');
      } else {
        stock = stock.toUpperCase();
      }

      const URI = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/'; 
      fetch(URI + stock  +'/quote')
        .then(res => res.json())
        .then(data => {
          arr = data.map(item => ({
            stock: item['symbol'],
            price: item['latestPrice'],
          }))
          console.log(data);
        })
        
        .then(() => {
          arr.forEach(item => {
              MongoClient.connect(CONN, (err, db) => {
                  db.collection('stock').findOne({ stockName: item.stock }, (err, docs) => {
                      if (err) throw err

                      if (docs === null) {
                          db.collection('stock').insertOne(
                              {
                                  stockName: item.stock,
                                  likes: like ? 1 : 0,
                                  ip: like ? [ip] : [],
                              },
                              (err, doc) => {
                                  if (err) throw err
                                  item.likes = doc.ops[0].likes
                                  sendResponse(res, item)
                              }
                          )
                      } else {
                          db.collection('stock').findOneAndUpdate(
                              { stockName: item.stock },
                              like && docs.ip.indexOf(ip) === -1
                                  ? { $inc: { likes: 1 }, $push: { ip: ip } }
                                  : { $inc: { likes: 0 } },
                              { returnOriginal: false },
                              (err, doc) => {
                                  item.likes = doc.value.likes
                                  sendResponse(res, item)
                              }
                          )
                      }

                      db.close()
                  })
              })
          })
      })        
      .catch(err => console.log(eer))

      const sendResponse = (res, item) => {
          if (arr.length == 1) {
              res.json({ stockData: item })
          } else if (arr.length == 2) {
              inArr.push(item)
              if (inArr.length == 2) {
                  inArr[0].rel_likes = inArr[0].likes - inArr[1].likes
                  inArr[1].rel_likes = inArr[1].likes - inArr[0].likes

                  delete inArr[0].likes
                  delete inArr[1].likes

                  res.json({ stockData: inArr })
                  inArr = []
              }
          } else res.type('text').send('incorrect input')
      }
    });
 
};
