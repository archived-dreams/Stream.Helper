'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* Полезные функции */

// Генератор UUID
function UUID() {
  var d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
  });
}

// Валидация UUID
var isUUID = function isUUID(uuid) {
  if (uuid[0] === "{") {
    uuid = uuid.substring(1, uuid.length - 1);
  }
  var regexUuid = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
  return regexUuid.test(uuid);
};

// Хэш
String.prototype.hashCode = function () {
  var hash = 0,
      i,
      chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/* Основная часть скрипта */
$(function () {

  /* Определяем наш протокол и подключаемся по HTTP/HTTPS протоколу к ноде */
  if (window.location.protocol == "https:") {
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
  (function () {

    /* Обработчики виджетов */
    var handlers = {

      /* Управление плеерами */
      'browser-sound': {
        // Блок на странице
        layout: $('[data-element="browser-sound-widget"] .widget'),

        // Удаление виджета
        remove: function remove(id) {
          this.layout.find('[data-id="' + id + '"]').remove();
        },

        // Данные
        data: {},

        // Обновиить или добавить виджет
        update: function update(data) {

          /* Элементы (Блоки) */
          var elements = {};

          // Заголовок
          elements.title = '\n              <!-- \u0418\u043A\u043E\u043D\u043A\u0430 \u0441\u0430\u0439\u0442\u0430 -->\n              <img src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(data.domain) + '" class="fa-fw">\n              <!-- \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A -->\n              ' + data.title + '\n            ';

          // Таймлайн
          elements.timeline = '' + data.timeline;

          // Картинка и Фон
          elements.images = '\n              <span><img src="' + data.image + '" class="cover" draggable="false"></span>\n              <img src="' + data.image + '" class="background-image" style="z-index: -1;" draggable="false">\n            ';

          // Кнопки
          elements.control = '\n              <!-- \u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u0442\u0440\u0435\u043A -->\n              ' + (data.actions.prev ? '\n                <button type="button" class="btn btn-secondary" data-trigger="prev">\n                  <i class="fas fa-angle-double-left fa-fw"></i>\n                </button>\n              ' : '') + '\n              <!-- \u041F\u0435\u0440\u0435\u043C\u043E\u0442\u0430\u0442\u044C \u043D\u0430\u0437\u0430\u0434 -->\n              ' + (data.actions.rewinding ? '\n                <button type="button" class="btn btn-secondary" data-trigger="undo-15s">\n                  <i class="fas fa-undo fa-fw"></i>\n                  <span class="d-none d-md-inline">15</span>\n                </button>\n              ' : '') + '\n              <!-- \u041F\u043B\u0435\u0439/\u041F\u0430\u0443\u0437\u0430 -->\n              ' + (data.status === true ? '\n                <button type="button" class="btn btn-secondary" data-trigger="pause">\n                  <i class="fas fa-pause fa-fw"></i>\n                </button>\n              ' : '\n                <button type="button" class="btn btn-secondary" data-trigger="play">\n                  <i class="fas fa-play fa-fw"></i>\n                </button>\n              ') + '\n              <!-- \u041F\u0435\u0440\u0435\u043C\u043E\u0442\u0430\u0442\u044C \u0432\u043F\u0435\u0440\u0435\u0434 -->\n              ' + (data.actions.rewinding ? '\n                <button type="button" class="btn btn-secondary" data-trigger="redo-15s">\n                  <i class="fas fa-redo fa-fw"></i>\n                  <span class="d-none d-md-inline">15</span>\n                </button>\n              ' : '') + '\n              <!-- \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0442\u0440\u0435\u043A -->\n              ' + (data.actions.next ? '\n                <button type="button" class="btn btn-secondary" data-trigger="next" >\n                  <i class="fas fa-angle-double-right fa-fw"></i>\n                </button>\n              ' : '') + '\n              <!-- \u0417\u0432\u0443\u043A -->\n              <button class="btn btn-secondary" data-trigger="volume">\n                <i class="fas fa-volume-up fa-fw"></i>\n                <span class="d-none d-md-inline">' + data.volume + '%</span>\n              </button>\n            ';

          /* Если элемента нету - создаём шаблон для него */
          if (this.layout.find('[data-id="' + data.id + '"]').length == 0) {
            this.layout.append('\n                <div class="list-group-item d-flex justify-content-between lh-condensed content" data-id="' + data.id + '">\n                  <div style="z-index: 2;">\n                    <!-- \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A -->\n                    <h6 class="my-0" data-value="title"></h6>\n                    <!-- \u0412\u0440\u0435\u043C\u044F -->\n                    <div class="text-muted" data-value="timeline"></div>\n                    <!-- \u041A\u043D\u043E\u043F\u043A\u0438 -->\n                    <div class="btn-group btn-group-justified" role="group" data-value="control" style="display: flex; flex-wrap: wrap-reverse;"></div>\n                    <!-- \u041A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0438 \u0424\u043E\u043D -->\n                    <div data-value="images"></div>\n                  </div>\n                </div>\n              ');
          }

          /* Обновляем требуемые данные */
          $.each(elements, function (element, html) {
            // Элемент
            var element = $('[data-id="' + data.id + '"] [data-value="' + element + '"]');
            if (element.attr('data-hash') != html.hashCode()) {
              element.html(html).attr('data-hash', html.hashCode());
            }
          });
        },

        // Иницилизация
        init: function init() {

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
              message: '\n                  <div class="browser-sound-widget-volume">\n                    <div id="browser-sound-widget-volume"></div>\n                  </div>\n                  <button class="btn btn-block btn-primary" style="margin-top: 10px;">\n                    \u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C\n                  </button>\n                '
            });
            // Слайдер
            var slider = noUiSlider.create(document.getElementById('browser-sound-widget-volume'), { range: { min: 0, max: 100 }, start: [handlers['browser-sound'].data[id].volume], step: 1, pips: { mode: 'count', values: 5 } });
            // Применяем
            $('.browser-sound-widget-volume').parent().find('.btn-primary').on('click', function () {
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
        relevance: function relevance(ids) {
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
        if (_typeof(handlers[widget_type]) !== 'object') return;

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
        if (_typeof(widgets[handler_type]) !== 'object' || widgets[handler_type].length == 0) {
          var handler = handlers[handler_type];
          handler.relevance([]);
        }
      });
    });

    /* Обновление определенного виджета */
    socket.on('widget.update', function (widget) {

      handlers[widget.widget].data[widget.id] = widget;

      // Если обработчика нету - пропускаем
      if (_typeof(handlers[widget.widget]) !== 'object') return;

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
    setInterval(function () {
      socket.emit('widget.refresh');
    }, 10000);

    /* Иницилизируем все виджеты */
    (function () {
      console.group("Иницилизация виджетов");
      $.each(handlers, function (type, handler) {
        // Если иницилизация не требуется
        if (typeof handler.init !== 'function') {
          console.log('[' + type + '] \u0418\u043D\u0438\u0446\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F');
          return;
        }
        // Иницилизируем
        try {
          handler.init();
        } catch (e) {
          console.error('[' + type + '] \u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043D\u0438\u0446\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u0438', e);
        } finally {
          console.info('[' + type + '] \u0418\u043D\u0438\u0446\u0438\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043F\u0440\u043E\u0448\u043B\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E');
        }
      });
      console.groupEnd();
    })();
  })();

  /* Ping */
  (function () {
    // Иницилизируем
    var startTime = Date.now();
    socket.emit('latency');

    // Обновляем Ping каждые 3.5 сек
    setInterval(function () {
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
  (function () {

    /* Иницилизация - форма ввода ключами */
    (function () {
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
    $('[data-secret-generate]').on('click', function () {
      $('[data-secret]').val(UUID());
      $('[data-secret-save]').focus();
    });

    /* Сохранение ключа */
    $('[data-secret-save]').on('click', function () {
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
  (function () {
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
    $(this).highlight({ source: 1, zebra: 1, indent: 'space', list: 'ol' });
  });
});