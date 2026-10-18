import numpy as np, glob, os
from PIL import Image, ImageFilter
A='/Users/danieltimar/Documents/Vibecode/moai-kalendarium/spike/assets/cards/'; O='jungle/g/'; os.makedirs(O,exist_ok=True)
tiles=[]
for p in sorted(glob.glob(A+'*.webp')):
    im=Image.open(p).convert('RGB')
    hsv=np.asarray(im.convert('HSV')).astype(float)
    h=hsv[...,0]*360/255; s=hsv[...,1]/255; v=hsv[...,2]/255
    keep=((h>=58)&(h<=200)&(s>0.07)&(v>0.08)) | ((v<0.33)&(h>=62)&(h<=200)&(s>0.15))
    m=Image.fromarray(keep.astype(np.uint8)*255).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    r=im.copy(); r.putalpha(m); b=r.getbbox()
    if not b: continue
    r=r.crop(b); n=os.path.basename(p)[:-5]; r.save(O+n+'.png')
    t=Image.new('RGB',(300,300),(14,22,18)); rr=r.copy(); rr.thumbnail((300,300)); t.paste(rr,(0,0),rr); tiles.append(t)
sheet=Image.new('RGB',(300*6,300*3))
for i,t in enumerate(tiles): sheet.paste(t,((i%6)*300,(i//6)*300))
sheet.save('jungle/sheet2.png')
