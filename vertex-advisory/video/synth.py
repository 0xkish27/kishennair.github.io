import numpy as np, wave, sys
SR=48000
def tone(f,d,dec=None,shape='sine'):
    t=np.arange(int(SR*d))/SR
    w=np.sin(2*np.pi*f*t)+0.3*np.sin(4*np.pi*f*t)*(shape!='sine')+0.12*np.sin(6*np.pi*f*t)*(shape!='sine')
    env=np.exp(-t*dec) if dec else np.ones_like(t)
    a=np.minimum(1,t/0.008);return w*env*a
def place(buf,sig,at,g=1,pan=0.):
    i=int(at*SR);n=min(len(sig),len(buf)-i)
    if n<=0:return
    buf[i:i+n,0]+=sig[:n]*g*(1-pan)*0.5*2**.5;buf[i:i+n,1]+=sig[:n]*g*(1+pan)*0.5*2**.5
def pad(buf,freqs,a,b,g=.05):
    d=b-a;t=np.arange(int(SR*d))/SR;env=np.minimum(1,np.minimum(t/1.2,(d-t)/1.2)).clip(0)
    for k,f in enumerate(freqs):
        for det,pan in((0.997,-.6),(1.003,.6)):
            place(buf,np.sin(2*np.pi*f*det*t+k)*env,a,g/len(freqs)*2,pan)
def kick(buf,at,g=.5):
    t=np.arange(int(SR*.35))/SR;f=50+90*np.exp(-t*30);ph=2*np.pi*np.cumsum(f)/SR
    place(buf,np.sin(ph)*np.exp(-t*9),at,g)
def hat(buf,at,g=.05):
    t=np.arange(int(SR*.06))/SR;n=np.random.randn(len(t));n=np.diff(np.concatenate([[0],n]))
    place(buf,n*np.exp(-t*70),at,g,np.random.uniform(-.4,.4))
def reverb(x,mix=.25):
    y=x.copy()
    for dl,g in((0.089,.5),(0.137,.42),(0.211,.33),(0.293,.25),(0.377,.18)):
        n=int(dl*SR);y[n:]+=x[:-n]*g*np.array([1,.8]) if False else 0
        y[n:,0]+=x[:-n,1]*g*mix*2;y[n:,1]+=x[:-n,0]*g*mix*2
    return y
def fin(buf,name,fi=1.5,fo=3):
    n=len(buf);t=np.arange(n)/SR;D=n/SR
    env=np.minimum(1,np.minimum(t/fi,(D-t)/fo)).clip(0);buf*=env[:,None]
    buf=reverb(buf);buf/=np.abs(buf).max()/0.8
    w=wave.open(name,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((buf*32767).astype('<i2').tobytes());w.close()
N=lambda m:440*2**((m-69)/12)
np.random.seed(3)
# 1) Intro: cinematic, slow piano-like arpeggios over pads (D major-ish), 39s
D=39;b=np.zeros((SR*D,2))
chords=[[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61]]
for i in range(11):
    c=chords[i%4];a=i*3.8;pad(b,[N(m) for m in c],a,a+4.6,.05)
    place(b,tone(N(c[0]-12),3.8,1.2),a,.18)
    for j,m in enumerate([c[1],c[2],c[3],c[2]+12,c[3],c[2]]):
        if a+j*.6<D-2:place(b,tone(N(m+12),2.5,3.2,'rich'),a+j*.6+.05,.07,(-.5+j*.2))
fin(b,'m_intro.wav',2,3)
# 2) Vertical: uptempo 104bpm, kick/hat, bass, stabs, 39s
D=39;b=np.zeros((SR*D,2));bt=60/104
prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]
for bar in range(int(D/(bt*4))+1):
    c=prog[bar%4];a=bar*bt*4
    pad(b,[N(m) for m in c],a,a+bt*4+.6,.035)
    for q in range(4):
        tt=a+q*bt
        if tt>D-1:continue
        if bar>=1:kick(b,tt,.42)
        hat(b,tt+bt/2,.05 if bar>=1 else .02)
        place(b,tone(N(c[0]-24),bt*.9,4,'rich'),tt,.16)
        if q in(1,3) and bar>=2:place(b,tone(N(c[2]+12),.4,8,'rich'),tt+bt*.5,.06,.3)
    place(b,tone(N(c[1]+12),bt*2,2.5,'rich'),a,.05,-.3)
fin(b,'m_vert.wav',1,2.5)
# 3) X: tense ticking + low drone, lift at 8s, groove at 12s, resolve at 18s, 23s
D=23;b=np.zeros((SR*D,2))
t=np.arange(SR*8)/SR;place(b,np.sin(2*np.pi*N(38)*t)*np.minimum(1,t/2)*.6+np.sin(2*np.pi*N(45)*1.002*t)*.25,0,.25)
for k in range(int(8/.25)):hat(b,k*.25,.04+.03*(k%4==0))
for k in range(16):place(b,tone(N(69+ (k%4)*0),.12,30),k*.5,.03,(k%2)*.6-.3)
# riser
t=np.arange(int(SR*1.6))/SR;f=200+1400*(t/1.6)**2;place(b,np.random.randn(len(t))*0.15*(t/1.6)**2+np.sin(2*np.pi*np.cumsum(f)/SR)*0.05*(t/1.6),6.4,1)
pad(b,[N(m) for m in [62,66,69,74]],8,12.4,.06)
place(b,tone(N(38),3,1),8,.25)
bt=60/112
for i in range(int((18-12)/bt)):
    tt=12+i*bt;kick(b,tt,.42);hat(b,tt+bt/2,.05)
    m=[62,66,69,73][(i//2)%4];place(b,tone(N(m+12),.5,7,'rich'),tt,.06,.25)
    place(b,tone(N([38,42,45,40][(i//4)%4]),bt*.9,4,'rich'),tt,.18)
pad(b,[N(m) for m in [50,57,62,66,69]],18,23,.07)
place(b,tone(N(38),4,.8),18,.3)
for j,m in enumerate([74,78,81,86]):place(b,tone(N(m),2.5,2.5,'rich'),18.1+j*.18,.06,-.4+j*.25)
fin(b,'m_x.wav',.6,2)
