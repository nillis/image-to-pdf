const express = require('express'),
    request = require('request'),
    pdfDocument = require('pdfkit'),   
    imageSize = require('image-size'),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    imageUpload = require('multer')({ dest: 'uploads/' });

const app = express();

app.use(express.static('public'));
app.use(function(err, req, res, next){
  if (!err) return next();
  res.send(500);
});

app.post('/image/convert', imageUpload.single('image'), (req, res) => {
    if(!req.file) {
        return res.status(400).send({ error: 'No valid image found' });
    }

    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': 'inline; filename=Untitled.pdf'
    });

    const doc = new pdfDocument();

    async.waterfall([
        cb => imageSize(req.file.path, cb),
        (size, cb) => {
            if(doc.page.width > size.width && doc.page.height > size.height) {
                cb(null, { x: (doc.page.width - size.width) / 2 , y: (doc.page.height - size.height) / 2, width: size.width, height: size.height });
            } else if(size.width / doc.page.width > size.height / doc.page.height) {
                cb(null, { x: 0, y: (doc.page.height - size.height / (size.width / doc.page.width)) / 2, width: doc.page.width });
            } else {
                cb(null, { x: (doc.page.width - size.width / (size.height / doc.page.height)) / 2, y: 0, height: doc.page.height });
            }          
        },
        (size, cb) => {
            doc.pipe(res);
            doc.image(req.file.path, size); 
            cb(); 
        },
        cb => fs.unlink(req.file.path, cb),
        cb => doc.end()
    ]);
});

app.listen(3000, () => console.log('Listening on port 3000'));