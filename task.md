# D&D 5e Помощник Новичка — Выполнение Задач

## 📝 Список задач

- `[x]` **Фаза 1: Инфраструктура и Базовые Данные**
  - `[x]` Создать `package.json` и `index.html`
  - `[x]` Создать дизайн-систему в `styles.css`
  - `[x]` Создать служебные файлы `js/utils.js`, `js/router.js`, `js/state.js`
  - `[x]` Создать модульную базу правил в `js/rules/`
    - `[x]` `js/rules/classes.js`
    - `[x]` `js/rules/races.js`
    - `[x]` `js/rules/spells.js`
    - `[x]` `js/rules/weapons.js`
    - `[x]` `js/rules/backgrounds.js`
    - `[x]` `js/rules/conditions.js`
    - `[x]` `js/rules/index.js`
- `[x]` **Фаза 2: Системные Компоненты**
  - `[x]` Реализовать движок бросков и синтеза звука в `js/dice.js`
  - `[x]` Создать общую точку входа `js/app.js`
- `[ ]` **Фаза 3: UI Компоненты (Создание и Выбор персонажа)**
  - `[ ]` Создать компонент выбора персонажа `js/components/characterSelect.js`
  - `[ ]` Создать пошаговый мастер создания `js/components/wizard.js`
  - `[ ]` Создать пошаговый мастер повышения уровня `js/components/levelUpWizard.js`
- `[ ]` **Фаза 4: Лист персонажа (Основной Дашборд)**
  - `[ ]` Создать главный макет `js/components/sheet.js`
  - `[ ]` Создать `js/components/header.js` (Имя, XP, Milestone, Вдохновение)
  - `[ ]` Создать `js/components/combat.js` (HP, AC, Инициатива, Death Saves, Состояния)
  - `[ ]` Создать `js/components/abilities.js` (Характеристики + Броски)
  - `[ ]` Создать `js/components/skills.js` (Навыки, Спасброски, Пассивное внимание)
  - `[ ]` Создать `js/components/attacks.js` (Атаки ближнего/дальнего боя, урон)
  - `[ ]` Создать `js/components/inventory.js` (Предметы, золото, перегрузка)
  - `[ ]` Создать `js/components/spells.js` (Ячейки заклинаний, список, Spell DC/Attack)
  - `[ ]` Создать `js/components/features.js` & `js/components/proficiencies.js`
  - `[ ]` Создать `js/components/notes.js` (Блокнот)
  - `[ ]` Создать `js/components/helpTooltip.js` (Интерактивный онбординг)
- `[ ]` **Фаза 5: Верификация и Отладка**
  - `[ ]` Запустить локальный сервер
  - `[ ]` Протестировать создание, прокачку, бой, спеллы, экспорт/импорт
  - `[ ]` Устранить баги, проверить адаптивность и фокусы DOM
