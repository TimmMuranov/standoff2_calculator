// Базовый путь к папкам со стикерами.
// Папки должны лежать рядом с HTML-файлом или путь должен быть абсолютным.
const STICKERS_BASE_PATH = 'stickers';

let skinsContainer = null;
let stickerState = {}; // { "sticker_name": quantity }

// Функция получения цены учитывает структуру {"collection": {"name": price}}
function getPrice(collection, name) {
    return window.price_stickers?.[collection]?.[name] ?? null;
}

function renderSkins() {
    // Очищаем всё (включая старые обертки коллекций)
    skinsContainer.innerHTML = '';
    stickerState = {};

    // Создаем кнопку сброса ПЕРВОЙ
    const resetAllBtn = document.createElement('button');
    resetAllBtn.className = 'skin-button reset-all';
    resetAllBtn.style.width = '100%';
    resetAllBtn.style.height = '60px';
    resetAllBtn.textContent = 'Reset all';
    resetAllBtn.setAttribute('data-reset', 'true');
    resetAllBtn.addEventListener('click', handleResetAll);
    skinsContainer.appendChild(resetAllBtn);

    // Группируем наклейки по коллекциям
    const collectionsMap = {}; // { "collection_name": ["sticker_1", "sticker_2"] }

    for (const [collectionName, stickersInCollection] of Object.entries(window.price_stickers || {})) {
        if (!collectionsMap[collectionName]) {
            collectionsMap[collectionName] = [];
        }
        for (const [stickerName] of Object.entries(stickersInCollection)) {
            collectionsMap[collectionName].push(stickerName);
        }
    }

    // Проходимся по отсортированным коллекциям для стабильного порядка вывода
    Object.keys(collectionsMap).sort().forEach(collectionName => {
        // Создаем обертку для коллекции
        const collectionWrapper = document.createElement('div');
        collectionWrapper.className = 'collection-group';

        // Заголовок коллекции
        const titleDiv = document.createElement('div');
        titleDiv.className = 'collection-title';
        titleDiv.textContent = collectionName.toUpperCase();

        // Контейнер для самих кнопок-наклеек внутри этой коллекции
        const stickersGrid = document.createElement('div');
        stickersGrid.className = 'stickers-grid';

        // Добавляем заголовок и сетку в обертку
        collectionWrapper.appendChild(titleDiv);
        collectionWrapper.appendChild(stickersGrid);

        // Отрисовываем все наклейки текущей коллекции ВНУТРИ сетки
        const stickersList = collectionsMap[collectionName];
        stickersList.forEach(stickerName => {
            const filePath = `${STICKERS_BASE_PATH}/${collectionName}/${stickerName}.png`;
            createStickerButton(stickersGrid, collectionName, stickerName, filePath);
        });

        // Добавляем готовую группу (заголовок + наклейки) в основной контейнер
        skinsContainer.appendChild(collectionWrapper);
    });
}

// Создание одной кнопки-наклейки
function createStickerButton(parentEl, collection, name, filePath) {
    const button = document.createElement('button');
    button.className = 'skin-button';
    button.setAttribute('data-name', name);
    button.setAttribute('data-collection', collection);

    button.style.position = 'relative';
    button.style.width = '120px';
    button.style.height = '120px';
    button.style.display = 'inline-block';
    button.style.marginRight = '8px';
    button.style.border = '1px solid #ddd';
    button.style.verticalAlign = 'top';
    button.style.boxSizing = 'border-box'; /* Чтобы padding не вылезал за пределы */
    button.style.padding = '4px'; /* Отступы для текста коллекции */

    const img = document.createElement('img');
    img.style.width = '95%';
    img.style.height = '95%';
    img.style.objectFit = 'cover';
    img.src = filePath;
    img.alt = name;

    const plusBtn = document.createElement('span');
    plusBtn.textContent = '+';
    plusBtn.style.cssText = `
        position:absolute; top:6px; right:8px;
        cursor:pointer; user-select:none; font-weight:bold;
        font-size: 40px; color: #0a0;
    `;

    const minusBtn = document.createElement('span');
    minusBtn.textContent = '-';
    minusBtn.style.cssText = `
        position:absolute; top:6px; left:8px;
        cursor:pointer; user-select:none; font-weight:bold;
        font-size: 40px; color: #a00;
    `;

    const centerQty = document.createElement('span');
    centerQty.textContent = '0';
    centerQty.style.cssText = `
        position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);
        font-size: 30px; font-weight: bold;
        pointer-events: none;
    `;
    centerQty.className = 'qty-label';

    button.appendChild(plusBtn);
    button.appendChild(minusBtn);
    button.appendChild(centerQty);
    button.appendChild(img);

    // Локальное состояние количества для этой конкретной кнопки
    button._qty = 0;

    plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTotal = Object.values(stickerState).reduce((a, b) => a + b, 0);
        if (currentTotal >= 4) {
            alert("Может быть только 4 наклейки");
            return;
        }
        updateStickerCount(button, collection, name, 1);
    });

    minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateStickerCount(button, collection, name, -1);
    });

    parentEl.appendChild(button);
}

// Единый обработчик изменения количества
function updateStickerCount(button, collection, name, delta) {
    const newQty = Math.max(0, (button._qty || 0) + delta);
    button._qty = newQty;

    const label = button.querySelector('.qty-label');
    if (label) label.textContent = String(newQty);

    if (newQty > 0) {
        stickerState[name] = newQty;
    } else {
        delete stickerState[name];
    }
}

// Обработчик сброса всех наклеек
function handleResetAll() {
    stickerState = {};
    document.querySelectorAll('.skin-button').forEach(btn => {
        btn._qty = 0;
        const label = btn.querySelector('.qty-label');
        if (label) label.textContent = '0';
    });
}

// Функция расчета итоговой цены
function calculate(){
    const input = document.getElementById("priceInput");
    const raw = input ? input.value.trim().replace(',', '.') : "";

    if (!raw) {
        alert("Укажите цену скина");
        return;
    }

    let totalStickersPrice = 0;
    let foundMissingPrices = false;

    for (const [stickerName, qty] of Object.entries(stickerState)) {
        // Ищем название коллекции для текущей наклейки (так как названия могут повторяться в разных коллекциях)
        let collectionFound = null;
        for (const [colName, items] of Object.entries(window.price_stickers)) {
            if (items.hasOwnProperty(stickerName)) {
                collectionFound = colName;
                break;
            }
        }

        const val = getPrice(collectionFound, stickerName);

        if (val === null) {
            console.error(`Цена не найдена для "${stickerName}"`);
            foundMissingPrices = true;
            continue;
        }

        // Умножаем цену за штуку на выбранное количество
        totalStickersPrice += val * qty;
    }

    if (foundMissingPrices) {
        alert("Внимание! В консоли есть ошибки: некоторые наклейки не имеют цены.");
    }

    // Правило CS:GO: сумма цен наклеек делится на 10
    const finalPrice = Number(raw) + (totalStickersPrice / 10);

    // Округляем до сотых для корректного вывода валюты
    alert(`Итоговая цена: ${finalPrice.toFixed(2)}`);
}


document.addEventListener('DOMContentLoaded', () => {
    // Убедимся, что файл prices загружен ДО рендера
    if (typeof window.price_stickers === 'undefined') {
        alert('Ошибка: файл price_stickers.js не подключен или переменная price_stickers не определена.');
        return;
    }

    skinsContainer = document.getElementById('skinsContainer');

    if (!skinsContainer) {
        console.error('Контейнер #skinsContainer не найден в DOM');
        return;
    }

    // Рендерим все доступные наклейки сразу после загрузки страницы
    renderSkins();
});

const style = document.createElement('style');
style.innerHTML = `
    .skin-button.selected {
        border: 3px solid blue;
    }
    .reset-all {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        text-align: center;
        line-height: 1.2;
    }
`;
document.head.appendChild(style);
