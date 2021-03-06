#!/usr/local/bin/python
# -*- coding: utf-8 -*- 

import sqlite3
import sys
from os import path, system
import ConfigParser 

cf = ConfigParser.ConfigParser()
cf.read("config.conf")
repository =  cf.get("path", "repository")
watchPath    = cf.get("path", "BOOK_LIBRARY")
unzip_dir    = cf.get("path", "unzip_dir")

#repository = "/root/all_book_library/Calibre/metadata.db"
#watchPath = '/root/all_book_library/Calibre/'
#unzip_dir = "/var/www/html/public/reader/epub_content/"
conn = sqlite3.connect(repository)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

if path.exists(repository):
	sql = 'select books.id,books.path,data.name from books left join data on books.id = data.book'
	cur.execute(sql)
	rows = cur.fetchall()

	for row in rows:

		#unzip all epub to des
		#file_path = watchPath + row['path'] + "/" + row['name'] + ".epub"
		file_path = '{0}/{1}/{2}.epub'.format(watchPath, row['path'], row['name'])
		print file_path

		if path.exists(file_path):
			output = unzip_dir + row['path']
			unzipcommand = 'unzip -o "{0}" -d  "{1}"'.format(file_path, output)
			mkdircommand = 'mkdir -p "%s"' % output

			if path.exists(output):continue
			print unzipcommand
			print mkdircommand
			system(mkdircommand)
			system(unzipcommand)

		#resize all cover to 281X190
		#cover_path = watchPath  + row['path'] + '/cover_128_190.jpg'
		cover_path = '{0}/{1}/cover_128_190.jpg'.format(watchPath, row['path'])
		#print cover_path
		if not path.exists(cover_path):
			#original = watchPath  + row['path'] + '/cover.jpg';
			original = '"{0}/{1}/cover.jpg"'.format(watchPath, row['path'])
			command = 'convert -resize 128X190! {0}   "{1}"'.format(original, cover_path)
			#print command
			#print original
			system(command)
