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

    request += 'cols=' + $('#col-selector').val().join(',') + '&'
    request = request.replaceAll(' ','_')


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
        updateDataLite(generateFilters())
     })
}

function updateDataCached(additionalArgs={}) {
    /*
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
    */
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
                var optionArgForm = $(this).children('.chosen-single').children('span').text()
                optionArgForm = optionArgForm.replaceAll('\n','')
                if (optionArgForm.replaceAll(' ','').length > 0) {
                    filters[$(this).attr('title')] = optionArgForm
                }
            }
        })
        $('.date-select').each(function() {
            var setDate = $(this).val()
            if (setDate.length > 0) {
                filters[$(this).attr('title')] = setDate
            }
        })
    return(filters)
}

function submitQuery() {
    filters = generateFilters()
    updateDataLite(filters)
}

function listReplaceAll(ls,old_char,new_char) {
    var cleanedLs = []
    for (var i=0; i<ls.length; i++) {
        cleanedLs.push(ls[i].replaceAll(old_char,new_char))
    }
    return(cleanedLs)
}

function rebuildFilters() {
    var shown = listReplaceAll($('#col-selector').val(),' ','_')
    $('.chosen-container-single, .filter-label, .date-select').each(function() {
        if (shown.includes($(this).attr('title'))) {
            $(this).css('display','block')
        } else {
            $(this).css('display','none')
        }
    })
}

$(function() {

    $('.row').height($(document).height() - 20)

    $.getJSON('web-app/data-summary.json', 
        function(data) {
            var starterCols = ['Case_Number','Case_Status','Facility_Occurred','Received_Date','State','Subject_Primary']
            var notFiltered = ['Case_Number']

            var filterPanel = $('.filter-controls')

            /* add a filter for each item in data dictionary */
            $(data['Show_Columns']).each(function() {
                var filterTitle = String(this)
                if (!(notFiltered.includes(filterTitle))) {
                    filterPanel.append('<p class="filter-label" title="' + filterTitle + '">' + filterTitle.replace('_',' ') + '</p>')
                    if (filterTitle.toLowerCase().includes('date')) {
                        filterPanel.append('<input type="date" class="date-select" name="' + this + '" title="' + this + '"></select>')
                    } else {
                        filterPanel.append('<select data-placeholder=" " class="chosen-select filter-select" name="' + this + '" title="' + this + '"></select>')
                    }
                    
                }
            })
        
            /* load each of those filters with options. also load show column selector */
            $('.chosen-select').each(function() {
                var currSelector = $(this)
                currSelector.append('<option></option>')
                var selectTitle = currSelector.attr('title')
                var options = data[selectTitle]
                $(options).each(function() {
                    currSelector.append('<option>' + this.replaceAll('_',' ') + '</option>')
                })
            })
            
            /* activate all chosen selectors, update them, and set update data on interact */
            $(".filter-select").chosen({
                no_results_text: "Oops, nothing found!",
                allow_single_deselect: true
            })
            .val('').trigger('chosen:updated')
            .change(function() {
                submitQuery()
            })

            /* set the value of column selector to defaults, and init it */
            $('.chosen-select[title="Show_Columns"]').chosen({
                no_results_text: "Oops, nothing found!",
                max_selected_options: 6
            })
            .val(listReplaceAll(starterCols,'_',' ')).trigger('chosen:updated')
            .change(function() {
                submitQuery()
                rebuildFilters()
            })

            $('.date-select').on('input', function() {
                console.log('date changed')
                submitQuery()
            })

            rebuildFilters()

            /* update table with current filters */
            updateDataLite(generateFilters())
        }
    )

    $('.submit-button').on('click', function() {
        submitQuery()
    })

    $('#show-counter').on('input', function() {
        updateDataLite(generateFilters())
    })

    $('#page-counter').on('input', function() {
        updateDataLite(generateFilters())
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
        if (!($(this).attr('disabled') == 'disabled')) {
            $('#page-counter').val(parseInt($('#page-counter').val())+1)
            if ((frontData != null) && (currentData != frontData)) {
                updateTable(frontData)
            } else {
                updateDataLite(generateFilters())
            }
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

