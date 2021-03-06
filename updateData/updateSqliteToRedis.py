#!/usr/local/bin/python
# -*- coding: utf-8 -*- 

import sqlite3
import redis
import esclient
import json
import re
from os import path
import ConfigParser 

cf = ConfigParser.ConfigParser()
cf.read("config.conf")

CALIBRE_ALL_BOOKS_SET  = cf.get("key", "CALIBRE_ALL_BOOKS_SET")
CALIBRE_ALL_BOOKS_HASH  = cf.get("key", "CALIBRE_ALL_BOOKS_HASH")
CALIBRE_EPUB_PATH_HASH  = cf.get("key", "CALIBRE_EPUB_PATH_HASH")

CALIBRE_ALL_SERIES_SET  = cf.get("key", "CALIBRE_ALL_SERIES_SET")
CALIBRE_SERIES_BOOKS_HASH  = cf.get("key", "CALIBRE_SERIES_BOOKS_HASH")

BOOK_LIBRARY  = cf.get("path", "BOOK_LIBRARY")

data_save_repository = cf.get("path", "data_save_repository")

#///
#CALIBRE_ALL_BOOKS_SET  = 'calibre_all_books_sort_set'
#CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash'
#CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash'
#CALIBRE_PATH_EPUB_HASH = 'calibre_path_epub_hash'
#repository = "/root/all_book_library/Calibre/metadata.db"
repository =  cf.get("path", "repository")
pool = redis.ConnectionPool(host='127.0.0.1', port=6379)  
r = redis.Redis(connection_pool=pool)
es = esclient.ESClient("http://localhost:9200/")
conn = sqlite3.connect(repository)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def getDataSaveBookidClickDict():
	if path.exists(data_save_repository):
		try:
			conn = sqlite3.connect(data_save_repository)
			conn.row_factory = sqlite3.Row
			cur = conn.cursor()
			sql = 'select * from calibre_id_click'
			cur.execute(sql)
			rows = cur.fetchall()

			id_click_dict = {}
			for row in rows:
				id_click_dict[row['id']] = row['click']
			return id_click_dict
		except sqlite3.Error, e:
			print "Error %s:" % e.args[0]
			return {}
	else:
		return {}


def getBookPath(id):
	global cur
	sql = 'select path from books where id=%s' % id
	cur.execute(sql)
	row = cur.fetchone()
	return "cover/" + row['path'] + "/cover_128_190.jpg" if row else "assets/images/cover_128_190.jpg"

if path.exists(repository):
	sql = 'select books.id,data.name,data.format,title,timestamp,pubdate, isbn ,path,uuid, has_cover, text as desc,\
		      author_sort as author from (books left join data on books.id = data.book) left join comments on books.id = comments.book'
	cur.execute(sql)
	rows = cur.fetchall()
	r.flushdb()
	es.delete_index("readream")
	id_click_dict = getDataSaveBookidClickDict()
	for row in rows:
		p = BOOK_LIBRARY + "/" + row['path'] + '/cover_128_190.jpg';
		if path.exists(p):
			click = id_click_dict[row['id']] if id_click_dict.has_key(row['id']) else 0
			r.hset(CALIBRE_ALL_BOOKS_HASH, row['id'], json.dumps(dict(row)))
			#r.zadd(CALIBRE_ALL_BOOKS_SET,  json.dumps(dict(row)), row['id'])
			r.zadd(CALIBRE_ALL_BOOKS_SET,   row['id'], click)
			#r.hset(CALIBRE_EPUB_PATH_HASH, row['id'], row['path'])

			data = dict(row)
			book_id = row['id']
			es.index("readream", "books", body=data, docid=book_id)

	sql = 'select id, name from series'
	cur.execute(sql)
	rows = cur.fetchall()
	for row in rows:
		sql = 'select book from books_series_link where series=%s' % row['id']
		cur.execute(sql)
		books = cur.fetchall()
		book_ids = [book['book'] for book in books]
		if len(book_ids)>0:
			first_id = book_ids[0]
			path = getBookPath(first_id)
			data = {"id":row['id'], "name":row['name'],"path":path}
			r.zadd(CALIBRE_ALL_SERIES_SET,  json.dumps(data), row['id'])
			r.hset(CALIBRE_SERIES_BOOKS_HASH, row['id'], json.dumps(book_ids))



