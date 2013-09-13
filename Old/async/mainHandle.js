var redis = require("redis"),
	client_receive = redis.createClient(),
	client_send = redis.createClient(),
	async = require("async"),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	sleep = require('sleep');
	path = require('path');

	channel = "main_channel";
	unzip_dir = '/tmp/test/'


var q = async.queue(function(task, callback) {
	 var action = task.action || "";
	 switch(action)
	{
		case "add_library":
			var dir = task.dir;
			var file = task.file_path;
			var library = task.savedir;
			var command = 'calibredb add "'  + dir + '" --library-path ' + library;
			console.log(command);
			sleep.sleep(5);
			exec(command, function(err, stdout, stderr){
				if(!err){
					console.log(stdout);
					basename = path.basename(dir);
					output  = unzip_dir + basename;
					task ={
							bookid:stdout,
							dir:output,
							file_path:file,
							action:"unzip"

						};
					client_send.publish(channel, JSON.stringify(task));
				}
			});
		  break;
		case "unzip":
			var output = task.dir;
			var file_path = task.file;
			var bookid = task.bookid;
			var parameter = ['-o' , file_path  ,'-d', output];
			unzip = spawn("unzip", parameter);
			unzip.stdout.setEncoding("utf8");
			sleep.sleep(5);
			unzip.stdout.on("close", function(data) {
				task ={
							bookid:bookid,
							dir:output,
							action:"find"

						};
				client_send.publish(channel, JSON.stringify(task));
			});
		  break;
		case "find":
			var output = task.dir;
			var bookid = task.bookid;
			var parameter = [output , '-type'  ,'f', '-name', '*.opf'];
			var find = spawn("find", parameter);
			find.stdout.setEncoding("utf8");
			find.stdout.on("data", function(data) {
				  var items = data.split("\n");
	              if(items.length>0){
	                //client.set(bookid,items[0]);
	                console.log(bookid + ":" + items[0]);
	              }
			});
		  break;
		default:
		  console.log('default');
	}
}, 10);




client_receive.on("message", function (channel, message) {
	console.log(message);
	q.push(JSON.parse(message));
});
client_receive.subscribe(channel);