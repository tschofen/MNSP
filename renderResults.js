module.exports = {
  render: function(info, list) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    //console.log('list in module', info.nights);
    var html = "";
    if(list){
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
    }
    var d = new Date(info.date);

    return {[d.getTime()] : html};
  }
}