# Stream.Helper
Решение для удаленной работы со стримом (Например: Управление музыкой)

# Пример
Ознакомится с примером можно по ссылке: [https://klybok.net:3001/](https://klybok.net:3001/)

# Установка
В папке для установки выполните команды:
```
# git clone git@github.com:IvanDanilov/Stream.Helper.git .
# npm install
```
В файле ___index.js___ укажите путь к SSL сертификату (___const https___). Для запуска сервера выполните команду (сервер займет 3000 (http) и 3001 (https) порты):
```
# npm install forever
# forever start index.js
```
или
```
# node index.js
```
В файлах __./public/js/remote.js__ (var url) и __./public/index.html__ (script.src) укажите свой домен.
При внесении правок в файл __./public/js/app.js__ выполните команду:
```
# gulp
```
