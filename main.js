var request = require('request');
var fs      = require('fs');

config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));


if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

var requests = config.map(function (element) {
  return function () {
    var dir = 'dist/' + element.class;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    element.keywords.forEach(function (keyword) {

      var options = {
        url: 'https://api.photozou.jp/rest/search_public.json',
        qs: { keyword: keyword },
        method: 'GET',
        json: true
      }
      request(options, function (error, response, body) {
        if (body.stat === 'ok') {
          body.info.photo.forEach(function (photo) {
            request({
              url: photo.image_url,
              method: 'GET',
              json: false,
              encoding: 'binary'
            }, function (error, response, data) {
              fs.writeFile(dir + "/" + photo.photo_id + ".jpg", data , 'binary', function (err) {
                if (err) { console.log(err); }
              });
            });
          });
        }
      });

    });
  };

});

function main() {
  if (requests.length == 0) {
    console.log('finish!');
    return;
  }
  console.log('request...');
  requests.pop()();
  console.log('waiting for API limitation...');
  setTimeout(main, 2000);
}

main();