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
  
    for (var i = 0; i < data.length; i++) {
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

    request += 'cols=' + ['Case_Number','Case_Status','Subject_Primary','Facility_Occurred','Received_Date','State'].join(',') + '&'

    $.each(parameters, function(key, value) {
        request += key + '=' + value + '&'
    })
    
    if (request[request.length-1] == '&') {
        request = request.slice(0,request.length-1)
    }

    console.log(request)

    return(request)
}

function tableStriationReset() {
    $('tr').each(function(index) {
        if ((index % 2) != 0) {
            $(this).css('background-color','#f6f6f6')
        } else {
            $(this).css('background-color','white')
        }
    })
}

function updateTable(data) {
    showLoader()
    currentData = data
    $('#data-table').empty()
    buildHtmlTable('#data-table',data['cases'])
    tableStriationReset()
    stopLoader()
    $('tr').on('click', function() {
        tableStriationReset()
        $(this).css('background-color','lightblue')
    })
    $('th').each(function() {
        $(this).text($(this).text().replace('_',' '))
    })
}

function appendBackendArgs(argDict,pageOffset=0) {
    var result = Object.assign({},
                                argDict,
                                {
                                    'show':$('#show-counter').val(),
                                    'page':Math.max(($('#page-counter').val()-1+pageOffset),0),
                                }
                            )
    return(result)
}

var backData = null;
var frontData = null;
var currentData = null;

function updateDataLite(additionalArgs={}) {
    showLoader()
    $.getJSON(makeRequest(appendBackendArgs(additionalArgs)), 
        function(data) {
            lastPage = data['metadata']['last_page']
            stopLoader()
            updateTable(data)
        }
    )
    .fail(function() { 
        console.log('update data lite api call error, retrying')
        stopLoader()
        updateDataLite()
     })
}

function updateDataCached(additionalArgs={}) {
    showLoader()
    $.getJSON(makeRequest(appendBackendArgs(additionalArgs,pageOffset=1)), 
        function(data) {
            frontData = data
        }
    )
    $.getJSON(makeRequest(appendBackendArgs(additionalArgs,pageOffset=-1)), 
        function(data) {
            backData = data
            stopLoader()
        }
    )
}

function showLoader() {
    $('.fa-spinner').css('display','block')
    $('.button').attr('disabled','disabled')
}

function stopLoader() {
    $('.fa-spinner').css('display','none')
    $('.button').removeAttr('disabled')
}


function generateFilters() {
    var filters = {}
        $('.chosen-container').each(function() {
            if ($(this).attr('title') != 'Show_Columns') {
                var optionArgForm = $(this).children('.chosen-single').text()
                optionArgForm = optionArgForm.replaceAll('\n','').replaceAll(' ','')
                if (optionArgForm.length > 0) {
                    filters[$(this).attr('title')] = optionArgForm
                }
            }
        })
    return(filters)
}

$(function() {

    $('.row').height($(document).height() - 20)

    $(".chosen-select").chosen({
        no_results_text: "Oops, nothing found!"
      })

    $('.submit-button').on('click', function() {
        filters = generateFilters()
        updateDataLite(filters)
        updateDataCached(filters)
    })
    
    updateDataLite(generateFilters())
    updateDataCached(generateFilters())

    $('#show-counter').on('input', function() {
        updateDataLite(generateFilters())
    })

    $('#page-counter').on('input', function() {
        updateDataLite(generateFilters())
        updateDataCached(generateFilters())
    })

    /* left button behavior */
    $('#left-button').on('click', function() {
        if (!($(this).attr('disabled') == 'disabled') && ($('#page-counter').val() >= 2)) {
            $('#page-counter').val(parseInt($('#page-counter').val())-1)
            if ((backData != null) && (backData != currentData)) {
                updateTable(backData)
            } else {
                updateDataLite(generateFilters())
            }
            updateDataCached(generateFilters())
        }
    })

    /* left button hover styling */
    $('#left-button>i').on('mouseleave', function() {
        $(this).removeClass('fa-circle-arrow-left').removeClass('fa-solid')
        $(this).addClass('fa-regular').addClass('fa-circle-left')
    })

    $('#left-button>i').on('mouseenter', function() {
        $(this).addClass('fa-circle-arrow-left').addClass('fa-solid')
        $(this).removeClass('fa-regular').removeClass('fa-circle-left')
    })

    /* right button behavior */
    $('#right-button').on('click', function() {
        console.log('button clicked')
        if (!($(this).attr('disabled') == 'disabled')) {
            $('#page-counter').val(parseInt($('#page-counter').val())+1)
            if ((frontData != null) && (currentData != frontData)) {
                updateTable(frontData)
            } else {
                updateDataLite(generateFilters())
            }
            updateDataCached(generateFilters())
        }
    })

    /* right button hover styling */
    $('#right-button>i').on('mouseleave', function() {
        $(this).removeClass('fa-circle-arrow-right').removeClass('fa-solid')
        $(this).addClass('fa-regular').addClass('fa-circle-right')
    })

    $('#right-button>i').on('mouseenter', function() {
        $(this).addClass('fa-circle-arrow-right').addClass('fa-solid')
        $(this).removeClass('fa-regular').removeClass('fa-circle-right')
    })



    
 
});

