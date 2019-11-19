function saveStamp(el, data) {
    if (el.data('stamp')) {
        data.id = el.data('stamp').id;
    }
    data.added_by = USER.id;
    data.pdfId = PDF.id;
    data.date = Date.now();
    $.ajax({
        method: "POST",
        url: "./store.php?stamp=1",
        data
    }).done(function (data) {
        console.log(el);
        el.data('stamp', data);
    });
}

function deleteStamp(stamp) {
    $.ajax({
        method: "DELETE",
        url: "./store.php?stamp=1",
        data: stamp
    }).done(function (data) {
        console.log('stamp deleted')
    });
}

function loadStamp(page, callback) {
    $.ajax({
        method: "GET",
        url: "./store.php?stamp=1&page=" + page,
    }).done(function (data) {
        callback(data);
    });
}

function renderStamp(shape, draggable) {
    var div = $('<div class="stamp"></div>');
    div.css(shape);
    div.html(draggable);
    var trash = $('<img src="./images/trash.svg" class="delete-stamp" />');
    trash.on('click', function () {
        var stamp = $(this).parent().data('stamp');
        $(this).parent().remove();
        if (stamp) {
            deleteStamp(stamp);
        }
    });
    div.prepend(trash);
    return div;
}

function stampDraggable(el, shape) {
    el.draggable({
        containment: "parent",
        cursor: "move",
        scroll: true,
        stop: function (e) {
            var el = $(e.target);
            shape.top = el.css('top').replace('px', '');
            shape.left = el.css('left').replace('px', '');
            saveStamp(el, shape);
        },
    });
}

function getDateFormat(timestamp) {
    var date = moment(parseInt(timestamp));
    return date.format('h:m a, MMM D, Y');
}


$(document).on('ready', function () {
    Annotator.Viewer.prototype.onDeleteClick = function (event) {
        if (confirm('Do you want to delete this annotation along with comments?')) {
            return this.onButtonClick(event, "delete")
        }
    };

    $('.botton-stamp').on('click', function () {
        $('.stamp-collection').toggle();
    })
    $(".stamp-item").draggable({
        helper: 'clone',
        cursor: 'move',
    });

    document.addEventListener('load', function () {
        PDFViewerApplicationOptions.set('workerSrc', WORKER_URL);
        PDFViewerApplicationOptions.set('defaultUrl', PDF.url);
    }, true);

    document.addEventListener('documentloaded', function (params) {
        PDFViewerApplication.setTitle(PAGE_TITLE);
    });
    var highlightAnnotation = null;
    $('body').addClass('mode_' + MODE);
    $('.mode-' + MODE).addClass('active');

    document.addEventListener('textlayerrendered', function (event) {
        const num = event.detail.pageNumber;
        const content = $('#viewer').find('.page:nth-child(' + num + ')');
        if (content.data('annotator')) {
            content.data('annotator').destroy();
            content.removeData('annotator');
        }
        content.annotator();
        content.data('annotator').setupAnnotation = function (annotation) {
            if (annotation.ranges !== undefined || $.isEmptyObject(annotation)) {
                return content.data('annotator').__proto__.setupAnnotation.call(content.data('annotator'), annotation);
            }
        };
        content.annotator('addPlugin', 'Properties');
        content.annotator('addPlugin', 'Shape');
        content.annotator('addPlugin', 'Store', {
            prefix: 'store.php?action=',
            annotationData: {
                'page': num,
                'pdfId': PDF.id
            },
            loadFromSearch: {
                'page': num,
                'pdfId': PDF.id
            }
        });

        loadStamp(num, function (data) {
            if (data.rows && data.rows.length) {
                data.rows.forEach(function (v, i) {
                    var stamp = $('<div class= "stamp-block stamp-' + v.type + '" data-type="' + v.type + '" > ' + v.type + '</div>');
                    stamp.append('<span>by ' + v.added_by.name + ' at ' + getDateFormat(v.date) + ' </span>')
                    var div = renderStamp({
                        top: v.top + 'px',
                        left: v.left + 'px'
                    }, stamp);
                    div.data('stamp', v);
                    content.prepend(div);
                    stampDraggable(div, v);
                });
            }
        })

        content.find('.annotator-wrapper').droppable({
            accept: '.stamp-item',
            activeClass: "drop-area",
            drop: function (e, ui) {
                var droppable = $(this);
                var draggable = ui.draggable.clone();

                draggable.removeClass('stamp-item').removeClass('ui-draggable').removeClass('ui-draggable-handle');
                var offset = $('.ui-draggable-dragging').offset();
                var shape = {
                    top: offset.top - (content.offset().top + 10),
                    left: offset.left - (content.offset().left + 10)
                }

                draggable.append('<span>by ' + USER.name + ' at ' + getDateFormat(Date.now()) + ' </span>')
                var div = renderStamp(shape, draggable);
                droppable.parent().prepend(div);
                shape.type = draggable.data('type');
                shape.page = num;
                saveStamp(div, shape);
                setTimeout(() => {
                    stampDraggable($('.stamp'), shape);
                }, 100);
                $('.stamp-collection').hide();
            }
        });

        content.data('annotator').subscribe("annotationsLoaded", function (annotation) {
            if (annotation.length && highlightAnnotation && highlightAnnotation.page === num) {
                annotation.forEach(function (annotation) {
                    if (highlightAnnotation.id === annotation.id) {
                        var el = annotation.highlights ? $(annotation.highlights) : $('.annotator-' + annotation.id);
                        var position = el.offset();
                        var top = position.top + $('#viewerContainer').scrollTop();
                        var left = position.left - content.offset().left;
                        position.top = position.top - content.offset().top;
                        position.left = left + (el.width() / 2);
                        setTimeout(() => {
                            content.data('annotator').showViewer([annotation], position);
                        }, 100);
                    }
                });

                highlightAnnotation = null;
            }
            if (MODE == 'text') {
                content.find('.annotator-wrapper').boxer('destroy');
            }
        });
    }, true);

    $('.toggleMode').on('click', function (e) {
        e.preventDefault();
        if ($(this).data('mode') === 'text') {
            MODE = 'text';
            $(this).addClass('active');
            $('.mode-shape').removeClass('active');
            $('.page').find('.annotator-wrapper').boxer('destroy');
            $('body').removeClass('mode_shape').addClass('mode_text');
        } else {
            MODE = 'shape';
            $('.mode-shape').removeClass('active');
            $('.mode-text').removeClass('active');
            $(this).addClass('active');
            $('.page').find('.annotator-wrapper').boxer({ disabled: false, shape: $(this).data('mode') });
            $('body').removeClass('mode_text').addClass('mode_shape');
        }
        $('body').data('shape', $(this).data('mode'));
    });

    $('.deleteAnnotations').on('click', function () {
        if (confirm('Do you want to remove all annotations?')) {
            $.ajax({
                method: "DELETE",
                url: "./store.php?annotations=all",
            }).done(function () {
                $('.annotator-pdf-hl').remove();
                $('.annotator-hl').each(function () {
                    $(this).replaceWith($(this).text());
                })
            });
        }
    })

    $('#annotationFindInput').on('click', function () {
        if ($('.annotationsearchList').find('li').length) {
            $('.annotationsearchList').show();
        } else {
            $('.annotationsearchList').hide();
        }
    });

    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    $('#annotationFindInput').on('input', debounce(onAnnotationSearch, 500));

    function onAnnotationSearch() {
        var $this = $('#annotationFindInput')
        var q = $this.val().trim();
        if (q) {
            $this.attr('data-status', 'pending');
            $.ajax({
                method: "GET",
                url: "./store.php?search=" + q
            }).done(function (data) {
                var str = '<ul class="annotation-list">';
                var foundIds = [];
                $.each(data.rows, function (k, v) {
                    for (var comment of v.comments) {
                        if (!foundIds.includes(v.id) && comment.text.toLowerCase().includes(q.toLowerCase())) {
                            foundIds.push(v.id);
                            str += '<li class="item" data-page="' + v.page + '" data-id="' + v.id + '" data-annotation="' + v.id + '" ><span>' + v.page + '</span>' + comment.text + '</li>'
                        }
                    }
                });
                str += '</ul>';

                if (data.total < 1) {
                    str = "<div class='no-result'>Annotatiosn not found</div>";
                }

                $('.annotationsearchList').show().html(str);
            }).fail(function () {
                alert("error");
            }).always(function () {
                $this.attr('data-status', '');
            });

        } else {
            $this.attr('data-status', '');
            $('.annotationsearchList').hide();
        }
    }

    $(document).mouseup(function (e) {
        var container = $('.annotationsearchList');
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            container.hide();
        }
    });

    $(document).on('click', '.annotation-list .item', function () {
        $('.annotator-viewer').addClass('annotator-hide');
        $('.annotationsearchList').hide();
        var id = $(this).data('id');
        var page = $(this).data('page');
        const content = $('#viewer').find('.page:nth-child(' + page + ')');
        var found = false;
        if (content.find('.canvasWrapper').length) {
            content.find('.annotator-hl').each(function (i, a) {
                var a = $(this);
                var annotation = a.data('annotation');
                if (!found && annotation.id == id) {
                    found = true;
                    if (PDFViewerApplication.page !== page) {
                        PDFViewerApplication.pdfViewer.currentPageNumber = page;
                    }
                    setTimeout(() => {
                        var el = annotation.highlights ? $(annotation.highlights) : $('.annotator-' + annotation.id);
                        var position = el.offset();
                        var top = position.top + $('#viewerContainer').scrollTop();
                        var left = position.left - content.offset().left;
                        $('#viewerContainer').animate({
                            scrollTop: top - 200
                        }, '500');
                        position.top = position.top - content.offset().top;
                        position.left = left + (el.width() / 2);
                        content.data('annotator').showViewer([annotation], position);
                    }, 100);
                }
            });
        }

        if (!found) {
            highlightAnnotation = { id, page };
            PDFViewerApplication.pdfViewer.currentPageNumber = page;
        }
    });
});