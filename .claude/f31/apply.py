import re,io
def put(k,src,begin,end,after):
    s=io.open(k,encoding='utf-8',newline='').read(); b=io.open(src,encoding='utf-8').read()
    nl='\r\n' if '\r\n' in s else '\n'; b=b.replace('\r\n','\n').replace('\n',nl)
    s=re.sub(re.escape(begin)+r'.*?'+re.escape(end)+nl,'',s,flags=re.S); a=after+nl; assert s.count(a)==1,k; s=s.replace(a,a+b); io.open(k,'w',encoding='utf-8',newline='').write(s)
put('../../apps/steam/js/react/kitart.js','block31.js','// ==== W31 BEGIN','// ==== W31 END','// ==== W30 END')
put('../../apps/steam/js/react/scheme.js','s31.js','  // ==== S31 BEGIN','// ==== S31 END','  // ==== S30 END')
