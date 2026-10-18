import numpy as np
from PIL import Image, ImageFilter, ImageOps
A='/Users/danieltimar/Documents/Vibecode/moai-kalendarium/spike/assets/'; J='jungle/'
def cut(path, box, greenonly=False, erode=True):
    im=Image.open(A+path).convert('RGB').crop(box)
    hsv=np.asarray(im.convert('HSV')).astype(float)
    h=hsv[...,0]*360/255; s=hsv[...,1]/255; v=hsv[...,2]/255
    if greenonly: keep=((h>=55)&(h<=200)&(s>0.06)) | ((v<0.35)&(h>=62)&(h<=200))
    else: keep=~(((h>=5)&(h<=52)&((s>0.28)|((s>0.10)&(v>0.55)))) | (v<0.10))
    m=Image.fromarray(keep.astype(np.uint8)*255).filter(ImageFilter.MedianFilter(5))
    if erode: m=m.filter(ImageFilter.MinFilter(3))
    m=m.filter(ImageFilter.GaussianBlur(0.9))
    im.putalpha(m); return im
def trimx(im):  # trim only left/right/bottom, keep top line
    b=im.getbbox(); return im.crop((b[0],0,b[2],b[3]))
def trim(im): return im.crop(im.getbbox())
def prev(im,n):
    bg=Image.new('RGB',im.size,(14,22,18)); bg.paste(im,(0,0),im); bg.save(J+n+'_prev.png')
# vine from mayari, top line at pot middle, pot removed by green-only key
vine=trimx(cut('cards/scindapsus-mayari-12cm-1.webp',(130,330,670,660),greenonly=True))
vine=vine.resize((vine.width*2,vine.height*2),Image.LANCZOS); vine.save(J+'vine.png'); prev(vine,'vine')
mint=ImageOps.flip(trimx(ImageOps.flip(cut('cards/scindapsus-mint-12cm-4.webp',(200,95,700,345),greenonly=True))))
mint=mint.resize((int(mint.width*1.4),int(mint.height*1.4)),Image.LANCZOS); mint.save(J+'mint.png'); prev(mint,'mint')
drag=trim(cut('cards/alocasia-dragon-scale-12cm-2.webp',(330,30,720,560)))
drag.save(J+'dragon.png'); prev(drag,'dragon')
aloc=trim(cut('cards/alocasia-frydek-variegata-17cm-3.webp',(100,0,660,470)))
aloc.save(J+'aloc.png'); prev(aloc,'aloc')
def sil(im,name,blur):
    a=im.split()[3]; d=Image.new('RGBA',im.size,(6,11,8,255)); d.putalpha(a)
    pad=Image.new('RGBA',(im.width+blur*6,im.height+blur*6),(0,0,0,0)); pad.alpha_composite(d,(blur*3,blur*3))
    pad=pad.filter(ImageFilter.GaussianBlur(blur)); pad.save(J+name)
sil(aloc,'sil_aloc.png',12)
sil(trim(cut('leaf.webp',(0,0,512,512))),'sil_leaf.png',10)
sil(trim(cut('cards/calathea-white-star-14cm-1.webp',(0,0,720,560))),'sil_cal.png',10)
print(vine.size, mint.size, drag.size, aloc.size)
