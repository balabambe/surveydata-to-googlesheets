var express = require('express');
var dayjs = require('dayjs')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var surveyRouter = require('./routes/survey');

var app = express();

var requestTime = function (req, res, next) {
  req.requestTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  next();
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestTime);

app.use('/survey', surveyRouter);

module.exports = app;
