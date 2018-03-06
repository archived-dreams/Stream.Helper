(() => {
  console.info('[Stream.Helper] Файл API (remote.js) успешно загружен');

  /* Помощники */

  // Формат времени
  var formatTime = function(e, t) {
    var o, n, i;
    return e = Math.max(e, 0), n = Math.floor(e % 60), o = 10 > n ? "0" + n : n, e = Math.floor(e / 60), i = e % 60, o = i + ":" + o, e = Math.floor(e / 60), (e > 0 || t) && (10 > i && (o = "0" + o), o = e + ":" + o), o
  }

  // Валидация UUID
  var isUUID = function (uuid) {
      if (uuid[0] === "{") { uuid = uuid.substring(1, uuid.length - 1); }
      var regexUuid = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
      return regexUuid.test(uuid);
  }

  /* Определяем URL в зависимости от протокола */
  var url = 'https://klybok.net:3001';

  /* Подключен ли jQuery */
  var has_jquery = typeof jQuery == 'function';

  /* Стартуем скрипт */
  var init = function () {

    // Если jQuery подключен только для нашего плагина - включаем noConflict
    if (!has_jquery) {
      var $ = jQuery.noConflict(true);
    } else {
      var $ = jQuery;
    }

    $(() => {

      // Определяем наш Secret ключ
      var is_inited = false;
      var secret = $('[data-stream-helper-secret]').first().attr('data-stream-helper-secret');

      // Если ключ неуказан, завершаем работу скрипта
      if (typeof secret === 'undefined' || !isUUID(secret)) {
        console.error('[Stream.Helper] Неверный ключ иницилизации!');
        return;
      }

      /* Подключаем сокеты */
      var script = document.createElement('script');
      script.src = `${url}/socket.io/socket.io.js`;
      document.body.appendChild(script);

      /* При ошибке загрузки ноды */
      script.onerror = () => {
        console.error('[Stream.Helper] Неудалось загрузить файл API сокетов (socket.io.js), перезагрузите страницу');
      };

      /* При загрузке ноды иницилизируем скрипт */
      script.onload = () => {

        /* Подключаемся к сокетам */
        var socket = io(url);

        /* Действие при подключении */
        socket.on('connected', function (data) {
          console.info('[Stream.Helper] Соединение успешно установлено');
          // Устанавливаем ключ
          socket.emit('set.secret', {
            secret: secret,
            type: 'widget'
          });
        });

        /* Действие при отключении */
        socket.on('disconnect', function () {
          console.error('[Stream.Helper] Ошибка соединения. Проверьте подключение к сети');
        });

        /* Плееры */
        var elements = {};

        /* Готовые пресеты работы с медиа */
        var handlers = {

          /* Вконтакте */
          vk_com_music: {

            // Иницилизация
            init: (is_timeout) => {

              // Проверяем, если домен не vk.com, завершаем иницилизацию
              if (window.location.hostname != 'vk.com') {
                return "Домен не соответствует";
              }

              // Если аудиоплеер не запущен пробуем позднее
              if (typeof getAudioPlayer !== 'function') {
                setTimeout(handlers.vk_com_music.init, 5000, true);
                return "Поиск плеера иницилизирован";
              }

              // Добавляем элемент
              elements.vk_com_music = handlers.vk_com_music;
              // Логируем результат
              if (typeof is_timeout !== 'undefined') {
                console.info('[Stream.Helper] Плеер `vk_com_music` иницилизирован');
              } else {
                return "Плеер `vk_com_music` иницилизирован";
              }
            },

            // Требуется ли удаление
            has_delete: () => {
              return false;
            },

            // Название
            title: () => {
              try {
                if (typeof getAudioPlayer()._currentAudio[3] == 'undefined' && typeof getAudioPlayer()._currentAudio[4] == 'undefined') throw "No title";
                return `${ getAudioPlayer()._currentAudio[3] } - ${ getAudioPlayer()._currentAudio[4] }`;
              } catch(e) {
                return 'Плейлист пуст';
              }
            },

            // Картинка
            image: () => {
              try {
                var images = getAudioPlayer()._currentAudio[14].split(",");
                if (images.length == 0) throw "No image";
                var image = images.length == 1 ? images[0] : images[1];
                if (image == '' || image == null || image == false) throw "No image";
                return image;
              } catch(e) {
                return '/img/empty.png';
              }
            },

            // Таймлайн
            timeline: () => {
              try {
                if (typeof getAudioPlayer()._currentAudio[5] == 'undefined') throw "No duration";
                return `${ formatTime(Math.round(getAudioPlayer()._currentAudio[5] * getAudioPlayer().getCurrentProgress())) } / ${ formatTime(Math.round(getAudioPlayer()._currentAudio[5])) }`;
              } catch(e) {
                return '00:00 / 00:00';
              }
            },

            // Звук
            volume: () => {
              return Math.ceil(getAudioPlayer().getVolume() * 100);
            },

            // Домент
            domain: () => {
              return 'vk.com';
            },

            // Действия
            actions: () => {
              return {
                'rewinding': true,
                'prev': true,
                'next': true
              };
            },

            // Статус (Плей/пауза)
            status: () => {
              return getAudioPlayer().isPlaying();
            },

            // Следующая
            _next: () => {
              return getAudioPlayer().playNext();
            },

            // Предыдущий
            _prev: () => {
              return getAudioPlayer().playPrev();
            },

            // Перемотка
            _rewind: (data) => {
              getAudioPlayer()._impl._currentAudioEl.currentTime += data;
            },

            // Звук
            _volume: (data) => {
              return getAudioPlayer().setVolume(data / 100);
            },

            // Плей
            _play: () => {
              return getAudioPlayer().play();
            },

            // Пауза
            _pause: () => {
              return getAudioPlayer().pause();
            },

            _hidden: () => {
              return false;
            }

          },

          /* DI.FM */
          di_fm: {

            // Иницилизация
            init: (is_timeout) => {

              // Проверяем, если домен не www.di.fm, завершаем иницилизацию
              if (window.location.hostname != 'www.di.fm') {
                return "Домен не соответствует";
              }

              // Если аудиоплеер не запущен пробуем позднее
              try {
                window.di.app.WebplayerApp.Adapter.adapter.options.model.attributes.track.attributes.track;
              } catch(e) {
                setTimeout(handlers.di_fm.init, 2000, true);
                return "Поиск плеера иницилизирован";
              }

              // Добавляем элемент
              elements.di_fm = handlers.di_fm;
              // Логируем результат
              if (typeof is_timeout !== 'undefined') {
                console.info('[Stream.Helper] Плеер `di_fm` иницилизирован');
              } else {
                return "Плеер `di_fm` иницилизирован";
              }
            },

            // Требуется ли удаление
            has_delete: () => {
              return false;
            },

            // Название
            title: () => {
              try {
                return window.di.app.WebplayerApp.Adapter.adapter.options.model.attributes.track.attributes.track;
              } catch(e) {
                return 'Stopped';
              }
            },

            // Картинка
            image: () => {
              try {
                var image = window.di.app.WebplayerApp.Adapter.adapter.options.model.attributes.track.attributes.asset_url;
                return image == '' || image == null || !image ? '/img/empty.png' : image
              } catch(e) {
                return '/img/empty.png';
              }
            },

            // Таймлайн
            timeline: () => {
              try {
                var duration =  window.di.app.WebplayerApp.Adapter.adapter.options.model.attributes.track.attributes.content.length;
                var current =  window.di.app.WebplayerApp.Adapter.adapter.el.currentTime;
                return `${ formatTime(Math.round(current)) } / ${ formatTime(Math.round(duration)) }`;
              } catch(e) {
                return '00:00 / 0:00:00';
              }
            },

            // Звук
            volume: () => {
              return Math.ceil( window.di.app.WebplayerApp.Adapter.adapter.el.volume * 100);
            },

            // Домент
            domain: () => {
              return 'www.di.fm';
            },

            // Действия
            actions: () => {
              return {
                'rewinding': false,
                'prev': false,
                'next': false
              };
            },

            // Статус (Плей/пауза)
            status: () => {
              return ! window.di.app.WebplayerApp.Adapter.adapter.el.paused;
            },

            // Следующая
            _next: () => {
              return false;
            },

            // Предыдущий
            _prev: () => {
              return false;
            },

            // Перемотка
            _rewind: (data) => {
              return false;
            },

            // Звук
            _volume: (data) => {
              return  window.di.app.WebplayerApp.Adapter.adapter.el.volume = data / 100;
            },

            // Плей
            _play: () => {
              return  window.di.app.WebplayerApp.Adapter.adapter.el.play();
            },

            // Пауза
            _pause: () => {
              return  window.di.app.WebplayerApp.Adapter.adapter.el.pause();
            },

            // Требуется ли скрыть
            _hidden: () => {
              return false;
            }

          },

          /* Twitch.tv */
          twtich_tv: {

            // Иницилизация
            init: (is_timeout) => {

              // Проверяем, если домен не www.twitch.tv, завершаем иницилизацию
              if (window.location.hostname != 'www.twitch.tv') {
                return "Домен не соответствует";
              }

              // Если видеоплеер не запущен пробуем позднее
              try {
                if ($('.channel-header__user').length != 1) throw "No video";
                if ($('.player-video video[webkit-playsinline]').length != 1) throw "No video";
              } catch(e) {
                setTimeout(handlers.twtich_tv.init, 2000, true);
                return "Поиск плеера иницилизирован";
              }

              // Добавляем элемент
              elements.twtich_tv = handlers.twtich_tv;
              // Логируем результат
              if (typeof is_timeout !== 'undefined') {
                console.info('[Stream.Helper] Плеер `twtich_tv` иницилизирован');
              } else {
                return "Плеер `twtich_tv` иницилизирован";
              }
            },

            // Требуется ли удаление
            has_delete: () => {
              return $('.player-video video[webkit-playsinline]').length != 1;
            },

            // Название
            title: () => {
              try {
                if ($('.channel-info-bar [data-a-target="stream-title"]').length == 1) {
                  // Просмотр стрима
                  return $('.channel-info-bar [data-a-target="stream-title"]').html();
                } else if ($('.persistent-player [data-test-selector="persistent-player-mini-title"]').length == 1) {
                  // PIP
                  return $('.persistent-player [data-test-selector="persistent-player-mini-title"]').text();
                } else if ($('[data-test-selector="qa-video-watch-page"]').length == 1) {
                  // Просмотр записи
                  return $('[data-test-selector="qa-video-watch-page"] p.tw-ellipsis[title]').html();
                } else {
                  throw "No title";
                }
              } catch(e) {
                return $('title').html();
              }
            },

            // Картинка
            image: () => {
              try {
                return $('.channel-header__user .tw-avatar img').attr('src');
              } catch(e) {
                return '/img/empty.png';
              }
            },

            // Таймлайн
            timeline: () => {
              try {
                if ($('.channel-info-bar [data-a-target="stream-title"]').length == 1) {
                  // Просмотр стрима
                  var viewers = $('.channel-info-bar [data-a-target="channel-viewers-count"]').text().trim();
                  if (viewers == '') viewers = 0;
                  var count = $('.channel-info-bar [data-a-target="total-views-count"]').text().trim();
                  var game = $('.channel-info-bar [data-a-target="stream-game-link"]').text().trim();
                  return `<i class="fas fa-users fa-fw"></i> ${ viewers }, <i class="fas fa-eye fa-fw"></i> ${ count }<span class="d-none d-md-inline">, <i class="fas fa-gamepad fa-fw"></i> ${ game }</span>`;
                } else if ($('.persistent-player [data-test-selector="persistent-player-mini-title"]').length == 1) {
                  // PIP
                  return $('title').html();
                } else if ($('[data-test-selector="qa-video-watch-page"]').length == 1) {
                  // Просмотр записи
                  var count = `<i class="fas fa-eye fa-fw"></i> ${$('[data-test-selector="qa-video-watch-page"] [data-test-selector="total-views"] .tw-stat__value').text().trim()}`;
                  var game = `<i class="fas fa-gamepad fa-fw"></i> ${$('[data-test-selector="qa-video-watch-page"] [data-a-target="video-info-game-link"]').text().trim()}`;
                  return `${ count }<span class="d-none d-md-inline">, ${ game }</span>`;
                } else {
                  throw "No timeline";
                }

              } catch(e) {
                return '-';
              }
            },

            // Звук
            volume: () => {
              try {
                return $('.player-video video[webkit-playsinline]').get(0).volume * 100;
              } catch(e) {
                return 0;
              }
            },

            // Домент
            domain: () => {
              return 'www.twitch.tv';
            },

            // Действия
            actions: () => {
              return {
                'rewinding': false,
                'prev': false,
                'next': false
              };
            },

            // Статус (Плей/пауза)
            status: () => {
              try {
                return ! $('.player-video video[webkit-playsinline]').get(0).paused;
              } catch(e) {
                return false;
              }
            },

            // Следующая
            _next: () => {
              return false;
            },

            // Предыдущий
            _prev: () => {
              return false;
            },

            // Перемотка
            _rewind: (data) => {
              return false;
            },

            // Звук
            _volume: (data) => {
              $('[class="player-volume__slider-container"]').find('[aria-valuenow]').attr('aria-valuenow', data / 100);
              $('[class="player-volume__slider-container"]').find('.player-slider__left').css('width', `${data}%`);
              $('[class="player-volume__slider-container"]').find('.player-volume__slider-thumb').css('left', `${data}%`);
              return $('.player-video video[webkit-playsinline]').get(0).volume = data / 100;
            },

            // Плей
            _play: () => {
              return $('.player-video video[webkit-playsinline]').get(0).play();
            },

            // Пауза
            _pause: () => {
              return $('.player-video video[webkit-playsinline]').get(0).pause();
            },

            // Требуется ли скрыть
            _hidden: () => {
              console.log($('.channel-info-bar [data-a-target="stream-title"]').length == 1 && $('#root-player .player-streamstatus__icon--offline').length == 1);
              if ($('.channel-info-bar [data-a-target="stream-title"]').length == 1 && $('#root-player .player-streamstatus__icon--offline').length == 1) {
                return true;
              } else {
                return false;
              }
            }

          },

          /* DonatePay.ru */
          donatepay_ru: {

            // Иницилизация
            init: () => {

              // Проверяем, если домен не donatepay.ru, завершаем иницилизацию
              if (window.location.hostname != 'donatepay.ru') {
                return "Домен не соответствует";
              }

              // Есть ли плеер
              if (typeof youtube !== 'object' || typeof youtube.play_next !== 'function') {
                return "Нет Youtube плеера";
              }

              // Добавляем элемент
              elements.donatepay_ru = handlers.donatepay_ru;
              // Логируем результат
              return "Плеер `donatepay_ru` иницилизирован";
            },

            // Требуется ли удаление
            has_delete: () => {
              return false;
            },

            // Название
            title: () => {
              try {
                var title = youtube.player.getVideoData().title;
                if (title == '') throw "No title";
                return title;
              } catch(e) {
                return 'Нет активного трека';
              }
            },

            // Картинка
            image: () => {
              return '/img/donatepay.jpg';
            },

            // Таймлайн
            timeline: () => {
              try {
                var duration = youtube.player.getDuration();
                var current = youtube.player.getCurrentTime();
                return `${ formatTime(Math.round(current)) } / ${ formatTime(Math.round(duration)) }`;
              } catch(e) {
                return '00:00 / 00:00';
              }
            },

            // Звук
            volume: () => {
              return Math.ceil( youtube.player.getVolume() );
            },

            // Домент
            domain: () => {
              return 'donatepay.ru';
            },

            // Действия
            actions: () => {
              return {
                'rewinding': true,
                'prev': false,
                'next': true
              };
            },

            // Статус (Плей/пауза)
            status: () => {
              return youtube.player.getPlayerState() == 1;
            },

            // Следующая
            _next: () => {
              return youtube.play_next();
            },

            // Предыдущий
            _prev: () => {
              return false;
            },

            // Перемотка
            _rewind: (data) => {
              return youtube.player.seekTo( youtube.player.getCurrentTime() + data );
            },

            // Звук
            _volume: (data) => {
              return youtube.player.setVolume(data);
            },

            // Плей
            _play: () => {
              return youtube.player.playVideo();
            },

            // Пауза
            _pause: () => {
              return youtube.player.pauseVideo();
            },

            // Требуется ли скрыть
            _hidden: () => {
              return youtube.player.getVideoUrl() === 'https://www.youtube.com/watch';
            }

          }


        };

        /* Пользовательские пресеты */
        if (typeof window.streamHelper_customHandlers === 'object') {
          handlers = Object.assign(handlers, window.streamHelper_customHandlers);
        }

        /* Иницилизация */
        var init = function () {
          console.group("[Stream.Helper] Иницилизация обработчиков");
          $.each(handlers, function (type, handler) {
            // Если нет иницилизационной точки
            if (typeof handler.init !== 'function') {
              console.error(`[${type}] Нет точки иницилизации`);
              return;
            }
            // Иницилизируем
            try {
              var result = handler.init();
            } catch (e) {
              console.error(`[${type}] Ошибка иницилизации`, e);
            } finally {
              console.info(`[${type}] ${result}`);
            }
          });
          console.groupEnd();
        };

        /* Отправка данных на сервер */
        setInterval(function () {
          // Перебираем массив плееров
          $.each(elements, function (tmp_id, api) {

            // Получаем данные
            var data = {
              id: typeof api.id == 'undefined' ? false : api.id,
              widget: 'browser-sound',
              title: api.title(),
              tmp_id: tmp_id,
              image: api.image(),
              timeline: api.timeline(),
              volume: api.volume(),
              domain: api.domain(),
              actions: api.actions(),
              status: api.status(),
              _hidden: api._hidden()
            };

            // Если мы ожидаем назначения ID, пропускаем
            if (data.id === 'wait') {
              return;
            }

            // Если нету ID, иницилизируемся на ноде
            if (!data.id) {
              elements[tmp_id].id = 'wait';
              socket.emit('widget.add', data);
              return;
            }

            // Требуется ли удаление
            if (api.has_delete()) {
              socket.emit('widget.delete', data);
              delete elements[tmp_id];
              return;
            }

            // Обновляем данные
            socket.emit('widget.update', data);

          });
        }, 700);

        /* При получении команды */
        socket.on('widget.command', function (data) {
          // Если нету ID или это не виджет `browser-sound`
          if (typeof data.id === 'undefined' || data.widget != 'browser-sound') {
            console.error(`[Stream.Helper] Команда не может быть выполнена`, data);
            return;
          }

          // Выбираем нужный нам виджет
          var api = false;
          $.each(elements, function (tmp_id, element) {
            if (element.id == data.id) {
              api = element;
            }
          });

          // Если неудалось найти элемент
          if (!api) {
            console.error(`[Stream-Helper] Ошибка выполнения команды «${data.command}», медиа элемент не найден (ID: ${data.id})`, elements);
            return;
          }

          // Если нет такой команды
          if (typeof api[`_${data.command}`] !== 'function') {
            console.error(`[Stream-Helper] Ошибка выполнения команды «${data.command}», Команда не найдена (ID: ${data.id})`);
            return;
          }

          // Выполняем команду
          try {
            // В зависимости от того есть ли значение у команды - выполняем функцию по разному
            if (typeof data.value !== 'undefined') {
              api[`_${data.command}`](data.value);
            } else {
              api[`_${data.command}`]();
            }
          } catch(e) {
            // Ошибка выполнения команды. Уведомляем клиента и выводим ошибку в консоль.
            console.error(`[Stream-Helper] Ошибка выполнения команды «${data.command}» (ID: ${data.id})`);
            socket.emit('notification.add', { message: `Ошибка выполнения команды «${data.command}»`, type: 'danger' });
          }
        });

        /* При получении ID для плеера */
        socket.on('widget.set_id', function (data) {
          // Если виджета с таким tmp_id нету
          if (typeof elements[data.tmp_id] === 'undefined') {
            console.warn(`[Stream.Helper] Ошибка назначения ID «${data.id}» для плеера «${data.tmp_id}» Плеер не найден)`, data);
            return;
          }
          // Назначаем ID
          elements[data.tmp_id].id = data.id;
          console.info(`[Stream-Helper] Для плеера «${data.tmp_id}» успешно установлен ID: ${data.id}`);
        });

        /* Проверка ключа */
        socket.on('set.secret', function (data) {
          // Ошибка установки ключа
          if (!data) {
            console.error('[Stream.Helper] Ошибка установки ключа иницилизации!');
            return;
          }
          // Иницилизируем работу скрипта
          if (is_inited == false) {
            is_inited = true;
            init();
          }
        });
      };

    });

  };

  /* Подключаем jQuery */
  if (!has_jquery) {
    var script = document.createElement('script');
    script.src = `${url}/js/jquery.js`;
    document.body.appendChild(script);
    script.onload = init;
  } else {
    init();
  }

})();
