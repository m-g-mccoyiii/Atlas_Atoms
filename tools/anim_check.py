#!/usr/bin/env python3
"""anim_check.py: an automatic look at a recorded take, for jumps, frozen stretches and the hand-over at home.

  python tools/anim_check.py SRC --ffmpeg PATH [options]

  SRC            a clip (.mp4, .webm, ...) or a folder of frames f00000.jpg, f00001.jpg, ... (the recorder's frames/<name>)
  --ffmpeg PATH  the ffmpeg program (on this machine:
                 C:/Users/mgmcc/AppData/Local/Programs/Python/Python312/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe)
  --crop X,Y,W,H the box (in the frame's own pixels) where the creature is, for the frozen list (default: the whole frame)
  --on A:B       the frames in which the creature is on screen and must move (default: all)
  --home X,Y,W,H the home spot; the first and last 15 frames are tiled on it into --tiles (default: no tiles)
  --tiles OUT    the jpg for those tiles (two rows: the first 15 frames, the last 15)
  --k 2.2        a jump is a frame whose difference is over k times the mean of its two neighbours ...
  --floor 0.6    ... and over this much (mean grey levels of 255), so that noise on a still page is not a jump
  --cut 25       a difference at or over this is a cut (to a number card, about 30) and is not counted
  --key 250      every this many frames an encoder keyframe may jump: not counted (clips only; 0: none)
  --freeze 10    a frozen stretch is at least this many frames ...
  --still 0.15   ... in which the crop box changes by less than this from frame to frame
  --w 320        the width the frames are looked at (smaller is faster)

Prints the jump list (frame, difference, its neighbours, kind), the frozen list (from, to, frames), and a line of
numbers. Exit code 1 if any real jump is found, else 0.

Examples
  python tools/anim_check.py .claude/r105/frames/m1k --ffmpeg "$FF" --crop 300,250,500,450 --home 900,420,300,300 --tiles m1k_home.jpg
  python tools/anim_check.py take.mp4 --ffmpeg "$FF" --on 30:260
"""
import argparse, os, re, subprocess, sys


def box(s):
    v = [int(float(x)) for x in s.split(',')]
    if len(v) != 4:
        raise argparse.ArgumentTypeError('X,Y,W,H')
    return v


def source(src):
    """the ffmpeg input arguments, the first frame number, and whether it is a clip"""
    if os.path.isdir(src):
        fs = sorted(f for f in os.listdir(src) if re.match(r'^f\d{5}\.jpg$', f))
        if not fs:
            sys.exit('no frames f00000.jpg ... in ' + src)
        n0 = int(fs[0][1:6])
        return ['-start_number', str(n0), '-framerate', '30', '-i', os.path.join(src, 'f%05d.jpg')], n0, False, len(fs)
    return ['-i', src], 0, True, None


def size(ff, inp):
    p = subprocess.run([ff, '-hide_banner'] + inp, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    m = re.search(rb'Video:.*?(\d{2,5})x(\d{2,5})', p.stderr)
    if not m:
        sys.exit('ffmpeg could not read the source:\n' + p.stderr.decode('utf8', 'replace')[-800:])
    return int(m.group(1)), int(m.group(2))


def frames(ff, inp, vf, w, h):
    """every frame as grey bytes w by h, after the filter vf"""
    cmd = [ff, '-hide_banner', '-loglevel', 'error'] + inp + ['-vf', vf + ',scale=%d:%d:flags=area,format=gray' % (w, h), '-f', 'rawvideo', '-pix_fmt', 'gray', '-']
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode:
        sys.exit('ffmpeg failed: ' + p.stderr.decode('utf8', 'replace')[-800:])
    n = w * h
    b = p.stdout
    return [b[i:i + n] for i in range(0, len(b) - n + 1, n)]


def diffs(F):
    """mean absolute difference of each frame from the one before (grey levels); d[0] = 0"""
    d = [0.0]
    for i in range(1, len(F)):
        a, b = F[i - 1], F[i]
        d.append(sum(abs(x - y) for x, y in zip(a, b)) / len(a))
    return d


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('src')
    ap.add_argument('--ffmpeg', required=True)
    ap.add_argument('--crop', type=box)
    ap.add_argument('--home', type=box)
    ap.add_argument('--tiles')
    ap.add_argument('--on')
    ap.add_argument('--k', type=float, default=2.2)
    ap.add_argument('--floor', type=float, default=0.6)
    ap.add_argument('--cut', type=float, default=25.0)
    ap.add_argument('--key', type=int, default=250)
    ap.add_argument('--freeze', type=int, default=10)
    ap.add_argument('--still', type=float, default=0.15)
    ap.add_argument('--w', type=int, default=320)
    a = ap.parse_args()
    ff = a.ffmpeg
    inp, n0, clip, _ = source(a.src)
    W, H = size(ff, inp)
    w = a.w
    h = max(2, int(round(w * H / W / 2)) * 2)

    # (1) the jump list, on the whole picture
    F = frames(ff, inp, 'null', w, h)
    n = len(F)
    d = diffs(F)
    jumps, cuts, keys = [], [], []
    for i in range(2, n - 1):
        nb = (d[i - 1] + d[i + 1]) / 2
        if d[i] >= a.cut:
            cuts.append(i)
            continue
        if d[i] > a.k * nb and d[i] > a.floor:
            if clip and a.key and i % a.key == 0:
                keys.append(i)
                continue
            # the frame after a cut is often a jump against the card: not counted
            if d[i - 1] >= a.cut or d[i + 1] >= a.cut:
                cuts.append(i)
                continue
            jumps.append((i, d[i], d[i - 1], d[i + 1]))
    print('frames %d (%dx%d, looked at %dx%d), first frame number %d' % (n, W, H, w, h, n0))
    print('mean difference %.2f, largest %.2f at %d' % (sum(d) / max(1, n - 1), max(d), n0 + d.index(max(d))))
    print('JUMPS (frame: difference / before, after):' + ('' if jumps else ' none'))
    for i, x, b, c in jumps:
        print('  %5d: %.2f / %.2f, %.2f  (%.1f times)' % (n0 + i, x, b, c, x / max(1e-6, (b + c) / 2)))
    if cuts:
        print('  (cuts, not counted: %s)' % ', '.join(str(n0 + i) for i in cuts[:20]))
    if keys:
        print('  (keyframes, not counted: %s)' % ', '.join(str(n0 + i) for i in keys))

    # (2) the frozen list, inside the crop box, while the creature is on screen
    if a.crop:
        x, y, cw, ch = a.crop
        cw2 = 160
        chh = max(2, int(round(cw2 * ch / max(1, cw) / 2)) * 2)
        Fc = frames(ff, inp, 'crop=%d:%d:%d:%d' % (cw, ch, x, y), cw2, chh)
        dc = diffs(Fc)
    else:
        dc = d
    lo, hi = 0, n - 1
    if a.on:
        p = a.on.split(':')
        lo = max(0, int(p[0]) - n0) if p[0] else 0
        hi = min(n - 1, int(p[1]) - n0) if len(p) > 1 and p[1] else n - 1
    froz, run = [], None
    for i in range(max(1, lo), hi + 1):
        if dc[i] < a.still:
            run = run if run is not None else i
        else:
            if run is not None and i - run >= a.freeze:
                froz.append((run, i - 1))
            run = None
    if run is not None and hi + 1 - run >= a.freeze:
        froz.append((run, hi))
    print('FROZEN (%s, %d+ frames under %.2f):' % ('crop %s' % a.crop if a.crop else 'whole frame', a.freeze, a.still) + ('' if froz else ' none'))
    for s, e in froz:
        print('  %5d .. %5d  (%d frames, mean %.3f)' % (n0 + s, n0 + e, e - s + 1, sum(dc[s:e + 1]) / (e - s + 1)))
    cm = [dc[i] for i in range(max(1, lo), hi + 1)]
    print('crop: mean change %.2f, least %.3f' % (sum(cm) / max(1, len(cm)), min(cm) if cm else 0))

    # (3) the first and last 15 frames, tiled on the home spot
    if a.home and a.tiles:
        x, y, hw, hh = a.home
        k = min(15, n // 2)
        tw = 160
        th = max(2, int(round(tw * hh / max(1, hw) / 2)) * 2)
        sel = "select='lt(n\\,%d)+gte(n\\,%d)'" % (k, n - k)
        vf = '%s,crop=%d:%d:%d:%d,scale=%d:%d,tile=%dx2' % (sel, hw, hh, x, y, tw, th, k)
        p = subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y'] + inp + ['-vf', vf, '-frames:v', '1', '-q:v', '3', a.tiles], stderr=subprocess.PIPE)
        print('tiles: %s (%s)' % (a.tiles, 'ok' if p.returncode == 0 and os.path.exists(a.tiles) else p.stderr.decode('utf8', 'replace')[-300:]))

    print('RESULT jumps %d frozen %d cuts %d' % (len(jumps), len(froz), len(cuts)))
    sys.exit(1 if jumps else 0)


if __name__ == '__main__':
    main()
