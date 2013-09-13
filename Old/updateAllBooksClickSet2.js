var redis = require("redis"),
    redisClient = redis.createClient(),

	CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_ALL_BOOKS_CLICK_HASH = 'calibre_all_books_click_hash',
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