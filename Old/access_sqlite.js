#!/usr/bin/env node

"use strict";

//
// includes
//
var fs = require("fs");
var sqlite3 = require("sqlite3");

//
// only continue if the database exists
//
var repository = "/root/all_book_library/Calibre/metadata.db";
fs.exists(repository, function(exists) {
if (exists) {

//
// open the database
//
var db = new sqlite3.Database(repository);
var stmt = "SELECT book, format, name FROM data";
var data = [];
db.each(stmt, function(err, row) {

//
// print out results
//
data.push(row);
console.log(data);

});

db.close();
} else {
console.log("Database does not exist, run broker_node_init.js first.");
}
});