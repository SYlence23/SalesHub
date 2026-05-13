-include .env
export

ifeq ($(OS), Windows_NT)
	DOCKER_COMPOSE := docker compose
else 
	DOCKER_COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose" )
endif

up:
	@$(DOCKER_COMPOSE) up -d

build:
	@$(DOCKER_COMPOSE) up --build -d

down:
	@$(DOCKER_COMPOSE) down

# Повне видалення проєкту РАЗОМ З БАЗОЮ ДАНИХ (Обережно!)
nuke:
	@$(DOCKER_COMPOSE) down -v


logs-back:
	@$(DOCKER_COMPOSE) logs -f backend

logs-front:
	@$(DOCKER_COMPOSE) logs -f frontend

logs-db:
	@$(DOCKER_COMPOSE) logs -f db


# ==========================================
# МІГРАЦІЇ (Керування базою даних)
# ==========================================

# 1. Створити нову міграцію (записати зміни з коду)
# Використання: make migrate-add name=InitialCreate
migrate-add:
	cd backend-core/Project/Project && dotnet ef migrations add $(name)

# 2. "migrate-up" - Застосувати всі міграції до бази даних
# (Хоча у нас це робиться автоматично при запуску, ця команда корисна для ручного контролю)
migrate-up:
	cd backend-core/Project/Project && dotnet ef database update

# 3. "migrate-down" - Відкотити базу до конкретної міграції
# Використання: make migrate-down target=NameOfPreviousMigration
# Якщо хочете повністю очистити базу: make migrate-down target=0
migrate-down:
	cd backend-core/Project/Project && dotnet ef database update $(target)

# 4. Видалити останній файл міграції (якщо ви його створили, але ще не встигли застосувати)
migrate-remove:
	cd backend-core/Project/Project && dotnet ef migrations remove
	