#!/usr/bin/python
# -*- coding: utf-8 -*-

import subprocess
import sqlite3
import redis
import pyinotify
import esclient
import re
from os import path, system
import ConfigParser 

cf = ConfigParser.ConfigParser()
cf.read("config.conf")
repository             =  cf.get("path", "repository")
unzip_dir              = cf.get("path", "workDir")
BOOK_LIBRARY           = cf.get("path", "BOOK_LIBRARY")
elasticsearch_host     = cf.get("path", "elasticsearch_host")
CALIBRE_ALL_BOOKS_SET  = cf.get("key", "CALIBRE_ALL_BOOKS_SET")
CALIBRE_ALL_BOOKS_HASH = cf.get("key", "CALIBRE_ALL_BOOKS_HASH")
CALIBRE_EPUB_PATH_HASH = cf.get("key", "CALIBRE_EPUB_PATH_HASH")
#repository = "/root/all_book_library/Calibre/metadata.db"
#unzip_dir = "/var/www/html/public/reader/epub_content/"
#BOOK_LIBRARY = '/root/all_book_library/Calibre'
#CALIBRE_ALL_BOOKS_SET  = 'calibre_all_books_sort_set'
#CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash'
#CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash'

#init redis
pool = redis.ConnectionPool(host='127.0.0.1', port=6379)
r = redis.Redis(connection_pool=pool)
#init sqlite3
conn = sqlite3.connect(repository)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
#init es
es = esclient.ESClient(elasticsearch_host)




wm = pyinotify.WatchManager()

class EventHandler(pyinotify.ProcessEvent):

    def process_IN_CREATE(self, evt):
        print "create ", evt.pathname

    def process_IN_MOVED_TO(self, evt):
        print "IN_MOVED_TO ", evt.pathname
        ext = path.splitext(evt.pathname)[1]
        if ext == '.epub':
            dir = path.dirname(evt.pathname)
            command = 'calibredb add -d "{0}" --library-path {1}'.format(dir,  BOOK_LIBRARY)
	    print command
            p = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            out = p.stdout.readlines()
	    print out
            if len(out)>=3:
		pattern = re.compile('.*\s+(\d+)\\n$')
		match = pattern.match(out[1])
		fid = match.groups()[0]
		bookid = int(fid)
		print match.groups()[0]
		sql = 'select * from books where id=%d' % bookid
		cur.execute(sql)
		row = cur.fetchone()
		#add to redis and index to es	
		r.hset(CALIBRE_ALL_BOOKS_HASH, row['id'], json.dumps(dict(row)))
		r.zadd(CALIBRE_ALL_BOOKS_SET,  json.dumps(dict(row)), row['id'])
		r.hset(CALIBRE_EPUB_PATH_HASH, row['id'], row['path'])

		data = dict(row)
		book_id = row['id']
		print "index to es"
		es.index("readream", "books", body=data, docid=book_id)

		#unzip
		output = unzip_dir + row['path']
		mkdircommand = 'mkdir -p "%s"' % output
		system(mkdircommand)
		command = 'unzip -o "{0}" -d  "{1}"'.format(evt.pathname, output)
		print command
		system(command)

		#convert cover to 128X190
		cover_path = BOOK_LIBRARY + "/" + row['path'] + '/cover_128_190.jpg'
		if not path.exists(cover_path):
			original = BOOK_LIBRARY + "/" + row['path'] + '/cover.jpg'
			command = 'convert -resize 128X190! "{0}"        "{1}"'.format(original, cover_path)
			print command
			system(command)

		#del data and dir
		del_sqlite_and_dir()		


		
            	# if success add book to library
              	# TODO

            	# get add book id, get path from db,then unzip epub to dir
            	# TODO

            	# update path info to redis, book info to redis,
            	# TODO


def del_sqlite_and_dir():
    try:
	#conn = sqlite3.connect(repository)
	#conn.row_factory = sqlite3.Row
	#cur = conn.cursor()
	global conn, cur, sqlite3, sys, unzip_dir, system, CALIBRE_ALL_BOOKS_HASH, CALIBRE_ALL_BOOKS_SET, CALIBRE_EPUB_PATH_HASH,r
	sql = 'select * from books \
	where title in (select  title  from  books  group  by  title  having  count(title) > 1)'
	cur.execute(sql)
	rows = cur.fetchall()
	titles = [row['title'] for row in rows]
	no_zf_titles = set(titles)
	# print no_zf_titles
	id_del_list = []
	p_del_list = []
	for title in no_zf_titles:
		sql = 'select id,path from books where title="' + title + '"'
		cur.execute(sql)
		records = cur.fetchall()
		id_record = [str(record[0]) for record in records]
		p_record = [str(record[1]) for record in records]
		id_record.pop()
		p_record.pop()
		id_del_list += id_record
		p_del_list += p_record
		# r = []
	del_sql_books = 'delete from books where id in(' + ','.join(id_del_list) + ')'
	del_sql_data = 'delete from data where book in(' + ','.join(id_del_list) + ')'
	del_sql_comments = 'delete from comments where book in(' + ','.join(id_del_list) + ')'

	del_dir_list = [unzip_dir + item for item in p_del_list]
	# print del_dir_list
	#del sqlite
	cur.execute(del_sql_books)
	cur.execute(del_sql_data)
	cur.execute(del_sql_comments)
	conn.commit()

	#del redis
	for id in id_del_list:
		r.zrem(CALIBRE_ALL_BOOKS_SET, id)
		r.hdel(CALIBRE_ALL_BOOKS_HASH, id)
		r.hdel(CALIBRE_EPUB_PATH_HASH, id)
	#del dir
	for dir in del_dir_list:
		if unzip_dir in dir and len(dir) > len(unzip_dir) and path.exists(dir):
			system('rm -fr "' + dir + '"')
	print del_sql_data
	print id_del_list
	print p_del_list

	
    except sqlite3.Error, e:
        print "Error %s:" % e.args[0]
        #sys.exit(1)

notifier = pyinotify.Notifier(wm, EventHandler())
mask = pyinotify.IN_MOVED_TO | pyinotify.IN_CREATE
watcher = wm.add_watch("/root/Dropbox/calibre", mask, rec=True, auto_add=True)
notifier.loop()
