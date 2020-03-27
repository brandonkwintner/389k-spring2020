var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var _ = require("underscore");
var dataUtil = require("./data-util");

var app = express();

var PORT = 3000;

// Load content of data.json into global variable.
var _DATA = dataUtil.loadData().powerlifters;

// Weight classes.
var WEIGHT_CLASSES = ["47kg", "52kg", "57kg", "63kg", "72kg", "84kg", 
                      "84kg+", "59kg", "66kg", "74kg", "83kg", "93kg", 
                      "105kg", "120kg", "120kg+"];

// MIDDLEWARE.
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

// Home Screen.
app.get('/',function(req,res){
  var names = []
  for( powerlifter of _DATA ) { 
    names.push(powerlifter['name'])
  }
  console.log(names)
  res.render('home',{
    data: _DATA,
    names: names
  });
});

// Add new Powerlifter.
app.get('/addPowerlifter', function(req, res) {
  res.render('create');
});

app.post('/addPowerlifter', function(req, res) {
  if(!req.body) return res.send("No Data Received!");
  
  // Formats object.
  var body = req.body;
  body.squat = parseInt(body.squat)
  body.bench = parseInt(body.bench)
  body.deadlift = parseInt(body.deadlift)
  body.favorite_brands = body.favorite_brands.split(',')

  _DATA.push(body);
  dataUtil.saveData(_DATA);

  // Response
  res.redirect("/");
});

/* --- BEGIN NAV BAR LINKS --- */

// Loads the 3 Powerlifters with the heaviest squat.
app.get('/heaviest_squats', function(req,res){
    var sorted = _DATA.sort((a, b) => (a.squat < b.squat) ? 1 : -1)
    
    res.render('home',{
      header: "Heaviest Squats:",
      data: sorted.slice(0,3)
    });
});

// Loads the 3 Powerlifters with the heaviest bench.
app.get('/heaviest_benches', function(req,res){
  var sorted = _DATA.sort((a, b) => (a.bench < b.bench) ? 1 : -1)
  
  res.render('home',{
    header: "Heaviest Benches:",
    data: sorted.slice(0,3)
  });
});

// Loads the 3 Powerlifters with the heaviest deadlift.
app.get('/heaviest_deadlifts', function(req,res){
  var sorted = _DATA.sort((a, b) => (a.deadlift < b.deadlift) ? 1 : -1)
  
  res.render('home',{
    header: "Heaviest Deadlifts:",
    data: sorted.slice(0,3)
  });
});

// Loads the 3 Powerlifters with the heaviest totals.
app.get('/heaviest_totals', function(req,res){
  var sorted = _DATA.sort((a, b) => 
  ((a.squat + a.bench + a.deadlift) < (b.squat + b.bench + b.deadlift)) 
  ? 1 : -1)
  
  res.render('home',{
    header: "Heaviest Totals:",
    data: sorted.slice(0,3)
  });
});

// Loads all Powerlifters in alphabetical order.
app.get('/alphabetical', function(req,res){
  sorted = _DATA.sort((a, b) => (a.name > b.name) ? 1 : -1)
  
  res.render('home',{
    header: "Powerlifters in Alphabetical Order:",
    data: sorted
  });
});

/* --- END NAV BAR LINKS --- */

/* --- BEGIN API's --- */

app.get('/api/getPowerlifters',function(req,res){
  res.json(_DATA);
});

// Weight class is a string in the form (ex: 83kg)
app.get('/api/weight_class/:weight_class',function(req,res){
  var _weight_class = req.params.weight_class;
  var result = _.findWhere(_DATA, {weight_class: _weight_class});

  // Invalid weight class.
  if( !WEIGHT_CLASSES.includes(_weight_class) ) {
    return res.json("Invalid weight class");
  }
  if (!result) return res.send({});

  res.send(result);
});

// Names to be FIRST NAME ONLY.
app.get('/api/name/:name',function(req,res){
  var _name = req.params.name
  var result = _.findWhere(_DATA, {name: _name});

  if (!result) return res.send({});

  res.send(result);
});

// Returns name and the specified lift.
app.get('/api/:lift/minimum/:minimum',function(req,res){

  var _lift = req.params.lift;
  var _minimum = parseInt(req.params.minimum);

  var result = [];

  // Searches through all powerlifters.
  for(powerlifter of _DATA) {

    if(powerlifter[_lift] >= _minimum) {
      var curr = {
        "name": powerlifter.name,
        _lift: powerlifter._lift
      };

      result.push(curr);
    }
  }
  res.send(result);
});

// Returns name and total.
app.get('/api/total/:minimum',function(req,res){

  var _minimum = parseInt(req.params.minimum);
  var result = [];

  // Searches through all powerlifters.
  for(powerlifter of _DATA) {

    var total = powerlifter["squat"] + powerlifter["bench"] + powerlifter["deadlift"];

    if(total >= _minimum) {
      var curr = {
        "name": powerlifter.name,
        "total": total
      };

      result.push(curr);
    }
  }
  res.send(result)
});

// POST endpoint route.
// ENTER favorite brands separated by comma, no space!
app.post('/api/addPowerlifter', function(req,res){
  if(!req.body) return res.send("No Data Received!");

  // Formats object.
  var body = req.body;
  body.squat = parseInt(body.squat)
  body.bench = parseInt(body.bench)
  body.deadlift = parseInt(body.deadlift)
  body.favorite_brands = body.favorite_brands.split(',')

  _DATA.push(body);
  dataUtil.saveData(_DATA);

  // Response
  res.send(body)
});

/* --- END API's --- */

app.listen(process.env.PORT || PORT, function() {
    console.log('Listening on port:', PORT);
});
