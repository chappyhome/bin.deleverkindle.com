 var redis = require("redis"),
        client = redis.createClient();

    // if you'd like to select database 3, instead of 0 (default), call
    // client.select(3, function() { /* ... */ });

    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.rpush("books",56);

 
    client.llen("books",function (err, reply){
        client.lrange("books",0,reply, function (err, reply) {
            console.log(reply.toString());

        });
    })
   

   client.get("calibre_page_basic_info",function(err, reply){
        var o = JSON.parse(reply);
        console.log(o.total);
        //console.log(JSON.parse(reply));
   });
    
var parseString = require('xml2js').Parser().parseString
    ,   http = require("http");


// http.get("http://www.deliverkindle.com:8080/xml?start=950&num=1", function(res) {
//     res.setEncoding('utf8');
//     res.on('data', function(data) {
//         parseString(data, function (err, result) {
//             books = result.library.book[0];
//             var b = [];
//             for(var key in books){
//                 v = books[key].$;
//                 v['desc'] = books[key]._;
//                 b.push(v);
//                 console.log(b);
//             }
//             console.log(books.$);
//         });
//     });
//     console.log("Got response: " + res.statusCode);
// }).on('error', function(e) {
//     console.log("Got error: " + e.message);
// });
var b
var a = b || [1,2];
console.log(a.length);


