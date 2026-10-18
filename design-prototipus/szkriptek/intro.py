from jlib import *
random.seed(31); R=random.uniform
W,H=780,1688
POOL=['leaf','aloc','monst','ficus','mint','hoya','aloc','leaf','anth','mint']
def wall(n,scale,dim,blur,target,seed):
    random.seed(seed); lay=Image.new('RGBA',(W,H),(0,0,0,0)); i=0
    while coverage(lay)<target and i<400:
        k=random.choice(POOL); s=R(*scale)*(1.6 if k=='leaf' else 1)
        rot=R(-40,40) if random.random()<.7 else 180+R(-35,35)
        im=prep(k,s,rot,random.random()<.5,False,R(*dim),blur)
        put(lay,im,R(-80,W+80),R(-80,H+80)); i+=1
    # hanging strands for depth
    for _ in range(n):
        im=prep(random.choice(['strandL','strandR']),R(1.2,1.8),R(-8,8),random.random()<.5,False,R(*dim),blur)
        put(lay,im,R(0,W),R(-40,H*.5),'t')
    return lay
layers=[wall(3,(1.1,1.7),(.30,.42),3.0,.80,1),
        wall(3,(1.3,2.0),(.42,.55),1.5,.90,2),
        wall(2,(1.5,2.3),(.42,.6),0.6,.96,3),
        wall(2,(1.9,2.8),(.48,.72),0,.985,4)]
vig=Image.new('L',(W,H),0); vd=ImageDraw.Draw(vig); vd.ellipse((-W*.2,-H*.1,W*1.2,H*1.1),fill=255); vig=vig.filter(ImageFilter.GaussianBlur(120))
for i,l in enumerate(layers):
    r,g,b,a=l.split(); rgb=Image.composite(Image.merge('RGB',(r,g,b)),ImageEnhance.Brightness(Image.merge('RGB',(r,g,b))).enhance(.45),vig); layers[i]=Image.merge('RGBA',(*rgb.split(),a))
for i,l in enumerate(layers): l.save(f'amaz/wall{i+1}.webp',quality=82,method=6)
# clearing: today's plant standing in a sunlit glade, foliage framing it
photo=Image.open('/Users/danieltimar/Documents/Vibecode/moai-kalendarium/spike/assets/cards/alocasia-frydek-variegata-17cm-3.webp').convert('RGB')
sc=H/photo.height*0.78; ph=photo.resize((int(photo.width*sc),int(photo.height*sc)),Image.LANCZOS)
bg=Image.new('RGBA',(W,H),(30,22,10,255))
amb=ph.resize((W,H)).filter(ImageFilter.GaussianBlur(40)); bg.paste(amb,(0,0))
bg.paste(ph,((W-ph.width)//2,int(H*0.02)))
fade=Image.new('L',(W,H),0); fd=ImageDraw.Draw(fade)
for y in range(H): fd.line((0,y,W,y),fill=int(255*min(1,max(0,(y-H*.34)/(H*.28)))))
dark=Image.new('RGBA',(W,H),(6,12,8,255)); dark.putalpha(fade.point(lambda v:int(v*.93))); bg.alpha_composite(dark)
rays=Image.new('L',(W,H),0); rd=ImageDraw.Draw(rays)
for x0,w,a in ((300,80,110),(420,40,80),(220,34,60),(520,60,70)):
    rd.polygon([(x0,-20),(x0+w,-20),(x0+w*2.2+160,H*.8),(x0+w+90,H*.8)],fill=a)
rays=rays.filter(ImageFilter.GaussianBlur(30)); ray=Image.new('RGBA',(W,H),(255,232,170,255)); ray.putalpha(rays.point(lambda v:int(v*.5))); bg.alpha_composite(ray)
frame=Image.new('RGBA',(W,H),(0,0,0,0)); random.seed(12)
for _ in range(20):
    k=random.choice(POOL); left=random.random()<.5
    x=R(-160,40) if left else R(W-40,W+160); y=R(-60,H+60)
    rot=R(-40,40) if random.random()<.6 else 180+R(-35,35)
    put(frame,prep(k,R(.5,.85)*(1.3 if k=='leaf' else 1),rot,not left,False,R(.28,.5),R(0,3)),x,y)
for _ in range(7):
    k=random.choice(['mint','hoya','strandL','strandR']); put(frame,prep(k,R(.6,.9),180+R(-20,20),random.random()<.5,False,R(.25,.4),2),R(0,W),R(-120,-20),'t')
bg.alpha_composite(frame)
vig=Image.new('L',(W,H),0); vd=ImageDraw.Draw(vig); vd.ellipse((-W*.25,-H*.15,W*1.25,H*1.05),fill=255); vig=vig.filter(ImageFilter.GaussianBlur(110))
blk=Image.new('RGBA',(W,H),(4,8,6,255)); blk.putalpha(vig.point(lambda v:int((255-v)*.85))); bg.alpha_composite(blk)
bg.convert('RGB').save('amaz/clearing.webp',quality=86)
# contact preview
prev=Image.new('RGB',(W*5//2,H//2))
for i,im in enumerate([bg]+layers):
    t=Image.new('RGB',(W,H),(255,0,255)); t.paste(im,(0,0),im); prev.paste(t.resize((W//2,H//2)),(i*W//2,0))
prev.save('amaz/intro_prev.png')
print([round(coverage(l),3) for l in layers])
