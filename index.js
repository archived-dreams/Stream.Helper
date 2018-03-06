'use strict';
const express = require('express');
const app = express();
const fs = require('fs');
const io_server = require('socket.io');
const uuid = require('uuid/v1');
const uuid_validate = require('uuid-validate');
const forEach = require('async-foreach').forEach;


// Http и Https сервер
const http = require('http').Server(app);
const https = require('https').createServer({
                key: fs.readFileSync("/etc/letsencrypt/live/klybok.net/privkey.pem"),
                cert: fs.readFileSync("/etc/letsencrypt/live/klybok.net/fullchain.pem"),
                ca: fs.readFileSync("/etc/letsencrypt/live/klybok.net/chain.pem")
              }, app);


const widgets = {
  'browser-sound': { }
};

// Системная информвция
var system_info = {
  socket: require('./package.json').version
};

// TimeStamp
const TimeStamp = () => {
  return Math.floor(Date.now() / 1000);
};

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});



// Скрываем или удаляем не активные виджеты
setInterval(() => {
  // Список типов виджетов
  Object.keys(widgets).forEach(function(widget_type) {
    // Список клиентов
    Object.keys(widgets[widget_type]).forEach(function(clientSecret) {
      // Список виджетов
      Object.keys(widgets[widget_type][clientSecret]).forEach(function(widget_id) {
        var widget = widgets[widget_type][clientSecret][widget_id];
        if (widget._active < TimeStamp() - 25) {
          // Если виджет неактивен более 25 секунд - удаляем
          delete widgets[widget_type][clientSecret][widget_id];
          // Если у юзера больше нет виджетов - удаляем
          if (widgets[widget_type][clientSecret].length == 0) {
            delete widgets[widget_type][clientSecret];
          }
        } else if (widget._active < TimeStamp() - 3) {
          // Если виджет неактивен более 3х секунд - скрываем
          widgets[widget_type][clientSecret][widget_id]._hidden = true;
        }
      });
    });
  });
}, 1000);

// Получаем виджеты по clientSecret
const get_widgets = function (clientSecret) {
  var _widgets = {};
  // Список типов виджетов
  Object.keys(widgets).forEach(function(widget_type) {
    _widgets[widget_type] = typeof widgets[widget_type][clientSecret] != 'object' ? {} : widgets[widget_type][clientSecret];
  });

  return _widgets;
};

// Сокет на обоих портах
['http', 'https'].forEach(function (type) {
  var io = io_server(eval(type));

  // Подключились
  io.on('connection', function (socket) {
    // Вносим пользователя в "базу"
    var user = {
      id: uuid(),
      type: false,
      secret: false
    };

    // Уведомляем о том что подключились
    socket.emit('connected');

    // Отправляем системную информацию
    socket.emit('system.info', system_info);

    // Получаем идентификатор пользователя
    socket.on('set.secret', function (data) {
      // Проверяем правильность ключа
      if (typeof data !== 'object' || !data.secret || !uuid_validate(data.secret) || typeof data.type != 'string') {
        socket.emit('set.secret', false);
        return;
      }
      // Если ранее мы состояли в другой комнате - выходим
      if (user.secret) {
        socket.leave(user.secret);
        socket.leave(`${user.secret}_widget`);
        socket.leave(`${user.secret}_client`);
      }
      // Устанавливаем новую комнату
      user.secret = data.secret;
      socket.join(user.secret);
      socket.join(`${user.secret}_${data.type}`);
      // Уведомляем о том что ключ успешно установлен
      socket.emit('set.secret', user.id);
    });

    // Добавляем элемент в виджете
    socket.on('widget.add', function (data) {
      if (!user.secret || typeof data.widget != 'string') return;
      // Устанавливаем нужные переменные
      var tmp_id = data.tmp_id;
      var id = uuid();
      data.id = id;
      data._active = TimeStamp();
      data._user = user.id;
      // Добавляем виджет
      if (typeof widgets[data.widget][user.secret] !== 'object')
        widgets[data.widget][user.secret] = { };
      widgets[data.widget][user.secret][id] = data;
      // Уведомляем
      socket.emit(`widget.set_id`, {  tmp_id, id, widget: data.widget });
      // Добавляем в комнату
      socket.join(`${user.secret}_widget[${id}]`);
      // Уведомляем клиентов
      io.to(`${user.secret}_client`).emit('widget.update', data);
    });

    // Обновление элементов в виджете
    socket.on('widget.update', function (data) {
      if (!user.secret || typeof data.widget != 'string' || typeof data.id != 'string') return;

      // Обновляем активность
      data._active = TimeStamp();
      data._user = user.id;

      // Если нет такого объекта
      if (typeof widgets[data.widget][user.secret] !== 'object')
        widgets[data.widget][user.secret] = { };

      // Обновляем данные
      if (typeof widgets[data.widget][user.secret][data.id] == 'undefined') {
        // Если виджета еще нету (Например был перезапуск ноды) создаем и отправляем юзеру
        if (typeof widgets[data.widget][user.secret] !== 'object')
          widgets[data.widget][user.secret] = { };
        widgets[data.widget][user.secret][data.id] = data;
        // Уведомляем клиента
        io.to(`${user.secret}_client`).emit('widget.update', data);
        // Вступаем в комнату
        socket.join(`${user.secret}_widget[${data.id}]`);
      } else {
        // Проверяем, есть ли изменения?
        var has_changes = (() => {
          var check = {
            new: JSON.parse(JSON.stringify(data)),
            old: JSON.parse(JSON.stringify(widgets[data.widget][user.secret][data.id]))
          };
          check.old._active = check.old._user = check.new._active = check.new._user = true;
          return JSON.stringify(check.new) != JSON.stringify(check.old);
        })();
        // Обновляем данные в "базе"
        if (typeof widgets[data.widget][user.secret] !== 'object')
          widgets[data.widget][user.secret] = { };
        widgets[data.widget][user.secret][data.id] = data;
        // Если изменения были - отправляем
        if (has_changes) {
          io.to(`${user.secret}_client`).emit('widget.update', data);
        }
      }
    });

    // Обновление всего списка виджетов
    socket.on('widget.refresh', function (data) {
      socket.emit('widget.refresh', get_widgets(user.secret));
    });

    // Шлём команду
    socket.on('widget.command', function (data) {
      if (!user.secret || typeof data.id != 'string') return;
      io.to(`${user.secret}_widget[${data.id}]`).emit('widget.command', data);
    });

    // Нотификации
    socket.on('notification.add', function (data) {
      io.to(`${user.secret}_client`).emit('notification.get', data);
    });

    // Ответ на PING запрос
    socket.on('latency', function () {
      socket.emit(`latency`, Math.random());
    });

    // При отключении
    socket.on('disconnect', function() {
      // Удаляем виджеты
      Object.keys(widgets).forEach(function(widget_type) {
        // Если у виджета есть данные связанные с пользователем
        if (typeof widgets[widget_type][user.secret] !== 'undefined') {
          Object.keys(widgets[widget_type][user.secret]).forEach(function(widget_id) {
            // Если это виджет отключившегося пользователя - удаляем
            if (widgets[widget_type][user.secret][widget_id]._user == user.id) {
              delete widgets[widget_type][user.secret][widget_id];
            }
          });
          // Если неосталось элементов - удаляем
          if (widgets[widget_type][user.secret].length == 0) {
            delete widgets[widget_type][user.secret];
          }
        }
      });
      // Отправляем новый список виджетов клиентам
      io.to(`${user.secret}_client`).emit('widget.refresh', get_widgets(user.secret));
    });

  });

});

http.listen(3000, function(){
  console.log('[HTTP] Listening on *:3000');
});


https.listen(3001, function(){
  console.log('[HTTPS] Listening on *:3001');
});
