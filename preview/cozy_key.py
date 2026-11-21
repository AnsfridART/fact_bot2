"""Standalone eight-second miniature animation. Run with Blender in background."""
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
for x in [-.19,.19]:ball('Slipper',(x,-.035,.12),(.18,.24,.12),brick,body)
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
for x in [-.37,.37]:ball('Sleeve',(x,-.03,.61),(.155,.14,.20),teal,body)
hand=ball('Hand',(-.41,-.21,.56),(.125,.13,.14),skin,body)
key=joint('Key',(.30,.47,.57))
b.ops.mesh.primitive_torus_add(location=(0,0,0),rotation=(rad(90),0,0),major_radius=.157,minor_radius=.042)
finish('Key ring',gold,key)
box('Key stem',(-.27,0,-.07),(.35,.078,.076),gold,.019,key)
for x in [-.41,-.34]:box('Tooth',(x,0,-.124),(.045,.076,.12),gold,.012,key)
anim(head,'rotation_euler',2,[(1,.16),(28,.16),(47,-.48),(91,-.48),(119,-.16),(144,-.12)])
anim(head,'rotation_euler',1,[(1,.04),(47,-.12),(93,-.12),(115,.11),(144,.07)])
anim(body,'location',0,[(1,.97),(32,.97),(63,.78),(104,.78),(135,.82)])
anim(key,'location',0,[(1,.5),(32,.5),(63,.30),(83,.30),(115,-.26),(144,-.41)])
anim(key,'rotation_euler',1,[(1,.3),(32,.3),(63,-.18),(83,-.18),(110,.08),(144,.04)])
anim(hand,'location',0,[(1,-.41),(64,-.42),(86,-.48),(110,-.34),(144,-.34)])
# Only the visitor's fingertips enter this close shot.
visitor=joint('Visitor',(-2.0,.39,.66))
for i in range(2):ball('Fingertip',(.03-i*.06,-.07*i,-.17*i),(.38,.135,.11),skin,visitor)
anim(visitor,'location',0,[(1,-2),(42,-2),(76,-.49),(84,-.49),(115,-1.03),(144,-1.18)])
def area(name,loc,color,power,size,aim):
    b.ops.object.light_add(type='AREA',location=loc);o=b.context.object;o.name=name
    o.data.color=color;o.data.energy=power;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector(aim)-o.location).to_track_quat('-Z','Y').to_euler()
area('Under-cabinet lamp',(-2,-2,3.4),(1,.61,.32),360,3,(0,.6,.7))
area('Blue window rim',(2,1.4,3.6),(.31,.52,1),260,2,(.7,.5,.8))
area('Bounce',(1,-3,2),(.95,.82,.7),115,3,(.8,.7,.9))
b.ops.object.camera_add(location=(-1.35,-5.4,2.0));cam=b.context.object;sc.camera=cam
cam.rotation_euler=(Vector((.35,.69,1.04))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=48
sc.render.engine='CYCLES';sc.cycles.samples=4;sc.cycles.use_denoising=True
sc.world=b.data.worlds.new('Evening');sc.world.color=(.15,.15,.18)
sc.render.resolution_x=360;sc.render.resolution_y=640;sc.render.resolution_percentage=100
sc.render.fps=18;sc.frame_start=1;sc.frame_end=144
sc.render.image_settings.file_format='PNG'
os.makedirs('cozy-frames',exist_ok=True)
sc.render.filepath=os.path.abspath('cozy-frames/f')
b.ops.render.render(animation=True)
