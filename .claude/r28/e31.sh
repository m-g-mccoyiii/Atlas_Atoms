#!/bin/bash
# e31.sh <name> <stage it leaves> <at list> [after ms] [crop x,y,w,h] [cols] [zoom] : key-frame stills of Water's change of stage, and a sheet t31/<name>.jpg
cd "$(dirname "$0")"; N=$1; rm -f frames/_err/log.json; mkdir -p t31
NAME=$N SHOW=900 timeout 400 ./run.sh e31 "&stage=$2&at=$3&after=${4:-1200}" 380 2>$N.err | python -c "
import sys,json
t=sys.stdin.read().split(chr(10))[0]
try:
    d=json.loads(t); print(d.get('ph'), d.get('d31'), d.get('error'), d.get('log'), d.get('hevo',{}).get('numT'), d.get('hevo',{}).get('at'))
except Exception as e: print('raw',t[:500])
"
cat frames/_err/log.json 2>/dev/null | cut -c1-600; echo
python strip31.py $N t31/$N.jpg ${6:-5} ${5:-380,0,480,340} ${7:-0.8}
