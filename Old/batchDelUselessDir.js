var fs = require('fs'),
	exec = require('child_process').exec,
	path = require('path'),
	sqlite3 = require("sqlite3");

var repository = "/root/all_book_library/Calibre/metadata.db";
    unzip_dir = "/var/www/html/public/reader/epub_content/";

var FFI = require("node-ffi");
var libc = new FFI.Library(null, {
  "system": ["int32", ["string"]]
});

var run = libc.system;

var OLDIFS=process.env.IFS;
var IFS=":";
var flags = "%p" + IFS;



if(fs.existsSync(repository)){
	var db = new sqlite3.Database(repository),
	    stmt = 'select * from books',
	    paths = [];
	    //console.log(stmt);
	db.each(stmt, function(err, row) {
		//console.log(row.path);
		paths.push(row.path);
	});
	console.log(paths);
	db.close();
}



var command = 'find ' + unzip_dir + ' -maxdepth 2 -type d  -printf ' + flags;
child1 = exec(command, function (error, stdout, stderr) {
	var floder_path = stdout.split(":");
	for(var i = 0; i < floder_path.length; i++){
		var dir = path.dirname(floder_path[i]);
	        basename = path.basename(floder_path[i]),
	        //new_dir = path.dirname(dir),
	        new_basename = path.basename(dir),
	        book_path = new_basename + "/" + basename;
	   // console.log(floder_path[i]);
		//console.log(book_path);
	}
});