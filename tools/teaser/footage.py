"""Cuts real video footage into the teaser's shots: trims each source, reframes it to 1080x1920 around a chosen
point, grades it blood-red and near-black, and screen-blends real embers (and mist where asked) over it.
Usage: python3 tools/teaser/footage.py <footageDir> <outClipsDir>   (shots are listed in timeline.json "footage")"""
import json, os, subprocess, sys
TL = json.load(open(os.path.join(os.path.dirname(__file__), 'timeline.json')))
src, out = sys.argv[1:3]; os.makedirs(out, exist_ok=True)
W, H, FPS = 1080, 1920, TL['fps']
# night footage is sodium-orange; pull it toward crimson and near-black
LOOK = ('eq=contrast=1.14:brightness=-0.035:saturation=0.78:gamma=0.92,'
        'colorbalance=rs=0.13:gs=-0.035:bs=-0.025:rm=0.09:gm=-0.03:bm=-0.04:rh=0.05:gh=-0.01:bh=-0.02,'
        'unsharp=5:5:0.6')
OV = TL.get('overlays', {})
for i, (d, sh) in enumerate(zip(TL['shots'], TL['footage'])):
    ins = ['-ss', str(sh['ss']), '-t', str(d + .1), '-i', os.path.join(src, sh['src'])]
    x = sh.get('x', .5); zoom = sh.get('zoom', [1, 1])
    # crop a 9:16 window around x, with an optional slow push (zoom[0] -> zoom[1]) over the shot
    z = f"({zoom[0]}+({zoom[1]}-{zoom[0]})*t/{d})"
    f = [f"[0:v]fps={FPS},scale=-2:{H}:flags=lanczos,crop={W}:{H}:x='(iw-ow)*{x}':y=0,"
         f"scale=w='trunc({W}*{z}/2)*2':h='trunc({H}*{z}/2)*2':eval=frame:flags=bicubic,crop={W}:{H},"
         f"setsar=1,{LOOK}[base]"]
    k, last = 1, 'base'
    for name, opac in (('embers', sh.get('embers', .55)), ('mist', sh.get('mist', 0))):
        if not opac or name not in OV: continue
        ins += ['-stream_loop', '-1', '-ss', str(OV[name].get('ss', 0) + i * 1.7), '-t', str(d + .1), '-i', os.path.join(src, OV[name]['src'])]
        f.append(f"[{k}:v]fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,format=gbrp[o{k}]")
        f.append(f"[{last}]format=gbrp[b{k}];[b{k}][o{k}]blend=all_mode=screen:all_opacity={opac}[m{k}]"); last = f'm{k}'; k += 1
    f.append(f"[{last}]trim=duration={d},setpts=PTS-STARTPTS,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', ';'.join(f), '-map', '[v]', '-an',
                    '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', os.path.join(out, f'{i + 1}.mp4')], check=True)
    print(f'shot {i + 1}: {sh["src"]} @ {sh["ss"]}s for {d}s')
