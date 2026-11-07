# Builds the single-file game: python3 src/assemble.py blackthorn-manor.html
# Inlines vendor/three-r128.min.js and every src/*.js (in name order) into shell.html.
import glob, os, sys
S = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(S, 'shell.html')).read()
three_path = os.path.join(S, '..', 'vendor', 'three-r128.min.js')
if not os.path.exists(three_path): three_path = os.path.join(S, '..', 'package', 'build', 'three.min.js')
three = open(three_path).read().replace('</script', '<\\/script')
parts = []
for f in sorted(glob.glob(os.path.join(S, '*.js'))):
    name = os.path.basename(f)[:-3]
    parts.append('<script id="bm-%s">\n%s</script>' % (name, open(f).read()))
out = shell.replace('/*THREE*/', three).replace('<!--GAME-->', '\n'.join(parts))
open(sys.argv[1], 'w').write(out)
print('wrote', sys.argv[1], len(out))
