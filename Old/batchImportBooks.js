var redis = require("redis");
var client = redis.createClient();
var fs = require('fs');
var path = require('path');
var Inotify = require('inotify').Inotify;
var inotify = new Inotify();
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var OLDIFS=process.env.IFS;
var IFS=":";
var flags = "%p" + IFS;
var watchPath = '/root/Dropbox/calibre';



var command = 'find ' + watchPath + ' -mindepth 2 -type d  -printf ' + flags;
child1 = exec(command, function (error, stdout, stderr) {
	var floder_path = stdout.split(":");
	for(var i = 0; i < floder_path.length; i++){
		var command = 'find "' + floder_path[i] + '" -type f  -printf ' + flags;
		child2 = exec(command, function (error, stdout, stderr) {
			var files = stdout.split(":");
			for(var i = 0; i < files.length; i++){
				var ext = path.extname(files[i]);
      			if(ext == '.epub'){
					  var dir = path.dirname(files[i]);
			          var file_path = files[i];
			          console.log(file_path);
			          console.log(dir);
			          var parameter = ['add' , dir  ,'--library-path', '/tmp/book'];
			          calibredb = spawn("calibredb", parameter);
			          calibredb.stdout.setEncoding("utf8");
			          calibredb.stdout.on("data", function(data) {
			              var bookid = data;
			              console.log(bookid);
			              // basename = path.basename(dir);
			              // output  = '/tmp/test/' + basename;

			              // console.log(file_path);
			              // console.log(bookid);
			              // console.log(output);

			              // var parameter = ['-o' , file_path  ,'-d', output];
			              // unzip = spawn("unzip", parameter);
			              // unzip.stdout.setEncoding("utf8");
			              // unzip.stdout.on("close", function(data) {
			              //     var parameter = [output , '-type'  ,'f', '-name', '*.opf'];
			              //     find = spawn("find", parameter);
			              //     find.stdout.setEncoding("utf8");
			              //     find.stdout.on("data", function(data) {
			              //         var items = data.split("\n");
			              //         if(items.length>0){
			              //           client.set(bookid,items[0]);
			              //           console.log('end');
			              //         }
			                      
			              //     });
			              // });
			          });
				}
			}
		});
		//console.log(command);
	}
});

