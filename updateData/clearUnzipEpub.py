#!/usr/bin/python
# -*- coding: utf-8 -*-  
import subprocess
import sqlite3
from os import path,system
import ConfigParser 

cf = ConfigParser.ConfigParser()
cf.read("config.conf")
repository =  cf.get("path", "repository")
workDir    = cf.get("path", "workDir")
#workDir = '/var/www/html/public/reader/epub_content'
#repository = "/root/all_book_library/Calibre/metadata.db";
conn = sqlite3.connect(repository)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

command = 'find ' + workDir + ' -maxdepth 2 -type d  -printf "%p:"'
print command
p = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
str = p.stdout.readlines()[0]
for line in str.split(":"):
    dir = path.dirname(line)
    subbase = path.basename(line)
    base= path.basename(dir)
    p = base + "/" + subbase


    cur.execute('select * from books where path="' + p + '"')
    rows = cur.fetchall()
    #print len(rows)
    if not len(rows):
    	if workDir  in line and len(line) > len(workDir):
    		print line
    		system('rm -fr "' + line + '"')

