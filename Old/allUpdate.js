var redis = require("redis"),
    redisClient = redis.createClient(),
    //parseString = require('xml2js').Parser().parseString,
    fs = require("fs"),
    sqlite3 = require("sqlite3");
var ElasticSearchClient = require('elasticsearchclient'),
	serverOptions = {
	    host: 'localhost',
	    port: 9200
	},
	elasticSearchClient = new ElasticSearchClient(serverOptions);

var elastical = require('elastical'),
	elasticalclient = new elastical.Client();

var	CALIBRE_ALL_BOOKS_SET = 'calibre_all_books_sort_set',
	CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_ALL_BOOKS_LIST = 'calibre_all_books_list',
	repository = "/root/all_book_library/Calibre/metadata.db";


//update Sqlite to hash and Set
fs.exists(repository, function(exists) {
	if (exists) {
		var db = new sqlite3.Database(repository),
		    stmt = "select books.id,title,timestamp,pubdate, isbn ,path,uuid, has_cover, text as desc,\
		            author_sort as author from books left join comments on books.id = comments.book";
		db.each(stmt, function(err, row) {
			console.log(row.id);
			redisClient.hset(CALIBRE_ALL_BOOKS_HASH, row.id, JSON.stringify(row));
			redisClient.rpush(CALIBRE_ALL_BOOKS_LIST, row.id);
			redisClient.zadd(CALIBRE_ALL_BOOKS_SET, row.id, JSON.stringify(row));
			elasticSearchClient.index("readream", "books", row, row.id,{})
		    .on('data', function(data) {
		        console.log(data)
		    })
		    .exec();
		});
		db.close();
	};
	//
	//process.exit(1);
});



//update Sqlite Epub Path to Hash
var	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	CALIBRE_PATH_EPUB_HASH = 'calibre_path_epub_hash';

fs.exists(repository, function(exists) {
	if (exists) {
		var db = new sqlite3.Database(repository),
		    stmt = "select books.id,books.path,data.name from books left join data on books.id = data.book";
		db.each(stmt, function(err, row) {//watchPath
			//var epub_path = row.path;
			//var real_pub_path = "epub/" + row.path + "/" + row.name + '.epub';

			var re = /^(.*)\s+\(\d+\)$/;
			var str = row.path.replace(re, "$1");
			console.log(row.path);
			console.log(row.id+ ":" + str);

			redisClient.hset(CALIBRE_EPUB_PATH_HASH, row.id, row.path);
			redisClient.hset(CALIBRE_PATH_EPUB_HASH, str, row.id);
		});
	};
});


//update Covert Cover
var exec = require('child_process').exec,
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


//update All Books Click to Set
var CALIBRE_ALL_BOOKS_CLICK_HASH = 'calibre_all_books_click_hash',
	CALIBRE_ALL_BOOKS_CLICK_SORT_SET = 'calibre_all_books_click_sort_set';

redisClient.hgetall(CALIBRE_ALL_BOOKS_CLICK_HASH, function(err, bookidclicks){
	console.log(bookidclicks);
	for(var bookid in bookidclicks){
		//console.log(bookid);
		redisClient.hget(CALIBRE_ALL_BOOKS_HASH, bookid, function(err, book){
			if(book){
				//console.log(book);
				json_book = JSON.parse(book);
				var click = bookidclicks[json_book.id] || 0;
				//console.log(bookidclicks);
				console.log(click);
				redisClient.zadd(CALIBRE_ALL_BOOKS_CLICK_SORT_SET, click, book);
			}
		});
	}
});


//batch unpack epub
var watchPath = '/root/all_book_library/Calibre/',
	path = require('path'),
	unzip_dir = "/var/www/html/public/reader/epub_content/";
var FFI = require("node-ffi");
var libc = new FFI.Library(null, {
  "system": ["int32", ["string"]]
});

var run = libc.system;

fs.exists(repository, function(exists) {
	if (exists) {
			var db = new sqlite3.Database(repository),
			    stmt = "select books.id,books.path,data.name from books left join data on books.id = data.book";
			db.each(stmt, function(err, row) {
				//sleep.sleep(1);
				//console.log(watchPath + row.path + "/" + row.name + ".epub");
				var file_path = watchPath + row.path + "/" + row.name + ".epub";
				fs.exists(file_path, function(exists) {
					if(exists){
						
						var output = unzip_dir + row.path;
						//var parameter = ['-o' , file_path  ,'-d', output];
						var command = 'unzip -o "'+file_path + '" -d  "'+output + '"';
						//var command = "unzip -o "+file_path + " -d  "+output;
						console.log(command);
						if(!fs.existsSync(output)){
							var mkdircommand = 'mkdir -p "' + output + '"';
	     					run(mkdircommand);
	     					
	     					//run(command);
	     					 exec(command, function (error, stdout, stderr) { 
	     					 	console.log(error);
	     					 	console.log(stdout);
	     					 	console.log(row.id + ":" + row.path);
	        					redisClient.hset(CALIBRE_EPUB_PATH_HASH, row.id, row.path); 
	    					});

						}
     					
					}else{
						console.log(file_path + " Does not exist");
					}
					
	        	});
			});
	}else{
		console.log(repository + " Does not exist");
	}
});