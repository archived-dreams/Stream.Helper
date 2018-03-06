/* Полезные функции */

// Генератор UUID
function UUID () {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Валидация UUID
var isUUID = function (uuid) {
    if (uuid[0] === "{") { uuid = uuid.substring(1, uuid.length - 1); }
    var regexUuid = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
    return regexUuid.test(uuid);
}

// Хэш
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/* Основная часть скрипта */
$(function () {

  /* Определяем наш протокол и подключаемся по HTTP/HTTPS протоколу к ноде */
  if (window.location.protocol == "https:"){
    var socket = io('https://klybok.net:3001');
  } else {
    var socket = io('http://klybok.net:3000');
  }

  /* Действие при подключении */
  socket.on('connected', function (data) {

    // Если соединение восстановлено - уведомляем
    if ($('[data-element="app-status"] i').hasClass('text-danger')) {
      $.notify({ message: 'Соединение восстановлено.' }, { type: 'success' });
    }

    // Меняем статус подключения в шапке сайта
    $('[data-element="app-status"] i').attr('class', 'fas fa-circle text-success');
    $('[data-element="app-status"] span').text('Подключено');

    // Если у нас уже есть ключ - иницилизируемся
    if (typeof $.cookie('secret') !== 'undefined') {
      socket.emit('set.secret', {
        secret: $.cookie('secret'),
        type: 'client'
      });
    }
  });

  /* Действие при отключении */
  socket.on('disconnect', function () {
    // Меняем статус подключения в шапке сайта
    $('[data-element="app-status"] i').attr('class', 'fas fa-circle text-danger');
    $('[data-element="app-status"] span').text('Отключено');
    $.notify({ message: 'Ошибка соединения. Проверьте подключение к сети.' }, { type: 'danger' });
  });



  /* Работа с виджетами */
  (() => {

    /* Обработчики виджетов */
    var handlers = {

      /* Управление плеерами */
      'browser-sound': {
          // Блок на странице
          layout: $('[data-element="browser-sound-widget"] .widget'),

          // Удаление виджета
          remove: function (id) {
            this.layout.find(`[data-id="${id}"]`).remove();
          },

          // Данные
          data: {},

          // Обновиить или добавить виджет
          update: function (data) {

            /* Элементы (Блоки) */
            var elements = { };

            // Заголовок
            elements.title = `
              <!-- Иконка сайта -->
              <img src="https://www.google.com/s2/favicons?domain=${ encodeURIComponent(data.domain) }" class="fa-fw">
              <!-- Заголовок -->
              ${ data.title }
            `;

            // Таймлайн
            elements.timeline = `${ data.timeline }`;

            // Картинка и Фон
            elements.images = `
              <span><img src="${ data.image }" class="cover" draggable="false"></span>
              <img src="${ data.image }" class="background-image" style="z-index: -1;" draggable="false">
            `;

            // Кнопки
            elements.control = `
              <!-- Предыдущий трек -->
              ${ data.actions.prev ? `
                <button type="button" class="btn btn-secondary" data-trigger="prev">
                  <i class="fas fa-angle-double-left fa-fw"></i>
                </button>
              ` : '' }
              <!-- Перемотать назад -->
              ${ data.actions.rewinding ? `
                <button type="button" class="btn btn-secondary" data-trigger="undo-15s">
                  <i class="fas fa-undo fa-fw"></i>
                  <span class="d-none d-md-inline">15</span>
                </button>
              ` : '' }
              <!-- Плей/Пауза -->
              ${ data.status === true ? `
                <button type="button" class="btn btn-secondary" data-trigger="pause">
                  <i class="fas fa-pause fa-fw"></i>
                </button>
              ` : `
                <button type="button" class="btn btn-secondary" data-trigger="play">
                  <i class="fas fa-play fa-fw"></i>
                </button>
              ` }
              <!-- Перемотать вперед -->
              ${data.actions.rewinding ? `
                <button type="button" class="btn btn-secondary" data-trigger="redo-15s">
                  <i class="fas fa-redo fa-fw"></i>
                  <span class="d-none d-md-inline">15</span>
                </button>
              ` : ''}
              <!-- Следующий трек -->
              ${data.actions.next ? `
                <button type="button" class="btn btn-secondary" data-trigger="next" >
                  <i class="fas fa-angle-double-right fa-fw"></i>
                </button>
              ` : ''}
              <!-- Звук -->
              <button class="btn btn-secondary" data-trigger="volume">
                <i class="fas fa-volume-up fa-fw"></i>
                <span class="d-none d-md-inline">${ data.volume }%</span>
              </button>
            `;

            /* Если элемента нету - создаём шаблон для него */
            if (this.layout.find(`[data-id="${data.id}"]`).length == 0) {
              this.layout.append(`
                <div class="list-group-item d-flex justify-content-between lh-condensed content" data-id="${ data.id }">
                  <div style="z-index: 2;">
                    <!-- Заголовок -->
                    <h6 class="my-0" data-value="title"></h6>
                    <!-- Время -->
                    <div class="text-muted" data-value="timeline"></div>
                    <!-- Кнопки -->
                    <div class="btn-group btn-group-justified" role="group" data-value="control" style="display: flex; flex-wrap: wrap-reverse;"></div>
                    <!-- Картинка и Фон -->
                    <div data-value="images"></div>
                  </div>
                </div>
              `);
            }

            /* Обновляем требуемые данные */
            $.each(elements, (element, html) => {
              // Элемент
              var element = $(`[data-id="${ data.id }"] [data-value="${ element }"]`);
              if (element.attr('data-hash') != html.hashCode()) {
                element.html(html).attr('data-hash', html.hashCode());
              }
            });
          },

          // Иницилизация
          init: function () {

            // Плей, пауза, прошлый и следующие треки
            this.layout.on('click', '[data-trigger="prev"], [data-trigger="next"], [data-trigger="play"], [data-trigger="pause"]', function () {
              socket.emit('widget.command', {
                id: $(this).parents('[data-id]').attr('data-id'),
                widget: 'browser-sound',
                command: $(this).attr('data-trigger')
              });
            });

            // Перемотка
            this.layout.on('click', '[data-trigger="redo-15s"], [data-trigger="undo-15s"]', function () {
              socket.emit('widget.command', {
                id: $(this).parents('[data-id]').attr('data-id'),
                command: 'rewind',
                widget: 'browser-sound',
                value: $(this).attr('data-trigger') == 'redo-15s' ? 15 : -15
              });
            });

            // Звук
            this.layout.on('click', '[data-trigger="volume"]', function () {
              var id = $(this).parents('[data-id]').attr('data-id');
              // Диалоговое окно
              bootbox.dialog({
                message: `
                  <div class="browser-sound-widget-volume">
                    <div id="browser-sound-widget-volume"></div>
                  </div>
                  <button class="btn btn-block btn-primary" style="margin-top: 10px;">
                    Применить
                  </button>
                `
              });
              // Слайдер
              var slider = noUiSlider.create(
                document.getElementById('browser-sound-widget-volume'),
                { range: { min: 0, max: 100 }, start: [ handlers['browser-sound'].data[id].volume ], step: 1, pips: { mode: 'count', values: 5 } }
              );
              // Применяем
              $('.browser-sound-widget-volume').parent().find('.btn-primary').on('click', () => {
                // Удаляем окно
                $('.bootbox.modal').on('hidden.bs.modal', function (e) {
                  $('.bootbox.modal').remove();
                });
                // Пременяем
                var volume = Math.round(slider.get('value'));
                socket.emit('widget.command', {
                  id: id,
                  command: 'volume',
                  widget: 'browser-sound',
                  value: volume
                });
                // Анимируем
                $('.bootbox.modal').modal('hide');
              });
            });

          },

          // Удаляем лишнее
          relevance: function (ids) {
            this.layout.find('[data-id]').each(function () {
              if (!(ids.indexOf($(this).attr('data-id')) != -1)) {
                this.remove($(this).attr('data-id'));
              }
            });
          }

      }

    };

    /* Обновление всех виджетов */
    socket.on('widget.refresh', function (widgets) {

      // Разбиваем по типам виджетов
      $.each(widgets, function (widget_type, elements) {
        handlers[widget_type].data = elements;

        // Если обработчика нету - пропускаем
        if (typeof handlers[widget_type] !== 'object') return;

        // Указываем обработчик
        var handler = handlers[widget_type];

        // Обрабатываем вилжеты
        $.each(elements, function (id, element) {

          // Если виджет скрыт - удаляем его
          if (element._hidden) {
            return handler.remove(id);
          }

          // Обновляем данные
          handler.update(element);
        });

        // Удалить лишние
        handler.relevance(Object.keys(elements));
      });

      // Если виджетов нету
      $.each(handlers, function (handler_type) {
        if (typeof widgets[handler_type] !== 'object' || widgets[handler_type].length == 0) {
          var handler = handlers[handler_type];
          handler.relevance([]);
        }
      });

    });

    /* Обновление определенного виджета */
    socket.on('widget.update', function (widget) {

      handlers[widget.widget].data[widget.id] = widget;

      // Если обработчика нету - пропускаем
      if (typeof handlers[widget.widget] !== 'object') return;

      // Указываем обработчик
      var handler = handlers[widget.widget];

      // Если виджет скрыт - удаляем его
      if (widget._hidden) {
        return handler.remove(widget.id);
      }

      // Обновляем данные
      handler.update(widget);
    });

    /* Каждые 10 секунд обновляем список всех виджетов */
    setInterval(function() {
      socket.emit('widget.refresh');
    }, 10000);

    /* Иницилизируем все виджеты */
    (() => {
      console.group("Иницилизация виджетов");
      $.each(handlers, function (type, handler) {
        // Если иницилизация не требуется
        if (typeof handler.init !== 'function') {
          console.log(`[${type}] Иницилизация не требуется`);
          return;
        }
        // Иницилизируем
        try {
          handler.init();
        } catch (e) {
          console.error(`[${type}] Ошибка иницилизации`, e);
        } finally {
          console.info(`[${type}] Иницилизация прошла успешно`);
        }
      });
      console.groupEnd();
    })();

  })();


  /* Ping */
  (() => {
    // Иницилизируем
    var startTime = Date.now();
    socket.emit('latency');

    // Обновляем Ping каждые 3.5 сек
    setInterval(function() {
      startTime = Date.now();
      socket.emit('latency');
    }, 3500);

    // Получаем ответ от сервера и сравниваем
    socket.on('latency', function () {
      var latency = Date.now() - startTime;
      $('[data-element="app-ping"] span').text(latency);
    });
  })();


  /* Работа с ключем иницилизации */
  (() => {

    /* Иницилизация - форма ввода ключами */
    (() => {
      if (typeof $.cookie('secret') == 'undefined') {
        // Если в куках нету ключа - принудительно заставляем указать клиента его
        $('#navbarHeader').collapse('show');
        $('[data-toggle="collapse"][data-target="#navbarHeader"]').attr('disabled', true);
        $('[data-secret]').focus();
      } else {
        // Если в куках есть ключ - заполняем форму и разрешаем работу с виджетами
        $('[data-secret]').val($.cookie('secret'));
        $('.page-content').attr('style', '');
      }
    })();

    /* Генерация нового ключа при клике по кнопке */
    $('[data-secret-generate]').on('click', () => {
      $('[data-secret]').val(UUID());
      $('[data-secret-save]').focus();
    });

    /* Сохранение ключа */
    $('[data-secret-save]').on('click', () => {
      // Получаем ключ из формы и очищаем от лишних пробелов
      var secret = $('[data-secret]').val().trim();

      // Валидация формата
      if (!isUUID(secret)) {
        $.notify({ message: 'Ключ должен быть в формате UUID!' }, { type: 'danger' });
        $('[data-secret]').focus();
        return;
      }

      // Устанавливаем куки
      $.cookie('secret', secret, { expires: 365, path: '/' });

      // Проходим иницилизацию по ключу
      socket.emit('set.secret', {
        secret: $.cookie('secret'),
        type: 'client'
      });

      // Уведомляем пользователя об успешной установке ключа и даём доступ к виджетам
      $.notify({ message: 'Ключ успешно установен!' }, { type: 'success' });
      $('[data-secret]').val($.cookie('secret'));
      $('.page-content').attr('style', '');
      $('[data-toggle="collapse"][data-target="#navbarHeader"]').removeAttr('disabled');
      $('#navbarHeader').collapse('hide');
    });

    /* В случае ошибки иницилизации ключа сбрасываем его */
    socket.on('set.secret', function (data) {
      if (!data) {
        $.removeCookie('secret', { path: '/' });
        $('#navbarHeader').collapse('show');
        $('[data-toggle="collapse"][data-target="#navbarHeader"]').attr('disabled', true);
        $('[data-secret]').focus();
        $('.page-content').attr('style', 'filter: blur(6px); pointer-events: none;');
        $.notify({ message: 'Ошибка иницилизации! Ключ введен неверно.' }, { type: 'danger' });
        $('[data-element="app-userId"] span').text('--');
      } else {
        // Запрашиваем обновление виджетов
        socket.emit('widget.refresh');
        // Обновляем ID пользователя
        $('[data-element="app-userId"] span').text(data);
      }
    });

    /* Системная информация */
    socket.on('system.info', function (data) {
      $('[data-element="app-version"] span').text(data.socket);
    });

  })();

  /* Нотификации */
  socket.on('notification.get', function (data) {
    $.notify({ message: data.message }, { type: data.type });
  });

  /* Модалка - эффект размытия */
  (() => {
    // При открытии
    $('body').on('show.bs.modal', '.modal', function () {
      $('.page-content').css('filter', 'blur(5px)');
    });

    // При закрытии
    $('body').on('hide.bs.modal', '.modal', function () {
      $('.page-content').removeAttr('style');
    });
  })();

  /* Иницилизируем Tooltips */
  $('[data-toggle="tooltip"]').tooltip();

  /* Подсветка кода */
  $('pre.code').each(function () {
    $(this).html($(this).html().replace(/                  /g, '').trim());
    $(this).highlight({source:1, zebra:1, indent:'space', list:'ol'});
  });

});
