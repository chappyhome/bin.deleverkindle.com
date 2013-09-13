#!/usr/bin/python
# -*- coding: utf-8 -*-  
import sqlite3
import hashlib
from os import system,path
import ConfigParser 
cf = ConfigParser.ConfigParser()

cf.read("config.conf")
repository =  cf.get("path", "repository")
workDir    = cf.get("path", "workDir")
#repository = "/root/all_book_library/Calibre/metadata.db";
#workDir = '/var/www/html/public/reader/epub_content/'
try:
	conn = sqlite3.connect(repository)
	conn.row_factory = sqlite3.Row
	cur = conn.cursor()

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

	del_dir_list = [workDir + item for item in p_del_list]
	# print del_dir_list
	#del sqlite
	cur.execute(del_sql_books)
	cur.execute(del_sql_data)
	cur.execute(del_sql_comments)
	conn.commit()

	#del dir
	for dir in del_dir_list:
		if workDir in dir and len(dir) > len(workDir) and path.exists(dir):
			system('rm -fr "' + dir + '"')
	print del_sql_data
	print id_del_list
	print p_del_list

	
except sqlite3.Error, e:
    print "Error %s:" % e.args[0]
    sys.exit(1)
finally:
    if conn:
        conn.close()
