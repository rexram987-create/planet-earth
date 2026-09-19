from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'public'/'model'
for stem in ['day','night','clouds','bump','water']:
 im=Image.open(out/(stem+'.original')).convert('RGB')
 im.thumbnail((4096,2048) if stem=='day' else (2048,1024),Image.Resampling.LANCZOS)
 im.save(out/(stem+'.jpg'),quality=87,optimize=True)
# Render the actual model's day texture onto a sphere for the installation icons.
a=np.asarray(Image.open(out/'day.jpg'));s=512
y,x=np.mgrid[:s,:s];nx=(x-256)/174;ny=(y-256)/174;q=nx*nx+ny*ny;inside=q<=1;nz=np.sqrt(np.maximum(0,1-q))
lon=np.arctan2(nx,nz)+.35;lat=np.arcsin(np.clip(-ny,-1,1));u=((lon/(2*np.pi)+.5)*a.shape[1]).astype(int)%a.shape[1];v=np.clip(((.5-lat/np.pi)*a.shape[0]).astype(int),0,a.shape[0]-1)
shade=np.clip(-nx*.3-ny*.3+nz*.85,.14,1);pixels=np.zeros((s,s,3),dtype=np.uint8);pixels[:]=(7,16,28);pixels[inside]=(a[v,u]*shade[...,None])[inside].astype('uint8');im=Image.fromarray(pixels)
d=ImageDraw.Draw(im);d.ellipse((80,80,432,432),outline=(89,179,230),width=3)
for size in [192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(root/'public'/f'icon-{size}.png')
im.save(root/'public'/'icon-maskable.png')
print('Assets',[(p.name,round(p.stat().st_size/1024)) for p in out.iterdir() if p.suffix!='.original'])
