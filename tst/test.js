const restify = require('restify');
const server = restify.createServer();
const mongoose = require('mongoose');
const rp = require("request-promise");
const cheerio = require('cheerio');
const Promise = require("bluebird");
const co = Promise.coroutine;



let con = mongoose.connect("mongodb://mongo:27017/db",
{ useNewUrlParser: true,
  reconnectTries: 30,
  reconnectInterval: 500
});

mongoose.connection.on('error', (err) => {
  console.log("ERR");
});

mongoose.connection.on('connected', () => {
  console.log("OOOKKK");
  // function clearCollections() {
  //   for (var collection in mongoose.connection.collections) {
  //     mongoose.connection.collections[collection].remove(function() {});
  //   }
  //   console.log("deleted");
  // }
  // clearCollections();
});

var pageShema = new mongoose.Schema({
  date: {  type: String,
          unique: true},
  html: String
});
var urlShema = new mongoose.Schema({
  url: {  type: String,
          unique: true}
});
// const Cat = mongoose.model('Cat', { name: String });
// Cat.findOne(
//   function asd(err, data) {
//     console.log(data);
//   }
// );
// // const kitty = new Cat({ name: 'Zildjian22' });
// // kitty.save().then(() => console.log('meowwwwwwwww'));
let lessonCodes = [ "AKM","ATA","ALM","BEB","BED","BEN","BIL","BIO","BLG","BLS",
                    "BUS","CAB","CEV","CHE","CHZ","CIE","CIN","CMP","COM","DAN",
                    "DEN","DFH","DGH","DNK","DUI","EAS","ECO","ECN","EHA","EHB",
                    "EHN","EKO","ELE","ELH","ELK","ELT","END","ENE","ENG","ENR",
                    "ESL","ESM","ETK","EUT","FIZ","FRA","FZK","GED","GEM","GEO",
                    "GID","GLY","GMI","GMK","GSB","GSN","GUV","GVT","HUK","HSS",
                    "ICM","ILT","IML","ING","INS","ISE","ISH","ISL","ISP","ITA",
                    "ITB","JDF","JEF","JEO","JPN","KIM","KMM","KMP","KON","LAT",
                    "MAD","MAK","MAL","MAT","MEK","MEN","MET","MCH","MIM","MKN",
                    "MST","MTM","MOD","MRE","MRT","MTH","MTK","MTO","MTR","MUH",
                    "MUK","MUT","MUZ","NAE","NTH","PAZ","PEM","PET","PHE","PHY",
                    "RES","RUS","SBP","SEN","SES","SNT","SPA","STA","STI","TDW",
                    "TEB","TEK","TEL","TER","TES","THO","TRZ","TUR","UCK","ULP",
                    "UZB","YTO"];


const Page = mongoose.model("Page", pageShema);
const Url = mongoose.model("Url", urlShema);


// const url
let urls = [];

let updateURLs = co(function* () {
  let now = (new Date()).toISOString().replace(/[^0-9]/g, "");
  let urlG = `https://web.archive.org/web/${now.slice(0, -3)}/http://www.sis.itu.edu.tr/tr/ders_programlari/LSprogramlar/prg.php?fb=MAT`;
  while(urlG)
  {
    // urls.push(urlG);
    let url = new Url({url:urlG});
    console.log(urlG);
    let fnc = Promise.promisifyAll(url);
    yield fnc.saveAsync().then(function ok() {
      console.log("saved");
    }).catch(function (err) {
      console.log(""+err);
    });
    yield rp(urlG).then(function func(data) {
      const $ = cheerio.load(data);
      urlG = $("#wm-ipp-inside > div:nth-child(1) > table > tbody > tr:nth-child(1) > td.n > table > tbody > tr.d > td.b > a").attr("href");
    });
  }
  return "done";
});
// updateURLs();
//
// function updateDB()
// {
//
//   // console.log("url", url);
//   while(urlG)
//   {
//     for(let code in lessonCodes)
//     {
//       let url
//       rp(url).then(function func(data) {
//         const $ = cheerio.load(data);
//         let strDate = $("#body > table > tbody > tr:nth-child(1) > td > table:nth-child(2) > tbody > tr > td:nth-child(2) > span").text().split(" ");
//
//         let date = strDate[0] +"/"+ strDate[1];
//         let aPage = new Page({date: date, html:data});
//         console.log("done");
//         let val1 = [];
//         $('select option:selected').each(function() {
//          val1.push($(this).val());
//         });
//         let nex = $("#wm-ipp-inside > div:nth-child(1) > table > tbody > tr:nth-child(1) > td.n > table > tbody > tr.d > td.b > a").attr("href");
//         console.log("next", nex);
//         if(val1[0] == "MAT")
//         {
//           urlG = nex;
//         }
//
//         Page.findOne({date:date}).exec(function (err, one) {
//           if( ! one)
//           {
//             aPage.save();
//           }
//         });
//         // aPage.save(function ok() {
//         //   console.log("Saved");
//         // });
//       });
//       // for ()
//
//     }
//
//   }
// }
// updateDB();
server.listen(3000);

server.get("/", function (req, res, next) {
        Url.find.lean().exec(function (err, one) {

          res.send(one);
        });
        // res.send(values);
      });
server.get("/updateURLs", function (req, res, next) {
  res.send(updateURLs());
});
