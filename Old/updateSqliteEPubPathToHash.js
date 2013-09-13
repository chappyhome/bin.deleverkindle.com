var redis = require("redis"),
    redisClient = redis.createClient(),
    fs = require("fs"),
    sqlite3 = require("sqlite3");


var elastical = require('elastical'),
	elasticalclient = new elastical.Client();

var	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	CALIBRE_PATH_EPUB_HASH = 'calibre_path_epub_hash',
	repository = "/root/all_book_library/Calibre/metadata.db";



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