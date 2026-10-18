from jlib import *
import json
random.seed(77); R=random.uniform
X=2; WC,HC=390,2760; W,H=WC*X,HC*X
# stops (CSS coords)
xs=[112,272,124,262,118,256,195]
stops=[(xs[k-1],300+(k-1)*140) for k in range(1,8)]
ox=[96,290,150,250,110,300,180,270,90,230,140,300,110,260,170,300,120]
over=[(ox[i],1330+i*76) for i in range(17)]
pts=[(195,150)]+stops+over+[(200,2740)]
# smooth path
def cat(p,n=16):
    P=[p[0]]+p+[p[-1]]; out=[]
    for i in range(1,len(P)-2):
        a,b,c,d=P[i-1],P[i],P[i+1],P[i+2]
        for k in range(n):
            t=k/n;t2=t*t;t3=t2*t
            out.append(tuple(0.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3) for j in (0,1)))
    return out
path=cat(pts)
today_y=stops[-1][1]
def deepen(im):
    d=Image.new('L',im.size,255); dd=ImageDraw.Draw(d)
    for y in range(im.height):
        yy=y/X; t=0 if yy<today_y+200 else min(1,(yy-(today_y+200))/1100)
        dd.line((0,y,im.width,y),fill=int(255*(1-.68*t)))
    r,g,b,a=im.split(); rgb=ImageChops.multiply(Image.merge('RGB',(r,g,b)),Image.merge('RGB',(d,d,d)))
    return Image.merge('RGBA',(*rgb.split(),a))
bg=Image.new('RGBA',(W,H),(7,15,10,255))
# ambient: sun glow at top and over today's clearing
def glow(cx,cy,rx,ry,col,a,blur):
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).ellipse(((cx-rx)*X,(cy-ry)*X,(cx+rx)*X,(cy+ry)*X),fill=255); m=m.filter(ImageFilter.GaussianBlur(blur*X))
    c=Image.new('RGBA',(W,H),col+(255,)); c.putalpha(m.point(lambda v:int(v*a))); bg.alpha_composite(c)
glow(195,40,260,200,(255,200,110),.35,60)
glow(195,today_y,190,170,(255,196,96),.55,50)
# dirt trail for the cleared part (up to today), fading out after
trail=Image.new('L',(W,H),0); td=ImageDraw.Draw(trail)
for (x,y) in path:
    if y>today_y+40: break
    r=30+R(-3,3); td.ellipse(((x-r)*X,(y-r)*X,(x+r)*X,(y+r)*X),fill=255)
trail=trail.filter(ImageFilter.GaussianBlur(10*X))
dirt=Image.new('RGBA',(W,H),(74,56,34,255))
noise=Image.effect_noise((W,H),40).convert('L'); dirt=Image.composite(Image.new('RGBA',(W,H),(96,74,46,255)),dirt,noise.point(lambda v:255 if v>150 else 0).filter(ImageFilter.GaussianBlur(1.2)))
dirt.putalpha(trail.point(lambda v:int(v*.75))); bg.alpha_composite(dirt)
# corridor mask (where foliage must not go) – cleared trail + stops
corr=Image.new('L',(WC,HC),0); cd=ImageDraw.Draw(corr)
for (x,y) in path:
    if y>today_y+30: break
    cd.ellipse((x-44,y-44,x+44,y+44),fill=255)
cd.ellipse((195-110,today_y-105,195+110,today_y+105),fill=255)
cd.rectangle((0,0,WC,250),fill=255)  # header/title area
def free(cx,cy,r):
    for dx,dy in ((0,0),(r*.6,0),(-r*.6,0),(0,r*.6),(0,-r*.6)):
        x,y=int(cx+dx),int(cy+dy)
        if 0<=x<WC and 0<=y<HC and corr.getpixel((x,y))>0: return False
    return True
POOL=['leaf','aloc','monst','ficus','mint','hoya','aloc','anth','mint','ficus']
back=Image.new('RGBA',(W,H),(0,0,0,0))
for i in range(520):
    cx,cy=R(-40,WC+40),R(200,HC+40); k=random.choice(POOL); s=R(.32,.62)*(1.3 if k=='leaf' else 1)
    r=max(SRC[k].size)*s/2*0.55
    if cy<today_y+60 and not free(cx,cy,r): continue
    rot=R(-40,40) if random.random()<.7 else 180+R(-35,35)
    put(back,prep(k,s*X,rot,random.random()<.5,False,R(.3,.62),R(0,1.5)),cx*X,cy*X)
bg.alpha_composite(back)
# rays
rays=Image.new('L',(W,H),0); rd=ImageDraw.Draw(rays)
for x0,w in ((150,40),(230,26),(90,20),(300,30)):
    rd.polygon([(x0*X,0),((x0+w)*X,0),((x0+w*2+140)*X,1300*X),((x0+w+90)*X,1300*X)],fill=90)
rays=rays.filter(ImageFilter.GaussianBlur(24*X)); ray=Image.new('RGBA',(W,H),(255,230,170,255)); ray.putalpha(rays.point(lambda v:int(v*.45))); bg.alpha_composite(ray)
bg=deepen(bg) if 'deepen' in globals() else bg
bg.convert('RGB').save('amaz/trail_bg.webp',quality=80,method=6)
# front overgrowth over future markers (above HTML markers), partial coverage so numbers peek
front=Image.new('RGBA',(W,H),(0,0,0,0))
for i in range(260):
    cx,cy=R(-40,WC+40),R(today_y+150,HC+60); k=random.choice(POOL); s=R(.3,.6)*(1.3 if k=='leaf' else 1)
    rot=R(-40,40) if random.random()<.7 else 180+R(-35,35)
    put(front,prep(k,s*X,rot,random.random()<.5,False,R(.3,.58),0),cx*X,cy*X)
    if i%10==0 and coverage(front.crop((0,int((today_y+250)*X),W,H)))>.68: break
# also frame the cleared trail edges with a few sharp front leaves
for i in range(40):
    cx,cy=random.choice([R(-30,40),R(WC-40,WC+30)]),R(260,today_y+100); k=random.choice(POOL)
    put(front,prep(k,R(.35,.6)*X,R(-40,40),cx>WC/2,False,R(.5,.75),0),cx*X,cy*X)
fm=Image.new('L',(W,H),255); fd=ImageDraw.Draw(fm)
for y in range(int((today_y+80)*X),int((today_y+240)*X)): fd.line((0,y,W,y),fill=0)
fm=Image.new('L',(W,H),0); fd=ImageDraw.Draw(fm)
for y in range(H):
    yy=y/X
    v=255 if yy>today_y+230 else (int(255*(yy-(today_y+120))/110) if yy>today_y+120 else 0)
    fd.line((0,y,W,y),fill=max(0,min(255,v)))
side=Image.new('L',(W,H),0); sd=ImageDraw.Draw(side); sd.rectangle((0,0,44*X,H),fill=255); sd.rectangle(((WC-44)*X,0,W,H),fill=255); side=side.filter(ImageFilter.GaussianBlur(10*X))
fm=ImageChops.lighter(fm,side)
hdr=Image.new('L',(W,H),255); ImageDraw.Draw(hdr).rectangle((0,0,W,250*X),fill=0); hdr=hdr.filter(ImageFilter.GaussianBlur(20*X))
fm=ImageChops.multiply(fm,hdr)
front.putalpha(ImageChops.multiply(front.split()[3],fm))
front=deepen(front)
front.save('amaz/trail_front.webp',quality=80,method=6)
json.dump({'stops':stops,'over':over},open('amaz/trail.json','w'))
import os; print(os.path.getsize('amaz/trail_bg.webp'),os.path.getsize('amaz/trail_front.webp'))
