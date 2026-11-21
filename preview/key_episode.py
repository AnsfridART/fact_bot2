"""Kitchen set, seamster rig and beat-driven animation for the key story."""
import json, sys
from pathlib import Path
import bpy, math, os
from mathutils import Vector
from math import radians as rad

b = bpy
b.ops.wm.read_factory_settings(use_empty=True)
sc = b.context.scene
def mat(name, color, metallic=0):
    m=b.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=.48
    p.inputs['Metallic'].default_value=metallic
    return m
wood=mat('Honey oak',(.41,.16,.055)); teal=mat('Painted kitchen',(.08,.37,.32))
blue=mat('Indigo evening',(.022,.052,.19)); cream=mat('Wool',(.85,.66,.4))
ink=mat('Espresso',(.045,.022,.025)); gold=mat('Brass',(.85,.46,.065),.55)
brick=mat('Terracotta',(.68,.17,.075)); skin=mat('Warm clay',(.82,.44,.25))
white=mat('Porcelain',(.96,.87,.63)); red=mat('Carmine thread',(.62,.045,.034))
def finish(name, material, parent):
    o=b.context.object;o.name=name;o.data.materials.append(material);o.parent=parent
    return o
def box(name, pos, dims, material, bevel=.045, parent=None):
    b.ops.mesh.primitive_cube_add(size=1,location=pos);o=finish(name,material,parent)
    o.dimensions=dims;b.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=4
    o.modifiers.new('Weighted faces','WEIGHTED_NORMAL')
    return o
def ball(name,pos,scale,material,parent=None):
    b.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=pos)
    o=finish(name,material,parent);o.scale=scale
    for p in o.data.polygons:p.use_smooth=True
    return o
def joint(name,pos,parent=None):
    o=b.data.objects.new(name,None);sc.collection.objects.link(o);o.location=pos;o.parent=parent;return o
def anim(o,prop,axis,points):
    for frame,value in points:
        getattr(o,prop)[axis]=value;o.keyframe_insert(data_path=prop,index=axis,frame=frame)
for j in range(8):
    for i in range(4):
        box('Floorboard',((i-1.5)*2.8+(j%2)*.65,j*.67-3,-.12),(2.79,.665,.21),wood,.016)
box('Cabinet wall',(0,2.1,2.3),(10,.28,4.6),teal)
box('Window',(0,1.91,3.45),(3.8,.13,2),blue)
for i in range(11):
    for j in range(3):
        if (i*3+j*7)%5<2: box('City window',(-1.65+i*.31,1.827,2.77+j*.32),(.085,.02,.14),gold,.012)
for x in [-1.95,0,1.95]:box('Window frame',(x,1.80,3.45),(.10,.13,2.15),wood)
box('Sill',(0,1.72,2.40),(4.15,.44,.14),wood)
box('Miniature doorway',(.93,1.88,.96),(1.56,.26,2.03),wood,.18)
box('Door recess',(.93,1.7,.94),(1.33,.09,1.83),ink,.15)
# The neighbor is a little seamster in a thimble-shaped knit cap.
body=joint('Seamster',(.78,.72,.03))
legs=[]
for x in [-.17,.17]:
    hip=joint('Hip',(x,0,.34),body)
    ball('Trouser leg',(0,0,-.085),(.12,.115,.17),blue,hip)
    shoe=ball('Slipper',(0,-.075,-.22),(.155,.20,.10),brick,hip)
    legs.append(hip)
box('Quilted smock',(0,0,.50),(.68,.47,.68),teal,.17,body)
for z in [.47,.62]:ball('Button',(0,-.24,z),(.035,.025,.035),gold,body)
head=joint('Head pivot',(0,0,.81),body)
ball('Face',(0,0,.23),(.43,.33,.39),skin,head)
ball('Nose',(0,-.31,.18),(.088,.079,.064),skin,head)
for x in [-.16,.16]:
    ball('Eye',(x,-.291,.27),(.057,.044,.08),ink,head)
    ball('Catchlight',(x-.014,-.33,.30),(.015,.012,.016),white,head)
    brow=ball('Brow',(x,-.292,.395),(.089,.027,.023),ink,head);brow.rotation_euler.y=x
ball('Cap',(0,.013,.51),(.46,.35,.23),cream,head)
for i in range(28):
    a=i*math.tau/28
    ball('Knit rib',(.424*math.cos(a),.32*math.sin(a),.455),(.046,.043,.087),cream,head)
ball('Pom',(.10,.04,.745),(.105,.10,.11),brick,head)

arms=[]
for sign in [-1,1]:
    shoulder=joint('Shoulder',(sign*.32,0,.71),body)
    ball('Upper sleeve',(0,0,-.14),(.132,.136,.21),teal,shoulder)
    elbow=joint('Elbow',(0,0,-.29),shoulder)
    ball('Cuff',(0,0,-.09),(.117,.12,.145),cream,elbow)
    palm=ball('Mitten',(0,-.025,-.225),(.112,.12,.13),skin,elbow)
    ball('Thumb',(-sign*.075,-.06,-.18),(.068,.068,.09),skin,elbow)
    arms.append((shoulder,elbow,palm))
key=joint('Key',(.30,.47,.57))
b.ops.mesh.primitive_torus_add(location=(0,0,0),rotation=(rad(90),0,0),major_radius=.157,minor_radius=.042)
finish('Key ring',gold,key)
box('Key stem',(-.27,0,-.07),(.35,.078,.076),gold,.019,key)
for x in [-.41,-.34]:box('Tooth',(x,0,-.124),(.045,.076,.12),gold,.012,key)

basket=joint('Lift basket',(0,0,0))
box('Base',(0,0,.06),(1.08,.72,.12),wood,.055,basket)
box('Blanket',(0,0,.14),(.96,.6,.08),brick,.05,basket)
for sign in [-1,1]:
    box('Side',(sign*.51,0,.21),(.07,.68,.33),wood,.025,basket)
    box('Rope',(sign*.48,0,2.45),(.033,.033,4.6),red,.013,basket)
    box('Rim',(0,sign*.32,.19),(1.02,.05,.16),gold,.025,basket)
bag=joint('Travel bag',(0,0,.2),basket)
box('Canvas bag',(0,0,.17),(.48,.35,.34),teal,.095,bag)
box('Patch',(.08,-.18,.18),(.13,.025,.12),brick,.018,bag)
for x in [-.09,.09]:box('Handle leg',(x,0,.38),(.04,.05,.15),cream,.017,bag)
box('Handle',(0,0,.45),(.22,.055,.05),cream,.016,bag)
def area(name,loc,color,power,size,aim):
    b.ops.object.light_add(type='AREA',location=loc);o=b.context.object;o.name=name
    o.data.color=color;o.data.energy=power;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector(aim)-o.location).to_track_quat('-Z','Y').to_euler()
area('Under-cabinet lamp',(-2,-2,3.4),(1,.61,.32),360,3,(0,.6,.7))
area('Blue window rim',(2,1.4,3.6),(.31,.52,1),260,2,(.7,.5,.8))
area('Bounce',(1,-3,2),(.95,.82,.7),115,3,(.8,.7,.9))
b.ops.object.camera_add(location=(-1.35,-5.4,2.0));cam=b.context.object;sc.camera=cam

from math import sin, cos, pi
def smooth(u):
    u=max(0,min(1,u));return u*u*(3-2*u)
def ramp(u,a,b):return smooth((u-a)/(b-a))
def mix(a,b,p):return a+(b-a)*p
def key_pose(obj,frame):
    for prop in ('location','rotation_euler','scale'):
        obj.keyframe_insert(data_path=prop,frame=frame)
plans=json.loads(Path('plan.json').read_text())
selected=int(os.environ['SHOT'])
kind,start,end=plans[selected]
cam.data.lens=43
for frame in range(start,end+1):
    u=(frame-start)/max(1,end-start); t=(frame-start)/20
    x=.4; z=.035; lean=0; stride=0; crouch=0; lift=0; wave=0
    bx=-1.35; bz=4.5; bag_visible=False
    loose=False; deposited=False
    if kind=='catch':
        loose=True
        q=ramp(t,0,1.05)
        kx=mix(-1.25,.18,q);kz=.18+.13*abs(sin(q*3*pi))*(1-q)
        crouch=.10*ramp(t,.8,1.15);stride=-.65*sin(pi*ramp(t,.48,1.4))
        lean=.18*ramp(t,.4,.85)
    elif kind=='lift':
        crouch=.24*(ramp(u,.03,.22)-ramp(u,.46,.61))
        lift=ramp(u,.35,.68); lean=.27*(1-lift)
    elif kind=='walk':
        q=ramp(u,.03,.78);x=mix(.4,-.55,q)
        stride=.83*sin(q*6*pi); z+=.08*abs(stride)
        lean=.28*sin(pi*ramp(u,.49,.62));lift=.90
    elif kind in ('basket','load'):
        x=-.55;lift=1
        if kind=='basket':bz=mix(4.5,0,ramp(u,.05,.49))
        else:
            reach=ramp(u,.05,.35)
            x-=.42*reach
            crouch=.17*(reach-ramp(u,.50,.62))
            lift=1-.68*reach
            deposited=u>=.38
            bz=3.75*ramp(u,.53,.8)
            z+=.34*sin(pi*ramp(u,.82,.93))
            wave=ramp(u,.60,.70)
    elif kind=='return':
        x=-.92;bag_visible=True;bz=mix(3.75,0,ramp(u,.13,.51))
        crouch=.20*(1-ramp(u,.12,.28));wave=ramp(u,.5,.64)
    else:
        bag_visible=True;bz=0
        q=ramp(u,.03,.37) if kind=='choice' else 1
        x=mix(-.9,-1.37,q);z+=.45*sin(pi*q)+.20*q
        wave=.6
    basket.location=(bx,.06,bz)
    bag.location.x=.36 if kind in ('choice','end') else 0
    bag.scale=(1,1,1) if bag_visible else (.0001,)*3
    body.location=(x,.45,z-crouch*.40)
    body.rotation_euler=(crouch*.95,lean,.08*sin(t*1.6))
    head.rotation_euler=(.17*cos(t*1.9)+crouch,.08*sin(t*2.1),.50*sin(t*1.4))
    if kind in ('choice','end'):head.rotation_euler.z=.65*sin(t*1.65)
    for i,leg in enumerate(legs):
        side=2*i-1
        leg.rotation_euler=(stride*side*.72-crouch*.6,side*.09,0)
    for i,(sh,el,palm) in enumerate(arms):
        side=2*i-1
        sh.rotation_euler=(-.25-.78*lift+side*stride*.27-.60*wave*(1+.45*sin(t*4)),side*(.16-.31*lift),0)
        el.rotation_euler=(-.45-.68*lift-.17*sin(t*2.3+i),0,0)
    b.context.view_layer.update()
    grip=arms[0][2].matrix_world.translation
    if loose:
        key.location=(kx,.20,kz);key.rotation_euler=(0,1.35+q*6.28,0)
    elif kind=='lift':
        q=ramp(u,.14,.60)
        key.location=Vector((.18,.20,.18)).lerp(grip,q);key.rotation_euler=(0,mix(1.35,.1,q),0)
    elif kind in ('walk','basket') or (kind=='load' and not deposited):
        key.location=grip;key.rotation_euler=(0,.1+.18*stride,0)
        if kind=='load':
            key.location=grip.lerp(Vector((bx+.20,.03,.27)),ramp(u,.18,.38))
    else:
        key.location=(bx+.20,.03,bz+.27 if kind=='load' else 9)
        key.rotation_euler=(0,.08,0)
    # Cut on a gesture to a full-body or insert camera; keep the hands above captions.
    detail=(u<.34) if kind in ('catch','lift','return') else (.46<u<.76)
    target_x=(x*.68+bx*.32 if kind in ('basket','load','return','choice','end') else x)
    if kind=='catch' and detail:target_x=-.19
    aim=Vector((target_x,.38,.84 if detail else 1.02))
    cam.location=(target_x+(-1.25 if detail else 1.00),-3.0 if detail else -4.4,1.52 if detail else 2.08)
    cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler()
    for obj in [cam,body,head,key,basket,bag,*legs,*[o for row in arms for o in row[:2]]]:
        key_pose(obj,frame)
sc.render.engine='CYCLES';sc.cycles.samples=6;sc.cycles.use_denoising=False
sc.world=b.data.worlds.new('Evening');sc.world.color=(.15,.15,.18)
sc.render.resolution_x=432;sc.render.resolution_y=768;sc.render.resolution_percentage=100
sc.render.fps=20;sc.frame_start=start;sc.frame_end=end
sc.render.image_settings.file_format='PNG'
os.makedirs('frames',exist_ok=True)
sc.render.filepath=os.path.abspath('frames/f')
b.ops.render.render(animation=True)
