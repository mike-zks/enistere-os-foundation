"""Composition seams filled by the Factory when capabilities are selected.

The modules in this package are REPLACED at generation time. The baseline ships
them empty so that `app.main` imports the same names whether or not a capability
was composed — a base project must not differ structurally from a composed one.
"""
