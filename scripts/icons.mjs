import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
function crc(buf) { let c=0xffffffff; for (const b of buf) { c^=b; for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0); } return (c^0xffffffff)>>>0; }
function chunk(type,data) { const t=Buffer.from(type), size=Buffer.alloc(4), sum=Buffer.alloc(4); size.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([t,data]))); return Buffer.concat([size,t,data,sum]); }
const lines=[[41,100,41,30],[41,30,87,30],[87,30,87,91],[87,91,48,91],[48,91,41,97],[41,97,48,104],[48,104,87,104],[52,44,75,44],[52,57,70,57]];
await mkdir('public/icons',{recursive:true});
for(const size of [16,32,48,128]) {
  const pixels=Buffer.alloc(size*(size*4+1));
  for(let y=0;y<size;y++) { pixels[y*(size*4+1)]=0; for(let x=0;x<size;x++) {
    const out=[0,0,0,0];
    for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++) {
      const px=(x+(sx+.5)/4)/size*128,py=(y+(sy+.5)/4)/size*128;
      const dx=Math.max(15-px,0,px-113),dy=Math.max(15-py,0,py-113); const inside=dx*dx+dy*dy<=15*15;
      let ink=false; for(const [ax,ay,bx,by] of lines) { const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy))); if(Math.hypot(px-ax-t*vx,py-ay-t*vy)<2.5)ink=true; }
      const color=ink?[245,241,232]:[63,85,68]; for(let i=0;i<3;i++)out[i]+=color[i]/16;out[3]+=(inside?255:0)/16;
    }
    for(let i=0;i<4;i++)pixels[y*(size*4+1)+1+x*4+i]=Math.round(out[i]);
  }}
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  await writeFile(`public/icons/${size}.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
}
