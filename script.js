        const folderInput = document.getElementById('folderInput');
        const skinsContainer = document.getElementById('skinsContainer');
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

        let stickers_to_calculate = [];


        folderInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);

            // Фильтруем только изображения со всех уровней вложенности
            const imageFiles = files.filter(file => {
                const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                return imageExtensions.includes(ext);
            });

            // Очищаем контейнер
            skinsContainer.innerHTML = '';

            if (imageFiles.length === 0) {
                skinsContainer.innerHTML = '<div class="no-skins">В папке и подпапках не найдено изображений</div>';
                return;
            }

            // Создаём кнопки для каждого изображения

            // Создаём специальную кнопку-сброс и помещаем её в начало списка кнопок
const resetAllBtn = document.createElement('button');
resetAllBtn.className = 'skin-button reset-all';
resetAllBtn.textContent = 'Reset all';
resetAllBtn.style.cssText = `
  position: relative;
  width: 120px; height: 120px; /* подгоните под ваш стиль */
  display: inline-block;
  margin-right: 8px;
`;
resetAllBtn.setAttribute('data-reset', 'true');

resetAllBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  // Очистка глобального массива наклеек
  stickers_to_calculate.length = 0;

  // Обнуление всех локальных счётчиков у кнопок-наклеек
  document.querySelectorAll('.skin-button').forEach(btn => {
    // пропускаем кнопку-сброс
    if (btn.getAttribute('data-reset') === 'true') return;

    // если у кнопки есть локальный счётчик
    if (typeof btn._qty === 'number') {
      btn._qty = 0;
      const center = btn.querySelector('.qty-label');
      if (center) center.textContent = '0';
    }

    // визуально убрать выделение (если вы показываете selected/не-selected)
    btn.classList.remove('selected');
  });
});

// Перед добавлением остальных кнопок вставляем кнопку-сброс
skinsContainer.insertBefore(resetAllBtn, skinsContainer.firstChild);

imageFiles.forEach(file => {
  const fileURL = URL.createObjectURL(file);
  const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
  const filePath = file.webkitRelativePath;

  const button = document.createElement('button');
  button.className = 'skin-button';
  button.setAttribute('data-name', fileName);

  // Экстра элементы: кнопка + (плюс) и кнопка - (минус) и центр с количеством
  const plusBtn = document.createElement('span');
  plusBtn.textContent = '+';
  plusBtn.style.cssText = `
    position:absolute; top:6px; right:8px;
    cursor:pointer; user-select:none; font-weight:bold;
    font-size: 28px; color: #0a0;
  `;

  const minusBtn = document.createElement('span');
  minusBtn.textContent = '-';
  minusBtn.style.cssText = `
    position:absolute; top:6px; left:8px;
    cursor:pointer; user-select:none; font-weight:bold;
    font-size: 28px; color: #a00;
  `;

  const centerQty = document.createElement('span');
  centerQty.textContent = '0';
  centerQty.style.cssText = `
    position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);
    font-size: 26px; font-weight: bold;
  `;
  centerQty.className = 'qty-label';

  // Отображение картинки внутри кнопки
  const img = document.createElement('img');
  img.src = fileURL;
  img.alt = fileName;

  button.style.position = 'relative';
  button.appendChild(img);
  button.appendChild(plusBtn);
  button.appendChild(minusBtn);
  button.appendChild(centerQty);

  // состояние количества для этого файла (хранится на кнопке)
  button._qty = 0;

  // обработчик нажатия "+"
  plusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Правило: максимум 4 наклейки суммарно
    if (stickers_to_calculate.length >= 4) {
      alert("Может быть только 4 наклейки");
      return;
    }
    button._qty += 1;
    centerQty.textContent = String(button._qty);
    stickers_to_calculate.push(fileName);
  });

  // обработчик нажатия "-"
  minusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (button._qty > 0) {
      button._qty -= 1;
      centerQty.textContent = String(button._qty);
      // удаляем одну копию из массива наклеек
      const idx = stickers_to_calculate.lastIndexOf(fileName);
      if (idx !== -1) {
        stickers_to_calculate.splice(idx, 1);
      }
    }
  });

  skinsContainer.appendChild(button);
});


const style = document.createElement('style');
    style.innerHTML = `
        .skin-button.selected {
            border: 3px solid blue; /* Цвет и стиль рамки */
            /* Вы можете добавить другие стили здесь */
        }
    `;
    document.head.appendChild(style);
});


async function getPrice(name) {
    try {
        const res = await fetch('price_stickers.json', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Ошибка загрузки price.json: ${res.status} ${res.statusText}`);
        }
        const prices = await res.json(); // {"p1":12.00,"p2":123.89}
        return prices[name] ?? null;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function getPrice(name) {
    return window.price_stickers?.[name] ?? null;
}

function calculate(){
  const input = document.getElementById("priceInput");
  const raw = input ? input.value.trim() : "";

  // Если поле пустое — завершить
  if (!raw) {
    alert("Укажите цену скина");
    return;
  }

  let list = "";
  for(let x=0; x<stickers_to_calculate.length; x++){
    console.log(stickers_to_calculate[x]);
    list += stickers_to_calculate[x];
    list += " ";
  }

  let price = 0;
  for(let x=0; x<stickers_to_calculate.length; x++){
    const val = getPrice(stickers_to_calculate[x]);
    price += (typeof val === 'number') ? val : Number(val) || 0;
  }

  price /= 10;
  price += Number(raw);

  alert("Цена: " + price);
}



