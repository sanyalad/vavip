#!/bin/bash
# Скрипт для удаления старых директорий проектов
# Использование: ./server-remove-old-dirs.sh [BASE_DIR]
# Пример: ./server-remove-old-dirs.sh /opt

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_DIR="${1:-/opt}"

echo "=============================================="
echo -e "${CYAN}🗑️  Поиск старых директорий проектов${NC}"
echo "=============================================="
echo ""
echo -e "${CYAN}Поиск в директории: $BASE_DIR${NC}"
echo ""

# Поиск директорий которые могут быть старыми проектами
echo -e "${CYAN}📂 Найденные директории:${NC}"
echo ""

# Ищем директории с типичными именами проектов
PATTERNS=("vavip*" "*project*" "*app*" "*web*" "*api*" "*backend*" "*frontend*")

FOUND_DIRS=()

for pattern in "${PATTERNS[@]}"; do
    while IFS= read -r dir; do
        if [ -d "$dir" ] && [ -d "$dir/.git" ] || [ -f "$dir/docker-compose.yml" ] || [ -f "$dir/docker-compose.prod.yml" ]; then
            FOUND_DIRS+=("$dir")
        fi
    done < <(find "$BASE_DIR" -maxdepth 2 -type d -iname "$pattern" 2>/dev/null || true)
done

# Также ищем директории с docker-compose файлами
while IFS= read -r dir; do
    if [[ ! " ${FOUND_DIRS[@]} " =~ " ${dir} " ]]; then
        FOUND_DIRS+=("$dir")
    fi
done < <(find "$BASE_DIR" -maxdepth 3 -type f \( -name "docker-compose.yml" -o -name "docker-compose.prod.yml" \) -exec dirname {} \; 2>/dev/null | sort -u || true)

if [ ${#FOUND_DIRS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ Старых директорий проектов не найдено${NC}"
    exit 0
fi

# Показываем найденные директории
for i in "${!FOUND_DIRS[@]}"; do
    dir="${FOUND_DIRS[$i]}"
    size=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "unknown")
    echo "  [$((i+1))] $dir ($size)"
done

echo ""
echo -e "${YELLOW}⚠️  Эти директории будут удалены!${NC}"
echo ""
echo "Выберите действие:"
echo "  1) Удалить все найденные директории"
echo "  2) Выбрать директории для удаления"
echo "  3) Отмена"
echo ""
read -p "Ваш выбор (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${RED}⚠️  Вы уверены что хотите удалить ВСЕ найденные директории? (y/N):${NC}"
        read -r confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✓ Удаление отменено${NC}"
            exit 0
        fi
        
        echo ""
        echo -e "${CYAN}🗑️  Удаляем директории...${NC}"
        for dir in "${FOUND_DIRS[@]}"; do
            echo "  Удаляем: $dir"
            rm -rf "$dir" 2>/dev/null || true
        done
        echo -e "${GREEN}✓ Все директории удалены${NC}"
        ;;
    2)
        echo ""
        echo "Введите номера директорий через запятую (например: 1,3,5):"
        read -r selected
        
        IFS=',' read -ra SELECTED_INDICES <<< "$selected"
        SELECTED_DIRS=()
        
        for idx in "${SELECTED_INDICES[@]}"; do
            idx=$((idx-1))
            if [ $idx -ge 0 ] && [ $idx -lt ${#FOUND_DIRS[@]} ]; then
                SELECTED_DIRS+=("${FOUND_DIRS[$idx]}")
            fi
        done
        
        if [ ${#SELECTED_DIRS[@]} -eq 0 ]; then
            echo -e "${YELLOW}⚠️  Не выбрано ни одной директории${NC}"
            exit 0
        fi
        
        echo ""
        echo -e "${CYAN}Выбранные директории для удаления:${NC}"
        for dir in "${SELECTED_DIRS[@]}"; do
            echo "  - $dir"
        done
        echo ""
        echo -e "${RED}⚠️  Удалить выбранные директории? (y/N):${NC}"
        read -r confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✓ Удаление отменено${NC}"
            exit 0
        fi
        
        echo ""
        echo -e "${CYAN}🗑️  Удаляем выбранные директории...${NC}"
        for dir in "${SELECTED_DIRS[@]}"; do
            echo "  Удаляем: $dir"
            rm -rf "$dir" 2>/dev/null || true
        done
        echo -e "${GREEN}✓ Выбранные директории удалены${NC}"
        ;;
    3)
        echo -e "${GREEN}✓ Отменено${NC}"
        exit 0
        ;;
    *)
        echo -e "${YELLOW}⚠️  Неверный выбор${NC}"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Очистка завершена!${NC}"
echo "=============================================="

