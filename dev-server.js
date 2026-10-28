// Локальный сервер для разработки плагина.
// Раздаёт ui-tweaks.js и dev.js; при сохранении ui-tweaks.js страница Lampa перезагружается сама.
// Запуск: node dev-server.js  →  в Lampa добавить плагин http://localhost:3000/dev.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PLUGIN = path.join(__dirname, 'ui-tweaks.js');
const clients = new Set();

// Загрузчик: подключает свежий ui-tweaks.js и слушает события об изменениях
const devLoader = `(function () {
    // Берём адрес из src самого скрипта, чтобы работало и по IP из локальной сети
    var cur = document.currentScript && document.currentScript.src;
    var base = cur ? cur.replace(/\\/dev\\.js.*$/, '') : 'http://localhost:${PORT}';
    var s = document.createElement('script');
    s.src = base + '/ui-tweaks.js?t=' + Date.now();
    document.head.appendChild(s);

    var es = new EventSource(base + '/events');
    es.onmessage = function (e) {
        if (e.data === 'reload') location.reload();
    };
    console.log('[ui-tweaks dev] подключено к ' + base);
})();`;

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Cache-Control': 'no-store'
};

http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url !== '/events') console.log(new Date().toLocaleTimeString(), req.method, req.url, '←', req.headers.origin || req.headers.referer || '');

    if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        return res.end();
    }

    if (url === '/events') {
        res.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
        res.write(': connected\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
    }

    if (url === '/dev.js') {
        res.writeHead(200, { ...headers, 'Content-Type': 'application/javascript; charset=utf-8' });
        return res.end(devLoader);
    }

    if (url === '/ui-tweaks.js') {
        return fs.readFile(PLUGIN, (err, data) => {
            if (err) {
                res.writeHead(500, headers);
                return res.end(String(err));
            }
            res.writeHead(200, { ...headers, 'Content-Type': 'application/javascript; charset=utf-8' });
            res.end(data);
        });
    }

    res.writeHead(404, headers);
    res.end('not found');
}).listen(PORT, () => {
    console.log(`Dev-сервер: http://localhost:${PORT}/dev.js`);
    console.log('Слежу за ui-tweaks.js — сохраните файл, и Lampa перезагрузится');
});

// Редакторы часто пишут файл в несколько приёмов, поэтому чуть ждём
let timer;
fs.watch(PLUGIN, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        console.log(new Date().toLocaleTimeString(), 'ui-tweaks.js изменён → перезагрузка');
        for (const c of clients) c.write('data: reload\n\n');
    }, 150);
});
