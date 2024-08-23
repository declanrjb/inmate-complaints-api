var myList = [
    { "name": "abc", "age": 50 },
    { "age": "25", "hobby": "swimming" },
    { "name": "xyz", "hobby": "programming" }
  ];
  
  // Builds the HTML Table out of myList.
  function buildHtmlTable(selector,data) {
    var columns = addAllColumnHeaders(data, selector);
  
    for (var i = 0; i < data.length; i++) {
      var row$ = $('<tr/>');
      for (var colIndex = 0; colIndex < columns.length; colIndex++) {
        var cellValue = data[i][columns[colIndex]];
        if (cellValue == null) cellValue = "";
        row$.append($('<td/>').html(cellValue));
      }
      $(selector).append(row$);
    }
  }
  
  // Adds a header row to the table and returns the set of columns.
  // Need to do union of keys from all records as some records may not contain
  // all records.
  function addAllColumnHeaders(data, selector) {
    var columnSet = [];
    var headerTr$ = $('<tr/>');
  
    for (var i = 0; i < myList.length; i++) {
      var rowHash = data[i];
      for (var key in rowHash) {
        if ($.inArray(key, columnSet) == -1) {
          columnSet.push(key);
          headerTr$.append($('<th/>').html(key));
        }
      }
    }
    $(selector).append(headerTr$);
  
    return columnSet;
  }

function makeRequest(parameters,base='https://inmate-complaints-api-1.onrender.com/complaints') {
    var request = base + '?'

    $.each(parameters, function(key, value) {
        request += key + '=' + value + '&'
    })
    
    if (request[request.length-1] == '&') {
        request = request.slice(0,request.length-1)
    }

    return(request)
}

$(function() {

    var rows = 10

    $('.row').height($(document).height() - 20)

    $.getJSON(makeRequest({'Case_Status':'Accepted',
                            'show':10}), 
        function(data) {
            console.log(data['cases'])
            buildHtmlTable('#data-table',data['cases'])
        }
    )


 
});

