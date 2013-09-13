var redis = require("redis"),
    redisClient = redis.createClient(),
    //parseString = require('xml2js').Parser().parseString,
    //http = require("http"),
    fs = require('fs'),
    path = require('path'),
    Inotify = require('inotify').Inotify,
    inotify = new Inotify(),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,

    watchPath = '/root/Dropbox/calibre',
    parameter = ["-m", "-r", "-q", '--timefmt', '%d/%m/%y %H:%M', '--format', '%w%f', '-e', 'moved_to,create', watchPath],
    inotifyWatch = spawn("inotifywait", parameter);


var PAGE_BASIC_INFO = 'calibre_page_basic_info',
    //BASE_DATA_URL = 'http://www.deliverkindle.com:8080/xml',
    EPUB_UNZIP_CONTENT = '/var/www/html/public/reader/epub_content/',
    //BOOK_LIBRARY = '/tmp/book';
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
          var file_path = line;
          basename = path.basename(dir),
          new_dir = path.dirname(dir),
          new_basename = path.basename(new_dir),
          book_path = new_basename + "/" + basename,
          re = /^(.*)\s+\(\d+\)$/,
          new_book_path = book_path.replace(re, "$1");
          output  = EPUB_UNZIP_CONTENT + new_book_path;

          console.log(new_book_path);

          redisClient.hget(CALIBRE_PATH_EPUB_HASH, new_book_path, function(err, bookid){
                console.log("+++" + bookid + "+++");
                //console.log(book_path);
                var parameter = ['remove' , bookid  ,'--library-path', BOOK_LIBRARY];
                calibredb_remove = spawn("calibredb", parameter);
                calibredb_remove.stdout.setEncoding("utf8");
                calibredb_remove.stdout.on("data", function(data) {
                        var parameter = ['add' , '-d' , dir  ,'--library-path', BOOK_LIBRARY];
                        calibredb_add = spawn("calibredb", parameter);
                        calibredb_add.stdout.setEncoding("utf8");
                        calibredb_add.stdout.on("data", function(data) {
                            var re = /^.*\s+(\d+)$/,
                                book_id = data.replace(re, "$1");
                                new_output = output + " (" + bookid + ")";
                            console.log(file_path);
                            console.log(bookid);
                            console.log(new_output);

                            var command = 'unzip -o "' + file_path + '" -d  "' + new_output + '"';
                            //var command = "unzip -o "+file_path + " -d  "+output;
                            console.log(command);
                            if(!fs.existsSync(output)){
                              var mkdircommand = 'mkdir -p "' + output + '"';
                                run(mkdircommand);
                                
                                //run(command);
                                exec(command, function (error, stdout, stderr) { 
                                    console.log(error);
                                    console.log(stdout);
                                    //client.hset(CALIBRE_EPUB_PATH_HASH, bookid, value); 
                                });

                            }
                            

                            /*var parameter = ['-o' , file_path  ,'-d', output];
                            unzip = spawn("unzip", parameter);
                            unzip.stdout.setEncoding("utf8");
                            unzip.stdout.on("close", function(data) {
                                client.hset(CALIBRE_EPUB_PATH_HASH,bookid,value);
                                /*var parameter = [output , '-type'  ,'f', '-name', '*.opf'];
                                find = spawn("find", parameter);
                                find.stdout.setEncoding("utf8");
                                find.stdout.on("data", function(data) {
                                    var items = data.split("\n");
                                    if(items.length>0){
                                      key = "calibre_book_" + bookid;
                                      client.rpush("booklist1",key);
                                      var value = items[0].replace(/\/var\/www\/html\//,"");
                                      client.hset("calibre_books_doc_info",key,value);
                                    }
                                    
                                });
                            });*/
                        });
                        calibredb_add.stderr.setEncoding("utf8");
                        calibredb_add.stderr.on("data", function(data) {
                          console.log(data);
                        });
            });
            calibredb_remove.stderr.setEncoding("utf8");
            calibredb_remove.stderr.on("data", function(data) {
              console.log(data);
            });
        });
      }
    //console.log(line);
    //console.log(ext);
  }
  
});

//display error
inotifyWatch.stderr.setEncoding("utf8");
inotifyWatch.stderr.on("data", function(data) {
  console.log(data);
});