.PHONY: local

# Chạy local: API (server.js) + Vite dev server. Tự cài deps / tạo .env nếu chưa có.
local:
	@[ -d node_modules ] || npm install
	@[ -f .env ] || cp .env.example .env
	npm run dev:all
