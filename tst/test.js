const restify = require('restify');
const server = restify.createServer();
const mongoose = require('mongoose');
const rp = require("request-promise").defaults({encoding: "utf8"});
const cheerio = require('cheerio');
const Promise = require("bluebird");
const co = Promise.coroutine;
const legacy = require("legacy-encoding");
const unirest = require("unirest");
// const up = Promise.promisifyAll(unirest);
// const https = require('https');

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
  function clearCollections() {
    for (var collection in mongoose.connection.collections) {
      mongoose.connection.collections[collection].remove({});
    }
    console.log("deleted");
    process.exit();

  }
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
  let urlG = `https://web.archive.org/web/${now.slice(0, -3)}/http://www.sis.itu.edu.tr/tr/ders_programlari/LSprogramlar/prg.php?fb=`;
  for (let i in lessonCodes)
  {
    let code = lessonCodes[i];
    let urlR = urlG + code;
    yield rp(urlR).then(co(function *(data) {
      // console.log(data);
      const $ = cheerio.load(data);
      let url = $("#wmtb > input[type=hidden]:nth-child(3)").attr("value");
      // console.log("url", url);
      url = `https://web.archive.org/web/${url}/http://www.sis.itu.edu.tr/tr/ders_programlari/LSprogramlar/prg.php?fb=` + code;
      let urlS =  new Url({url:url});
      let urlP = Promise.promisifyAll(urlS);
      yield urlP.saveAsync().then(function ok() {
        console.log(`saved: ${url}`);
      }).catch(function (err) {
        console.log(""+err);
      });
      // urlG = $("#wm-ipp-inside > div:nth-child(1) > table > tbody > tr:nth-child(1) > td.n > table > tbody > tr.d > td.b > a").attr("href");
    }));
  }
  // while(urlG)
  // {
  //   // urls.push(urlG);
  //   let url = new Url({url:urlG});
  //   console.log(urlG);
  //   let fnc = Promise.promisifyAll(url);
  //   yield fnc.saveAsync().then(function ok() {
  //     console.log("saved");
  //   }).catch(function (err) {
  //     console.log(""+err);
  //   });
  //
  // }
  return updateDB();
});
// updateURLs();
//
let updateDB = function () {

  Url.find().lean().exec(
    function (err, urls) {
      for (let i in urls)
      {
        url = urls[i].url;
        // url = "https://web.archive.org/web/20120418024313/http://www.sis.itu.edu.tr:80/tr/ders_programlari/LSprogramlar/prg.php?fb=AKM";
        console.log("URL:", url);
        try {
          function calc(urll)
          {
            // console.log(url);
            if( ! urll) return;
            console.log("in calc:", urll);
            let data = null;
            try {
              unirest.get(urll)
                .encoding(null)
                .end(co(function *(d){
                  console.log("HELLo");
                  buff = d;
                  let data = legacy.decode(buff.raw_body, "iso-8859-9");
                  const $ = cheerio.load(data);
                  let strDate = $("#body > table > tbody > tr:nth-child(1) > td > table:nth-child(2) > tbody > tr > td:nth-child(2) > span").text().split(" ");
                  // console.log("ilk", strDate);
                  let code = $("select option:selected").val();
                  // console.log("CODE");
                  // console.log(code);
                  // return;
                  let date = null;
                  try
                  {
                    date = strDate[0] +"/"+ strDate[1][0] + "/" + code;
                  }
                  catch(e)
                  {
                    console.log(""+e);
                    strDate = $("#AutoNumber1 > tbody > tr:nth-child(1) > td > p:nth-child(3) > font").text().split(" ");
                    // console.log("ikinci", strDate);
                    // return;
                    date = strDate[4] +"/"+ strDate[5][0] + "/" + code;
                  }
                  console.log(date);
                  let aPage = new Page({date: date, html:data});
                  let aPageA = Promise.promisifyAll(aPage);
                  yield aPageA.saveAsync().then(function ok() {
                    console.log(`saved:${date}`);
                    console.log(`saved:${url}`);
                  }).catch(function (err) {
                    console.log(""+err);
                  });

                  calc( $("#wm-ipp-inside > div:nth-child(1) > table > tbody > tr:nth-child(1) > td.n > table > tbody > tr.d > td.b > a").attr("href"));
                  // console.log("html", html);
                  // let $ = cheerio.load(html);
                  // console.log("after cheerio", $.html("#body > table > tbody > tr:nth-child(1) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table").toString("utf8"));
                  // res.write($.html("#body > table > tbody > tr:nth-child(1) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table").toString("utf8"));
              }));
            } catch (e) {
              console.log(""+e);
            }
          }
          calc(url);
        } catch (e) {
          console.log(""+e);
          // continue;
        }


      }//for
      // console.log("end of for");
      return "Pending";
  });
  // console.log("hello", urls);
  // console.log("url", url);
  // console.log("end of updateDB()");
  return "Pending";
};
// updateDB();
server.listen(3000);

server.get("/", function (req, res, next) {
        // Url.find().lean().exec(function (err, one) {
        //
        //   res.send(one);
        // });

        // var req = https.request({hostname: "https://web.archive.org/web/20190618105926/http://www.sis.itu.edu.tr/tr/ders_programlari/LSprogramlar/prg.php?fb=AKM"}, function (res) {
    //     res.setEncoding('utf8');
    //     console.log("RES", res);
    //     var body = '';
    //
    //     res.on('data', function (chunk) {
    //       body = body + chunk;
    //     });
    //
    //     res.on('end',function(){
    //       console.log("Body :" + body);
    //       if (res.statusCode != 200) {
    //         callback("Api call failed with response code " + res.statusCode);
    //       } else {
    //         callback(null);
    //       }
    //     });
    //
    //   });
    //       req.on('error', function (e) {
    //   console.log("Error : " + e.message);
    //   callback(e);
    // });
        Page.findOne().lean().exec(function (err, data) {

          // console.log("DATA", data);

          let html = data.html;
          // console.log("html", html);
          let $ = cheerio.load(html);
          // console.log("after cheerio", $.html("#body > table > tbody > tr:nth-child(1) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table").toString("utf8"));
          let notOld = $.html("#body > table > tbody > tr:nth-child(1) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table").toString("utf8");
          if(notOld)
            res.write(notOld);
          else res.write($.html("#AutoNumber1 > tbody > tr:nth-child(2) > td:nth-child(3) > b > b > table").toString("utf8"))
            // let html = data.html;


        });

        // res.end();
        // ress.send("hmm");
});

server.get("/updateDB", function (req, res, next) {
  res.send(updateDB());
  next();
});
server.get("/updateURLs", function (req, res, next) {
  res.send(updateURLs());
  next();
});
