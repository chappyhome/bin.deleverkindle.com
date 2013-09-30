#!/usr/local/bin/python
# -*- coding: utf-8 -*- 

import sqlite3
import redis
import sys
from os import path
import ConfigParser

pool = redis.ConnectionPool(host='127.0.0.1', port=6379)  
r = redis.Redis(connection_pool=pool)

conf = "config.conf" if len(sys.argv) < 2 else sys.argv[1]
cf = ConfigParser.ConfigParser()
cf.read(conf)

CALIBRE_ALL_BOOKS_SET  = cf.get("key", "CALIBRE_ALL_BOOKS_SET")
data_save_repository = cf.get("path", "data_save_repository")


if path.exists(data_save_repository):
		try:
			conn = sqlite3.connect(data_save_repository)
			conn.row_factory = sqlite3.Row
			cur = conn.cursor()
			sql = 'create table if not exists calibre_id_click (id INTEGER PRIMARY KEY, click INTEGER)'
			cur.execute(sql)
			conn.commit()

			rows = r.zrange(CALIBRE_ALL_BOOKS_SET, 0, -1, withscores=True)
			insert_sql = 'INSERT OR REPLACE INTO calibre_id_click VALUES ({0}, {1})'
			for row in rows:
				sql = insert_sql.format(row[0], row[1])
				cur.execute(sql)
				conn.commit()
		except sqlite3.Error, e:
			print "Error %s:" % e.args[0]
