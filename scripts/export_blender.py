"""Run with Blender 4.2+: blender -b -t 2 --python scripts/export_blender.py -- /path/EarthTierra.blend"""
import bpy,sys,os
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/workspace/scratch/e428389af400/upload/EarthTierra.blend'
bpy.ops.wm.open_mainfile(filepath=source)
out=root/'public'/'model';out.mkdir(parents=True,exist_ok=True)
images={'8k_earth_daymap.jpg':'day','cities_16k.png':'night','Earth_Clouds_6K.jpg':'clouds','8081_earthbump10k.jpg':'bump','water_8k.png':'water'}
for name,stem in images.items():
 im=bpy.data.images[name]
 (out/(stem+'.original')).write_bytes(im.packed_file.data)
bpy.ops.object.select_all(action='DESELECT')
earth=bpy.data.objects['Earth'];earth.select_set(True);bpy.context.view_layer.objects.active=earth
earth.data.materials.clear()
earth.rotation_euler=(0,0,0)
for mod in list(earth.modifiers): earth.modifiers.remove(mod)
for poly in earth.data.polygons:poly.use_smooth=True
bpy.ops.export_scene.gltf(filepath=str(out/'earth.glb'),export_format='GLB',use_selection=True,export_materials='NONE',export_animations=False,export_cameras=False,export_lights=False)
print('EXPORTED',len(earth.data.vertices),'vertices')
