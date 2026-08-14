from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SOURCE = Path(r"C:\Users\ASUS\Downloads\ChatGPT Image 13 ส.ค. 2569 22_26_24.png")
OUT = Path(r"C:\Users\ASUS\Documents\Codex\2026-08-12\referenced-chatgpt-conversation-this-is-an\outputs\assets\obstacles\stages")
NAMES = [
 "01_pathum_ratt","02_phon_sai","03_nong_hi","04_nong_phok","05_moei_wadi",
 "06_phanom_phrai","07_pho_chai","08_suwannaphum","09_kaset_wisai","10_phon_thong",
 "11_at_samat","12_selaphum","13_si_somdet","14_chaturaphak_phiman","15_mueang_suang",
 "16_thung_khao_luang","17_chiang_khwan","18_thawat_buri","19_changhan","20_mueang_roi_et"
]
# Local coordinates inside each 307.2 x 256 source panel. The left-hand source object
# in each JUMP and SLIDE row is intentionally selected to produce one gameplay asset per type.
JUMP = [(31,58,143,153),(35,63,111,151),(25,82,154,154),(29,62,116,153),(18,68,151,154),
        (14,73,158,158),(18,70,151,161),(29,75,120,161),(7,66,153,162),(8,70,159,163),
        (9,61,153,166),(8,78,155,163),(7,82,157,167),(18,78,145,166),(5,68,158,165),
        (5,59,161,161),(5,67,160,165),(8,68,157,167),(5,82,164,167),(22,66,126,170)]
SLIDE = [(13,171,158,224),(28,159,126,232),(7,164,158,223),(5,163,163,219),(7,166,165,222),
         (4,170,160,232),(7,167,158,230),(8,170,161,232),(5,165,163,230),(14,170,156,229),
         (5,169,160,233),(5,167,160,231),(4,170,160,229),(6,169,160,232),(5,167,160,230),
         (5,170,160,234),(7,171,158,229),(7,170,160,233),(8,168,158,229),(8,170,158,232)]

def edge_background_mask(rgb):
    """Flood smoothly varying edge-connected scenery, stopping at the dark object outline."""
    a = np.asarray(rgb).astype(np.int16)
    h, w = a.shape[:2]
    bg = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h-1))
    for y in range(h):
        q.append((0, y)); q.append((w-1, y))
    while q:
        x, y = q.popleft()
        if bg[y, x]: continue
        bg[y, x] = True
        p = a[y, x]
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or bg[ny,nx]: continue
            d = np.abs(a[ny,nx] - p)
            # Smooth painted scenery floods; inked cartoon outlines stop the flood.
            if int(d.max()) <= 24 and int(d.sum()) <= 45:
                q.append((nx, ny))
    fg = (~bg).astype(np.uint8) * 255
    # Remove tiny isolated print/arrow fragments and retain substantial components.
    seen = np.zeros_like(bg)
    keep = np.zeros_like(bg)
    comps = []
    for y in range(h):
        for x in range(w):
            if fg[y,x] == 0 or seen[y,x]: continue
            qq=[(x,y)]; seen[y,x]=True; pts=[]
            while qq:
                px,py=qq.pop(); pts.append((px,py))
                for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
                    if 0<=nx<w and 0<=ny<h and fg[ny,nx] and not seen[ny,nx]:
                        seen[ny,nx]=True; qq.append((nx,ny))
            comps.append(pts)
    # The requested asset is the dominant illustrated object. Labels, arrows,
    # scenery slivers and panel decorations form smaller disconnected components.
    comps.sort(key=len, reverse=True)
    if comps:
        main = comps[0]
        for x,y in main: keep[y,x]=True
    mask = Image.fromarray(keep.astype(np.uint8)*255, 'L').filter(ImageFilter.GaussianBlur(.45))
    return mask

def export_asset(src, panel, box, destination):
    col, row = panel % 5, panel // 5
    x0 = round(col * src.width / 5); y0 = round(row * src.height / 4)
    sx = src.width / 1536; sy = src.height / 1024
    l,t,r,b = box
    crop = src.crop((round(x0+l*sx), round(y0+t*sy), round(x0+r*sx), round(y0+b*sy))).convert('RGB')
    mask = edge_background_mask(crop)
    rgba = crop.convert('RGBA'); rgba.putalpha(mask)
    alpha = rgba.getchannel('A'); bbox = alpha.getbbox()
    if not bbox: raise RuntimeError(f"Empty extraction: {destination}")
    rgba = rgba.crop(bbox)
    max_side = 472
    scale = min(max_side/rgba.width, max_side/rgba.height)
    rgba = rgba.resize((max(1,round(rgba.width*scale)),max(1,round(rgba.height*scale))), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA',(512,512),(0,0,0,0))
    canvas.alpha_composite(rgba,((512-rgba.width)//2,(512-rgba.height)//2))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)

def main():
    src = Image.open(SOURCE).convert('RGB')
    if src.size != (1536,1024): raise RuntimeError(f"Unexpected source size {src.size}")
    for i, name in enumerate(NAMES):
        folder = OUT / name
        export_asset(src, i, JUMP[i], folder/'jump.png')
        export_asset(src, i, SLIDE[i], folder/'slide.png')
    sheet = Image.new('RGBA',(1000,1600),(24,35,48,255))
    draw = ImageDraw.Draw(sheet)
    for i,name in enumerate(NAMES):
        for kind_index,kind in enumerate(('jump','slide')):
            asset=Image.open(OUT/name/f'{kind}.png').convert('RGBA').resize((142,142),Image.Resampling.LANCZOS)
            x=(i%5)*200+28; y=(i//5)*400+30+kind_index*180
            sheet.alpha_composite(asset,(x,y))
            draw.text((i%5*200+8,y+144),f'{i+1:02d} {kind}',fill=(255,255,255,255))
    sheet.save(OUT/'_contact_sheet.png')
    print(f"Exported {len(NAMES)*2} assets to {OUT}")

if __name__ == '__main__': main()
