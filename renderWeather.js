module.exports = {
  render: function(info, options) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var html = "";
    var forecast = JSON.parse(info);
    forecast = forecast.forecast;

    //console.log('weather', forecast);
    //console.log('options', options.date, options.nights)

    //which days to output
    var diff =  Math.floor((Date.parse(options.date) - new Date() ) / 86400000) + 1;
    //console.log('diff', diff)

    //only have access to 10 days
    var dayCount = diff + options.nights
    if(forecast && dayCount <= 10){
      html += "<table class='table'>";
      html += "<thead><tr><th colspan='2'>Silver Bay</th><th>Temp</th><th>Precip</th><th>Wind</th><th>Humidity</th><th>Dew Point</th></tr></thead>"
      for (var i = diff; i < dayCount; i++) {
        var dt = forecast.simpleforecast.forecastday[i]
        html += '<tr>'
        html += '<th><strong>' + dt.date.weekday_short + ' ' + dt.date.month + '/' + dt.date.day + '</strong></th>'
        html += '<td><img width="25" height="25" src="' + dt.icon_url + '"> ' + dt.conditions + '</td>'
        html += '<td>' + dt.high.fahrenheit + '°/' + dt.low.fahrenheit + '°</td>'
        html += '<td>' + dt.pop + '%' + '</td>'
        html += '<td>' + dt.avewind.dir + ' ' + dt.avewind.mph +  '-' + dt.maxwind.mph + 'mph</td>'
        html += '<td>' + dt.avehumidity + '%</td>'
        html += '<td>' + (Number(dt.high.fahrenheit) - ((100 - Number(dt.avehumidity))/5)) + '°</td>'

        html += '</tr>'
      }

      html += "</table>"
    }
    /*if(list){
      info.toDate = new Date(info.date);
      info.toDate.setDate(info.toDate.getDate() + info.nights);
      info.toDay = info.toDate.getDay();
      var dateRange = days[info.day] + ' ' + info.date + ' - ' + days[info.toDay] + ' ' + (info.toDate.getMonth()+1)+'/'+ info.toDate.getDate() +'/'+info.toDate.getFullYear();
      if(list.length > 0){
        //var url = info.uri || info.uri.href;
        html = '<h3><a target="_blank" href="'+ info.exturl +'">' + dateRange + ' — <span class="site-count"><span class="badge badge-primary">' + list.length +'</span> available sites</span></a></h3>';
        html += '<ul class="list list-inline">';

        list.forEach(function(item){
          html += '<li>' + item + '</li>';
        })

        html += '</ul>';
      } else {
        html = '<h3 class="nix">' + dateRange + ' — <span class="site-count"><span class="badge">0</span> sites</span></h3>';
      }
    } else {
        //error
        if(days[info.day]){
          html = '<h3 class="error">' + days[info.day] + ' ' + info.date + ' - <span class="site-count">no response</span></h3>';
        } else {
          html = '<h3 class="error">Check your start date</h3>';
        }
    }*/
    var d = new Date(options.date);

    return {[d.getTime() + 'w'] : html}
  }
}