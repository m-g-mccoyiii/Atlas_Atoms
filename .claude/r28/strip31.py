import sys
from PIL import Image
# strip31.py <take> <out.jpg> [cols] [x0,y0,w,h] [zoom] : the key frames of a j_e31 take in a row, cropped about Water's home
n=sys.argv[1]; out=sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 4
x0,y0,w,h=[int(v) for v in (sys.argv[4] if len(sys.argv)>4 else '400,0,440,330').split(',')]; z=float(sys.argv[5]) if len(sys.argv)>5 else 1
import os
fs=sorted(f for f in os.listdir('frames/'+n) if f.endswith('.jpg'))
W=int(w*z); H=int(h*z); rows=(len(fs)+cols-1)//cols
s=Image.new('RGB',(cols*(W+6)-6,rows*(H+6)-6),(250,248,242))
for i,f in enumerate(fs):
    im=Image.open('frames/%s/%s'%(n,f)); k=im.size[0]/1280.0
    c=im.crop((int(x0*k),int(y0*k),int((x0+w)*k),int((y0+h)*k))).resize((W,H),Image.LANCZOS); s.paste(c,((i%cols)*(W+6),(i//cols)*(H+6)))
s.save(out,quality=90); print(s.size,len(fs))
