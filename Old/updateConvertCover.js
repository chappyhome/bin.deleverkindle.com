var redis = require("redis"),
    redisClient = redis.createClient(),
    fs = require("fs"),
    exec = require('child_process').exec,
	CALIBRE_ALL_BOOKS_SET = 'calibre_all_books_sort_set',
	watchPath = '/root/all_book_library/Calibre';


redisClient.zrange(CALIBRE_ALL_BOOKS_SET, 0, -1, function(err, reply){
		for(var i = 0; i < reply.length; i++){
				var r = JSON.parse(reply[i]);
				//console.log(r);
				path = watchPath + "/" + r.path + '/cover_128_190.jpg';
				if(!fs.existsSync(path)){
					original = watchPath + "/" + r.path + '/cover.jpg';
					var command = 'convert -resize 128X190! "' + original + '"        "' +  path + '"';
					console.log(path);
					console.log(command);
					exec(command, function (error, stdout, stderr) { 
     					 	//console.log(error);
     					 	//console.log(stdout);
	    			});
				}
		}
});