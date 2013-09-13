#!/bin/sh

library_dir=$1


OLDIFS=$IFS       
IFS=:
#echo "find $add_library_dir -mindepth 2 -type d  -printf '%p$IFS'"
for findlist in $( find "$library_dir" -mindepth 2 -type d  -printf "%p$IFS")
do
	#echo ${list}
	for findname in $( find "${findlist}" -type f -name cover.jpg )
   	do
   		#echo ${filename}
   		jpg_dir=`dirname "${findname}"`
   		jpg_basename=`basename "${findname}"`
   		jpg_filename=${jpg_basename%.*}
   		jgp_new_filename="${jpg_dir}"/"${jpg_filename}""_128_190.jpg"
         if [ ! -f "$jgp_new_filename" ]; then  
            echo "convert -resize 128X190 ${findname}  ${jgp_new_filename}"
            convert -resize 128X190! "${findname}"  "${jgp_new_filename}"  
         fi
   		
   	done
done
IFS=$OLDIFS