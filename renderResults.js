module.exports = {
  render: function(list, info) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    //console.log('list in module', list, info.loc, info.uri.href);
    var html = '<h3>' + info.loc + ' - <a target="_blank" href="'+ info.uri.href +'">' + days[info.day] + ' ' + info.date + '</a></h3>';
    html += '<ul class="list list-inline">';

    list.forEach(function(item){
      html += '<li>' + item + '</li>';
    })

    html += '</ul>';
    return html;
  }
}