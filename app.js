const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
const Html_Pdf = require('html-pdf');
const Handlebars = require('handlebars');
const template = fs.readFileSync('template.hbs', 'utf8');
const DOC = Handlebars.compile(template);

app.use(express.static(__dirname + '/public'));
function _createPdfStream(html) {
  return new Promise(function (resolve, reject) {
    let border = '25px';
    let pdf_options = {
      format: 'letter',
      border: { top: border, right: border, bottom: border, left: border },
      footer: {
        height: '30px',
        width: '100%',
        content: {
          default: `<div class='footer' style='text-align:right'>
                    <span class='c7'> {{page}} </span>
                    </div>`,
        },
      },
    };
    Html_Pdf.create(html, pdf_options).toStream(function (err, stream) {
      if (err) {
        return reject(err);
      }
      return resolve(stream);
    });
  });
}

function _streamToBuffer(stream, cb) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  stream.on('end', () => {
    return cb(null, Buffer.concat(chunks));
  });
  stream.on('error', (e) => {
    return cb(e);
  });
}
router.get('/', (req, res) => {
  try {
    let html = DOC({});
    _createPdfStream(html).then((stream) => {
      _streamToBuffer(stream, function (err, buffer) {
        if (err) {
          throw new Error(err);
        }
        let namePDF = 'Name-PDF';
        res.setHeader(
          'Content-disposition',
          "inline; filename*=UTF-8''" + namePDF
        );
        res.setHeader('Content-type', 'application/pdf');
        return res.send(buffer);
      });
    });
  } catch (err) {
    console.log('Error:', err);
    res.statusCode = 400;
    res.json({ error: 400, details: err });
  }
});
app.use('/', router);
app.listen(process.env.PORT || 3000, function () {
  console.log(
    'Express server listening on port %d in %s mode',
    this.address().port,
    app.settings.env
  );
});
