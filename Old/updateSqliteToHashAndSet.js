var redis = require("redis"),
    redisClient = redis.createClient(),
    parseString = require('xml2js').Parser().parseString,
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

var	CALIBRE_ALL_BOOKS_SET  = 'calibre_all_books_sort_set',
	CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_ALL_BOOKS_LIST = 'calibre_all_books_list',
	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	//CALIBRE_PATH_EPUB_HASH = 'calibre_path_epub_hash',
	repository = "/root/all_book_library/Calibre/metadata.db";



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
			//var re = /^(.*)\s+\(\d+\)$/;
			//var new_path = row.path.replace(re, "$1");
			redisClient.hset(CALIBRE_EPUB_PATH_HASH, row.id, row.path);
			//redisClient.hset(CALIBRE_PATH_EPUB_HASH, new_path, row.id);
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


