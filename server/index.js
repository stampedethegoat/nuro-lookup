const nuro    = require('../scripts/nuro-script');
const parsed  = require('../scripts/parser');

const Papa    = require('papaparse');
const axios   = require('axios');
const express = require('express')
const fs      = require('fs')
const path    = require('path');
const app     = express()

const port = process.env.PORT || 5000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

app.use('/static', express.static(path.join(__dirname, '..', 'public')));
console.log(path.join(__dirname, '..', 'public'));

app.get('/', (req, res) => res.render('home'));

app.get('/api/:taskId', (req, res) => {
  const taskId   = req.params.taskId;
  if (typeof taskId !== 'string' || taskId.length < 24) throw Error
  const taskLink = `https://www.scaleapi.com/scalers/tasks?lidarId=${taskId}&force=1`;
  let dateSubmitted, report, errorRate, reportToBeParsed, detailedReport;

  fs.readFile('database/nuro-mail-parser.csv', 'utf8', (err, data) => {
    if (err) throw err;
    let results = Papa.parse(data, { header: true });

    results.data.forEach(element => {
      if (taskId === element['Task ID']) {
        detailedReport = element['Detailed Report'];
        dateSubmitted  = element['Date'];
        errorRate      = element['Error Rate'];
      }
    });

    reportToBeParsed = axios.get(detailedReport);

    reportToBeParsed.then(data => {
      report = nuro(data.data);
      res.render('table', {
        report        : parsed(report),
        taskLink      : taskLink,
        taskId        : taskId,
        dateSubmitted : dateSubmitted,
        numErrors     : report.length,
        errorRate     : errorRate
      });
    }).catch(err => console.log(err));
  })
});

app.listen(port, () => console.log('listening on server localhost:5000'));
