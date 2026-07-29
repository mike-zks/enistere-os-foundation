"""Authentication test package.

A package rather than loose modules so `conftest` helpers can be imported
relatively: pytest's default import mode would otherwise put each test directory
on `sys.path` and relative imports would fail.
"""
