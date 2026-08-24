#!/usr/bin/env python3
"""Self-tests for check-png-optimized.py.
Run: python3 -m pytest scripts/test_check_png_optimized.py -q"""
import importlib.util
import pathlib
import struct
import zlib

_SPEC = importlib.util.spec_from_file_location(
    "check_png_optimized", pathlib.Path(__file__).parent / "check-png-optimized.py"
)
check = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(check)


def _chunk(tag, data):
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def _fat_png(path):
    """A valid 64x64 RGBA PNG written by hand, stored uncompressed.

    Deliberately not Pillow: this repo ships no image library and must not gain
    one for a test. Verified to be exactly what the check is meant to notice,
    16,516 bytes that oxipng takes down to 303.
    """
    w = h = 64
    raw = b"".join(
        b"\x00" + b"".join(bytes((200, 40, 90, (x * y) % 256)) for x in range(w))
        for y in range(h)
    )
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + _chunk(b"IDAT", zlib.compress(raw, 0))
        + _chunk(b"IEND", b"")
    )


def test_reports_recoverable_bytes_but_still_passes(tmp_path, capsys):
    (tmp_path / "images").mkdir()
    _fat_png(tmp_path / "images" / "a.png")
    assert check.main(str(tmp_path)) == 0
    out = capsys.readouterr().out
    assert "still recoverable" in out
    assert "a.png" in out


def test_optimal_tree_reports_nothing_recoverable(tmp_path, capsys):
    (tmp_path / "images").mkdir()
    target = tmp_path / "images" / "a.png"
    _fat_png(target)
    import oxipng
    target.write_bytes(oxipng.optimize_from_memory(
        target.read_bytes(), level=6, strip=oxipng.StripChunks.safe(), optimize_alpha=True))
    assert check.main(str(tmp_path)) == 0
    assert "0 KB (0.0%) still recoverable" in capsys.readouterr().out


def test_missing_asset_dirs_do_not_crash(tmp_path, capsys):
    assert check.main(str(tmp_path)) == 0
    assert "no PNGs found" in capsys.readouterr().out


def test_corrupt_file_is_skipped_without_failing(tmp_path, capsys):
    (tmp_path / "images").mkdir()
    (tmp_path / "images" / "bad.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"garbage")
    assert check.main(str(tmp_path)) == 0
    assert "SKIPPED" in capsys.readouterr().err
