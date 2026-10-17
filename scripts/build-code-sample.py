"""Build a deterministic download with only the documented sample sources."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
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
