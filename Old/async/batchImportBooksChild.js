var redis = require("redis");
var client = redis.createClient();
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var OLDIFS=process.env.IFS;
var IFS=":";
var flags = "%p" + IFS;
var watchPath = '/root/Dropbox/calibre';
var saveDir = '/tmp/book';
var channel = 'main_channel';



var command = 'find ' + watchPath + ' -mindepth 2 -type d  -printf ' + flags;
var dir_child = exec(command, function (error, stdout, stderr) {
	var floder_path = stdout.split(":");
	for(var i = 0; i < floder_path.length; i++){
		var command = 'find "' + floder_path[i] + '" -type f  -printf ' + flags;
		file_child = exec(command, function (error, stdout, stderr) {
			var files = stdout.split(":");
			for(var i = 0; i < files.length; i++){
				var ext = path.extname(files[i]);
      			if(ext == '.epub'){
      				var dir = path.dirname(files[i]);
      				var file_path = files[i];
      					task ={
      						dir:dir,
      						file_path:file_path,
      						action:"add_library",
      						savedir:saveDir
      					};
      				client.publish(channel, JSON.stringify(task));
      			}
      		}
      	});
	}
});