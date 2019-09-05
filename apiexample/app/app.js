var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const config = require('./config.json');

var Order = require('./api/models/orders');

var app = express();

mongoose.Promise = global.Promise;

const options = {
  useNewUrlParser: true
};

mongoose.connect(config.dbConfig.url, options).then(()=>{
  console.log('MongoDB is connected')
}).catch(err=>{
  console.log('MongoDB connection to ', config.dbConfig.url, ' failed')
});

var indexRouter = require('./routes/index');
var ordersRouter = require('./routes/orders');
var healthRouter = require('./routes/health');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/orders', ordersRouter);
app.use('/health', healthRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
