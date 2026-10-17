"""Build a deterministic download with only the documented sample sources."""
from pathlib import Path
import zipfile
import sys

root = Path(__file__).resolve().parent.parent
sources = {name: root / 'examples/inference-fallback' / name for name in ('README.md', 'client.py', 'test_client.py')}
sources['LICENSE'] = root / 'LICENSE'
if '--check' in sys.argv:
    with zipfile.ZipFile(root / 'examples/inference-fallback.zip') as archive:
        expected = {'inference-fallback/' + name for name in sources}
        if set(archive.namelist()) != expected or len(archive.namelist()) != len(expected):
            raise SystemExit('Download archive has missing, duplicate or unexpected files')
        for name, source in sources.items():
            if archive.read('inference-fallback/' + name) != source.read_bytes():
                raise SystemExit('Download archive is stale: ' + name)
    print('Download archive content matches its sources')
    raise SystemExit(0)
with zipfile.ZipFile(root / 'examples/inference-fallback.zip', 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in ('README.md', 'client.py', 'test_client.py'):
        info = zipfile.ZipInfo('inference-fallback/' + name, date_time=(2026, 10, 17, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (root / 'examples/inference-fallback' / name).read_bytes())
    info = zipfile.ZipInfo('inference-fallback/LICENSE', date_time=(2026, 10, 17, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    archive.writestr(info, (root / 'LICENSE').read_bytes())
print('Built examples/inference-fallback.zip')
