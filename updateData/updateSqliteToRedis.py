#!/usr/bin/python
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

#CALIBRE_ALL_BOOKS_SET  = 'calibre_all_books_sort_set'
#CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash'
#CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash'
#CALIBRE_PATH_EPUB_HASH = 'calibre_path_epub_hash'
repository = "/root/all_book_library/Calibre/metadata.db"
pool = redis.ConnectionPool(host='127.0.0.1', port=6379)  
r = redis.Redis(connection_pool=pool)
es = esclient.ESClient("http://localhost:9200/")
conn = sqlite3.connect(repository)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

if path.exists(repository):
	sql = 'select books.id,title,timestamp,pubdate, isbn ,path,uuid, has_cover, text as desc,\
		      author_sort as author from books left join comments on books.id = comments.book'
	cur.execute(sql)
	rows = cur.fetchall()
	r.flushdb()
	for row in rows:
		r.hset(CALIBRE_ALL_BOOKS_HASH, row['id'], json.dumps(dict(row)))
		r.zadd(CALIBRE_ALL_BOOKS_SET,  json.dumps(dict(row)), row['id'])
		r.hset(CALIBRE_EPUB_PATH_HASH, row['id'], row['path'])

		data = dict(row)
		book_id = row['id']
		es.index("readream", "books", body=data, docid=book_id)

		#pattern = re.compile('^(.*)\s+\(\d+\)$')
		#match = pattern.match(row['path'])
		#if match:
		#	p = match.groups()
		#	r.hset(CALIBRE_PATH_EPUB_HASH, p[0], row['id'])
