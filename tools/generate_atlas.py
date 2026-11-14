"""Generate original 16-material sci-fi atlas, no asset downloads or licensing.
Requires numpy and Pillow only for regeneration; game uses the resulting PNG.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
R=np.random.default_rng(3092026)
S=256
# 4x4: steel, alloy, floor, concrete, hazard, cyan light, crate, carbon,
# brushed titanium, ventilation grid, electric circuitry, ceramic,
# gold accent, warning signal, holographic display, oxidized copper.
BASE=[(89,120,137),(142,165,174),(78,102,118),(119,132,139),
      (164,128,48),(74,197,204),(129,103,83),(43,60,72),
      (121,156,173),(48,74,91),(24,104,113),(185,202,203),
      (186,134,57),(198,64,42),(34,100,133),(84,128,125)]
Y,X=np.mgrid[:S,:S]
tiles=[]
for i,base in enumerate(BASE):
    grain=R.normal(0,1,(S,S))
    low=np.kron(R.normal(0,1,(32,32)),np.ones((8,8)))[:S,:S]
    directional=np.sin(Y*1.7+grain*.1) if i in (1,8) else np.sin(X*.12)*.7
    detail=grain*(5 if i not in (3,6) else 10)+low*5+directional*2.5
    color=np.clip(np.asarray(base)[None,None,:]+detail[:,:,None],0,255).astype(np.uint8)
    im=Image.fromarray(color,mode='RGB')
    d=ImageDraw.Draw(im,'RGBA')
    def line(coords,c,w=1):d.line(coords,fill=c,width=w)
    if i in (0,3,8,11):
        # Raised plate divisions and small recessed rivets.
        for k in range(0,S,64):
            line((k,0,k,S),(10,22,29,120),3)
            line((k+4,0,k+4,S),(242,250,252,26))
            line((0,k,S,k),(12,24,32,110),3)
            for q in range(0,S,64):
                d.ellipse((k+9,q+8,k+14,q+13),fill=(11,27,36,195))
                d.ellipse((k+10,q+8,k+11,q+9),fill=(210,234,238,150))
        if i==3:
            for k in range(120):
                a,b=R.integers(0,S,2);r=int(R.integers(1,4))
                d.ellipse((int(a),int(b),int(a+r),int(b+r)),fill=(14,35,39,55))
    elif i==1:
        for k in range(0,S,20):line((0,k,S,k),(223,239,239,36))
        for k in range(42):
            a,b=R.integers(0,S,2)
            line((int(a),int(b),int(min(S,a+R.integers(8,70))),int(b)),(227,251,251,55))
    elif i==2:
        for k in range(0,S,64):
            line((k,0,k,S),(8,20,30,170),4);line((0,k,S,k),(8,20,30,150),4)
            line((k+5,5,k+59,5),(205,220,228,42))
        for yy in range(8,S,16):
            for xx in range(8,S,16):
                line((xx-3,yy-4,xx+3,yy+4),(9,17,26,160),3)
                line((xx-4,yy-4,xx+2,yy+3),(198,230,239,68))
    elif i==4:
        d.rectangle((0,0,S,S),fill=(175,126,40,145))
        for k in range(-512,512,55):d.polygon([(k,0),(k+27,0),(k+283,256),(k+256,256)],fill=(16,27,33,220))
    elif i==5:
        d.rectangle((0,0,S,S),fill=(19,88,101,175))
        for yy in range(14,S,40):
            d.rounded_rectangle((10,yy,S-10,yy+15),radius=5,fill=(119,240,239,230))
            line((15,yy+20,S-15,yy+20),(43,240,245,95),2)
    elif i==6:
        for xx in range(16,S,28):
            line((xx,0,xx,S),(5,19,26,160),5)
            line((xx+5,0,xx+5,S),(232,205,156,45))
        for yy in (11,245):d.rectangle((0,yy,S,yy+8),fill=(14,28,37,140))
    elif i==7:
        for yy in range(0,S,10):line((0,yy,S,yy),(175,210,220,21))
        for xx in range(0,S,32):line((xx,0,xx,S),(3,10,20,54),2)
    elif i==9:
        d.rectangle((0,0,S,S),fill=(11,31,41,150))
        for yy in range(10,S,22):
            for xx in range(7,S,22):
                d.rounded_rectangle((xx,yy,xx+14,yy+10),radius=3,fill=(7,14,23,220),outline=(115,185,192,66),width=1)
    elif i==10:
        for xx in range(0,S,36):
            line((xx,8,xx,S-8),(42,227,219,135),3)
            d.ellipse((xx-4,12,xx+4,20),fill=(121,253,233,220))
            for yy in range(28,S,44):
                line((xx,yy,xx+18,yy),(40,231,203,150),2)
                d.ellipse((xx+16,yy-2,xx+21,yy+3),fill=(124,252,217,135))
    elif i==12:
        for yy in range(0,S,18):
            line((0,yy,S,yy),(255,229,124,58),2)
            line((0,yy+6,S,yy+6),(20,39,44,62))
    elif i==13:
        d.rectangle((0,0,S,S),fill=(99,20,22,90))
        for yy in range(8,S,32):
            d.rounded_rectangle((8,yy,S-8,yy+13),radius=4,fill=(249,76,53,220))
    elif i==14:
        d.rectangle((0,0,S,S),fill=(10,47,70,160))
        for yy in range(16,S,26):line((8,yy,S-8,yy),(85,249,247,160),2)
        for xx in range(20,S,35):
            line((xx,10,xx,S-8),(51,191,208,74))
        for j in range(16):
            x,y=R.integers(15,240,2)
            d.rectangle((int(x),int(y),int(x+R.integers(6,34)),int(y+5)),fill=(154,255,227,125))
    elif i==15:
        for yy in range(0,S,48):
            line((0,yy,S,yy),(12,52,52,120),5)
            for xx in range(0,S,50):d.ellipse((xx+3,yy+6,xx+9,yy+12),fill=(134,235,187,95))
    tiles.append(im)
atlas=Image.new('RGB',(S*4,S*4))
for i,tile in enumerate(tiles):atlas.paste(tile,((i%4)*S,(i//4)*S))
out=Path(__file__).resolve().parent.parent/'public'/'assets'/'foundry-materials.png'
out.parent.mkdir(parents=True,exist_ok=True)
atlas.save(out,optimize=True)
print(f'Created {out}: {out.stat().st_size} bytes, {atlas.size}')
