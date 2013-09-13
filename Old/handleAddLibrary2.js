var redis = require("redis"),
    redisClient = redis.createClient(),
    fs = require('fs'),
    path = require('path'),
    Inotify = require('inotify').Inotify,
    inotify = new Inotify(),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,

    watchPath = '/root/Dropbox/calibre',
    parameter = ["-m", "-r", "-q", '--timefmt', '%d/%m/%y %H:%M', '--format', '%w%f', '-e', 'moved_to,create', watchPath],
    inotifyWatch = spawn("inotifywait", parameter);


var EPUB_UNZIP_CONTENT = '/var/www/html/public/reader/epub_content/',
    BOOK_LIBRARY = '/root/all_book_library/Calibre',
    CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
    CALIBRE_PATH_EPUB_HASH = 'calibre_path_epub_hash';

var FFI = require("node-ffi");
var libc = new FFI.Library(null, {
  "system": ["int32", ["string"]]
});

var run = libc.system;


inotifyWatch.stdout.setEncoding("utf8");
inotifyWatch.stdout.on("data", function(data) {
    var lines = data.split("\n");
    for(var i=0; i < lines.length; i++){
          var line = lines[i].trim();
          if (line.length == 0) continue;
          console.log(line);
          var ext = path.extname(line);
          if(ext == '.epub'){
                var dir = path.dirname(line);
                var parameter = ['add' , '-d' , dir  ,'--library-path', BOOK_LIBRARY];
                calibredb_add = spawn("calibredb", parameter);
                calibredb_add.stdout.setEncoding("utf8");
                calibredb_add.stdout.on("data", function(data) {
                        console.log(data);           
                });
                calibredb_add.stderr.setEncoding("utf8");
                calibredb_add.stderr.on("data", function(data) {
                  console.log(data);
                });
          }
    }
});



inotifyWatch.stderr.setEncoding("utf8");
inotifyWatch.stderr.on("data", function(data) {
  console.log(data);
});