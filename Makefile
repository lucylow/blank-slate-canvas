.PHONY: gr-matrix help

help:
	@echo "Available targets:"
	@echo "  gr-matrix    - Generate GR car × track matrix (CSV/JSON)"
	@echo "  help         - Show this help message"

gr-matrix:
	@echo "Generating GR car × track matrix..."
	@python3 -m src.utils.gr_car_track_mapper || python -m src.utils.gr_car_track_mapper
	@echo "✓ Matrix generated in artifacts/"

