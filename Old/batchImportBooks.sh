#!/bin/sh

function scandir() {
    local cur_dir parent_dir workdir
    workdir=$1
    unzip_base_dir=$2
	add_library_dir=$3
    if [ ${workdir} = "/" ]
    then
        cur_dir=""
    else
        cur_dir=$(pwd)
    fi
	
	OLDIFS=$IFS       
	IFS=:
 
    for dirlist in $( find $workdir -mindepth 2 -type d  -printf "%p$IFS")
    do
           for filelist in $( find "$dirlist" -type f -printf "%p$IFS")
		   do
				handle $filelist ${unzip_base_dir}  ${add_library_dir}
		   done
    done
	IFS=$OLDIFS
}

function handle() {
		file=$1
		unzip_base_dir=$2
		add_library_dir=$3
		filename=`basename "${file}"`
		ext=${filename##*.}
		if [ "${ext}" == "epub" ]; then
			pf=${filename%.*}
			dir=`dirname "${file}"`
			#new_filename=${pf}".zip"
			#f=${dir}/${new_filename}
			bookid=`/usr/bin/calibredb  add  "${dir}"  --library-path "${add_library_dir}"`
			echo ${bookid}


			riqi=`date +%Y%m%d`
		    echo `date +%Y-%m-%d" "%T`" "${dir} >>/data/log/${riqi}".log"
		    
			#cp  "${file}"  "${f}"
			basename=`basename "${dir}"`
			newdir=`dirname "${dir}"`
			secondbasename=`basename "${newdir}"`
			library_path=${add_library_dir}"/${secondbasename}"
			#jpg=`find "${library_path}" -type f -name *.jpg`
			OLDIFS=$IFS       
			IFS=:
			#echo "find $add_library_dir -mindepth 2 -type d  -printf '%p$IFS'"
			for findlist in $( find "$add_library_dir" -mindepth 2 -type d  -printf "%p$IFS")
    		do
    			#echo ${list}
				for findname in $( find "${findlist}" -type f -name *.jpg )
			   	do
			   		#echo ${filename}
			   		jpg_dir=`dirname "${findname}"`
			   		jpg_basename=`basename "${findname}"`
			   		jpg_filename=${jpg_basename%.*}
			   		jgp_new_filename="${jpg_dir}"/"${jpg_filename}""_128_190.jpg"
			   		echo "convert -resize 128X190 ${findname}  ${jgp_new_filename}"
					convert -resize 128X190 "${findname}"  "${jgp_new_filename}"
			   	done
		   	done
		   	IFS=$OLDIFS
			#converte

			unzipdir="${unzip_base_dir}/${basename}"
			unzip -o "${file}" -d "${unzipdir}" > /dev/null 2>&1
			sleep 10
			opf=`find "${unzipdir}" -type f -name *.opf`

			value=${opf/\/var\/www\/html\//}
			key=${bookid}
			redis-cli rpush booklist1 ${key} > /dev/null 2>&1
			redis-cli hset "calibre_books_doc_info"  ${key} "${value}" > /dev/null 2>&1
		fi
}

scandir $1 $2 $3
