var express = require('express');
var mongodb = require('mongodb');
var app = express();


app.use(express.static('public'));

var search_url;
var short_url;
var new_url;


// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;


app.get("/:short", function (req, res) {
  short_url = req.params.short;
  mongodb.MongoClient.connect(uri, function(err, db) {
    if(err) throw err;
    var urls = db.collection('url');
    urls.findOne({short_url:"https://fcc-shorter-url.glitch.me/"+short_url}, function(err, result){
      if(err) throw err;
      if(result==undefined){
        urls.findOne({error:"URL not in database, try entering another."}, function(err, result){
          res.send(result);
        })
      }else{
        db.close(function (err) {
        if(err) throw err;
      });
      res.redirect(result.long_url);
      short_url = result;
      
    };
    })
});
})

app.get("/new/*",function(req,res){
  search_url = req.params[0];
  if(learnRegExp(search_url)){
    mongodb.MongoClient.connect(uri, function(err, db) {
      if(err) throw err;
      var urls = db.collection('url');
      var counters = db.collection('counters');
      counters.update(
        { _id: 'url_id' },
        { $inc: { seq: 1 } },
        {
        new: true,
        upsert:true
        },
        counters.findOne({_id:'url_id'}, function(err, result){
           new_url = {short_url:"https://fcc-shorter-url.glitch.me/"+result.seq, long_url:search_url};
           urls.insertOne(new_url, function(err,respond){
             if(err) throw err;
             res.send(new_url);
             db.close(function (err) {
              if(err) throw err;
             });
           });
        })
      )
    })
    
  }else{
    res.send("<h1>Not Valid</h1>"); 
  }
});

//check if url structure is valid
function learnRegExp(s) {    
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);    
}




// listen for requests :)
var listener = app.listen("3000", function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

