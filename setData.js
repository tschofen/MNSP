module.exports = {
  set: function(data, fields, results) {
    if(fields){

    } else {
      fields = {};
      var d = new Date();
      if(d.getDay() < 5){
        d.setDate(d.getDate() + (5 - d.getDay));
      } else if(d.getDay() > 5){
        d.setDate(d.getDate() + 6);
      }
      //set default values
      fields.startDate = (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear();
      fields.length = 2; //number of nights
      fields.week = 4; //number of weeks to check
      fields.park = "70|Split Rock Lighthouse State Park";
    }

    var result = data.toString().replace(/\|startDate\|/g, fields.startDate);
    result = result.replace(/\|length\|/g, fields.length);
    result = result.replace(/\|week\|/g, fields.week);
    var re = new RegExp(fields.park);
    result = result.replace(re, fields.park + '" selected="selected');

    if(results){
      result = result.replace(/<!-- RESULTS -->/g, results);
    }
    return result;
  }
}