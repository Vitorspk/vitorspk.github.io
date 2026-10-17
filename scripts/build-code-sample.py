"""Build/check the documented sample without depending on zlib byte output."""
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
# Stable archive metadata; this is the sample's creation date, not build time.
ARCHIVE_TIMESTAMP = (2026, 10, 17, 0, 0, 0)
sources = {
    name: root / 'examples/inference-fallback' / name
    for name in ('README.md', 'client.py', 'test_client.py')
}
sources['LICENSE'] = root / 'LICENSE'
archive_path = root / 'examples/inference-fallback.zip'

if '--check' in sys.argv:
    with zipfile.ZipFile(archive_path) as archive:
        expected = {'inference-fallback/' + name for name in sources}
        if set(archive.namelist()) != expected or len(archive.namelist()) != len(expected):
            raise SystemExit('Download archive has missing, duplicate or unexpected files')
        for name, source in sources.items():
            if archive.read('inference-fallback/' + name) != source.read_bytes():
                raise SystemExit('Download archive is stale: ' + name)
    print('Download archive content matches its sources')
    raise SystemExit(0)

with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name, source in sources.items():
        info = zipfile.ZipInfo('inference-fallback/' + name, date_time=ARCHIVE_TIMESTAMP)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, source.read_bytes())
print('Built examples/inference-fallback.zip')
