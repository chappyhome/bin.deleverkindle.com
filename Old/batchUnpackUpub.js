var redis = require("redis");
var client = redis.createClient();
var fs = require('fs');
var sqlite3 = require("sqlite3");
var path = require('path');
var sleep = require('sleep');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var unzip = require('unzip');
//var execSync = require('exec-sync');
//var execSync = require('subprocess');
var execSync = require('exec-sync');
var watchPath = '/root/all_book_library/Calibre/';
var repository = "/root/all_book_library/Calibre/metadata.db";
var unzip_dir = "/var/www/html/public/reader/epub_content/";
var CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash';


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
						if(!path.existsSync(output)){
							var mkdircommand = 'mkdir -p "' + output + '"';
	     					run(mkdircommand);
	     					
	     					//run(command);
	     					 exec(command, function (error, stdout, stderr) { 
	     					 	console.log(error);
	     					 	console.log(stdout);
	     					 	console.log(row.id + ":" + row.path);
	        					client.hset(CALIBRE_EPUB_PATH_HASH, row.id, row.path); 
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