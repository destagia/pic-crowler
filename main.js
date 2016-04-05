var request = require('request');
var fs      = require('fs');

config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

function successDot() {
  process.stdout.write('\033[32m.\033[39m');
}

function errorDot() {
  process.stdout.write('\033[31m.\033[0m');
}

config = config.reduce(function (acc, next) {
  if (next.count > 1000) {
    var prev = 0;
    for (var count = next.count; count > 0; count -= 1000) {
      var clone = JSON.parse(JSON.stringify(next));
      clone.offset = prev;
      clone.count = Math.min(1000, count);
      acc.push(clone);
      prev += count;
    }
  } else {
    acc.push(next);
  }
  return acc;
}, []);

// send request API according to config.json.
// And, gather them out into a Array
var count = 0;
var promises = config.map(function (element) {
  var dir = 'dist/' + element.class;
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
    return new Promise(function (result, reject) {
      var keyword = element.keywords.join(' ');
      setTimeout(function () {
        request({
          url: 'https://api.photozou.jp/rest/search_public.json',
          qs: { keyword: keyword, limit: element.count || 100, offset: element.offset || 0 },
          method: 'GET',
          json: true
        }, function (error, response, body) {
          if (error) {
            result([]);
          } else if (body.stat === 'ok') {
            console.log('Search with keyword `' + keyword + '`');
            console.log(element.class + ' count: ' + body.info.photo.length);
            body.info.photo.forEach(function (p) { p.dir = element.class; });
            result(body.info.photo);
          } else {
            result([]);
          }
        });
      }, count * 2000);
      count += 1;
    });
});

console.log('Requesting API');
Promise.all(promises)
  .then(function (requests) {
    process.stdout.write('\nProcessing...');
    console.log()
    return Promise.resolve(requests
      .reduce(function (next, acc) { return acc.concat(next); }, [])
      .filter(function (photo) { return photo.image_url; } ));
  })
  .then(function (photos) {
    process.stdout.write('\nGathering ' + photos.length + ' images from WEB\n');
    return Promise.all(photos.map(function (photo) {
      return new Promise(function (result, reject) {
        request({
          url: photo.image_url,
          method: 'GET',
          json: false,
          encoding: 'binary'
        }, function (error, response, data) {
          if (error) {
            errorDot();
            result({stat: 'failed', error: error});
            return;
          } else {
            successDot();
            result({stat: 'ok', info: photo, data: data});
          }
        });
      });
    }));
  })
  .then(function (photos) {
    process.stdout.write('\nWriting image onto local\n');
    return Promise.all(photos.map(function (photo) {
      return new Promise(function (result, reject) {
        if (photo.stat == 'ok') {
          fs.writeFile("dist/" + photo.info.dir + "/" + photo.info.dir + "_" + photo.info.photo_id + ".jpg", photo.data, 'binary', function (err) {
            if (err) { errorDot(); return; }
            successDot();
            result();
          });
        } else {
          result();
        }
      });
    }));
  })
  .then(function (_) {
    console.log('\nFinish!');
  })
  .catch(function (error) { console.log(error.stack); });

