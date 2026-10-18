import random
from PIL import Image, ImageDraw, ImageFilter
random.seed(3); S=512
img=Image.new('RGBA',(S,S),(0,0,0,0))
def drop(cx,cy,r):
    L=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(L)
    for ox in (-S,0,S):
        for oy in (-S,0,S):
            x,y=cx+ox,cy+oy
            if -40<x<S+40 and -40<y<S+40:
                rx=r*random.uniform(.85,1.1); ry=r*random.uniform(.9,1.25)
                d.ellipse((x-rx,y-ry,x+rx,y+ry),fill=(255,255,255,40))           # body (clearer glass)
                d.ellipse((x-rx*.55,y+ry*.15,x+rx*.75,y+ry*1.0),fill=(20,14,6,70))  # lower shadow
                d.ellipse((x-rx*.6,y-ry*.7,x-rx*.05,y-ry*.2),fill=(255,255,255,190)) # highlight
    return L
for _ in range(900):
    r=random.choice([1.2,1.5,2,2,2.5,3]) 
    img.alpha_composite(drop(random.uniform(0,S),random.uniform(0,S),r))
for _ in range(70):
    img.alpha_composite(drop(random.uniform(0,S),random.uniform(0,S),random.uniform(4,7.5)))
# a few run trails
d=ImageDraw.Draw(img)
for _ in range(5):
    x=random.uniform(0,S); y=random.uniform(0,S*.6); L=random.uniform(60,180)
    for i in range(int(L)):
        d.ellipse((x-1.6,y+i-1.6,x+1.6,y+i+1.6),fill=(255,255,255,26)); x+=random.uniform(-.4,.4)
img=img.filter(ImageFilter.GaussianBlur(.5)); img.save('jungle/drops.png')
prev=Image.new('RGB',(S,S),(180,140,90)); prev.paste(img,(0,0),img); prev.save('jungle/drops_prev.png')
