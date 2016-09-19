module.exports = {
  set: function(data, fields) {
    if(fields){

    } else {
      fields = {};
      var d = new Date();
      if(d.getDay() < 5){
        d.setDate(d.getDate() + (5 - d.getDay()));
      } else if(d.getDay() > 5){
        d.setDate(d.getDate() + 6);
      }
      //set default values
      fields.startDate = (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear();
      fields.nights = 2; //number of nights
      fields.week = 4; //number of weeks to check
      fields.park = "70|Split Rock Lighthouse State Park";
    }

    var result = data.toString().replace(/\|startDate\|/g, fields.startDate);
    result = result.replace(/\|nights\|/g, fields.nights);
    result = result.replace(/\|week\|/g, fields.week);
    var re = new RegExp(fields.park);
    result = result.replace(re, fields.park + '" selected="selected');

    return result;
  },

  setResults: function(data, results){
    var keys = [],
      k, i, len

    //combine array of results into one object so we can sort it
    var resultObject = results.reduce(function(result, currentObject) {
      for(var key in currentObject) {
        if (currentObject.hasOwnProperty(key)) {
          result[key] = currentObject[key];
        }
      }
      return result;
    }, {});

    keys = Object.keys(resultObject)
    keys.sort();

    results = [];
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      results.push(resultObject[k])
    }

    if(results.length > 0){
      return data.replace(/<!-- RESULTS -->/g, results.join(""));
    }

    return data;
  }
}