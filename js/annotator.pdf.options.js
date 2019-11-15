var updateProperties = function (annotation) {
    var el, type;
    if (annotation.highlights) {
        el = $(annotation.highlights);
        type = 'text';
    } else {
        el = $('.annotator-' + annotation.id);
        type = 'pdf';
    }

    var properties = annotation['properties'];

    if (type === 'pdf') {
        if (properties['borderColor'] || properties['borderWidth']) {
            el.css({ 'border-style': 'solid' })
        }

        if (properties['borderColor']) {
            el.css({ 'border-color': properties['borderColor'] })
        } else {
            el.css({ 'border-color': 'transparent' })
        }

        if (properties['fillColor']) {
            el.css({ 'background-color': properties['fillColor'] })
        } else {
            el.css({ 'background-color': 'transparent' })
        }

        if (properties['borderWidth']) {
            el.css({ 'border-width': properties['borderWidth'] + 'px' })
        }
    }

    if (type === 'text') {
        if (properties['underline']) {
            el.css({ 'border-bottom': '1px solid black' });
        } else {
            el.css({ 'border-bottom': 'none' });
        }

        if (properties['strikeThrough']) {
            el.addClass('strikeThrough');
        } else {
            el.removeClass('strikeThrough');
        }

        if (properties['redaction']) {
            el.css({ 'background-color': 'black' })
        } else if (properties['highlightColor']) {
            el.css({ 'background-color': properties['highlightColor'] })
        } else {
            el.css({ 'background-color': 'transparent' })
        }
    }
};

Annotator.Plugin.PdfOptions = (function (_super) {
    __extends(PdfOptions, _super);

    function PdfOptions() {
        PdfOptions.__super__.constructor.call(this, arguments);
    }

    PdfOptions.prototype.options = {};

    PdfOptions.prototype.pluginInit = function (options) {
        var self = this;
        this.annotator.subscribe("annotationCreated", updateProperties);
        this.annotator.subscribe("annotationUpdated", updateProperties);
        this.annotator.subscribe("annotationsLoaded", function (annotations) {
            annotations.forEach(function (ann) {
                if (ann.ranges) {
                    updateProperties(ann);
                }
            });
        });

        this.annotator.viewer.addField({
            load: function (field, annotation) {
                if (annotation.comments && annotation.comments.length) {
                    annotation.comments = annotation.comments.filter(c => c.text);
                    if (annotation.comments.length) {
                        var html = '<ul style="padding:0px">';
                        annotation.comments.forEach(function (comment) {
                            if (comment.text) {
                                html += '<li style="padding:10px">' + comment.text + '<br/>- ' + comment.added_by + ' / ' + new Date(comment.added_at) + '</li>';
                            }
                        });
                        html += '</ul>';
                        $(field).css('padding', '0px').html(html);
                        $(field).parent().find('div:first').hide();
                    }
                } else {
                    $(field).remove();
                }
            }
        });

        this.annotator.editor.addField({
            load: function (el, annotation) {
                if (!annotation.properties) {
                    annotation.properties = {};
                }

                if (!annotation.comments) {
                    annotation.comments = [{ added_by: USER_ID, added_at: Date.now() }];
                } else {
                    annotation.comments.push({ added_by: USER_ID, added_at: Date.now() });
                }

                if (annotation.shapes) {
                    $(el).show();
                    $(el).addClass('annotation-border-label');
                    $(el).html('<label class="border-label">Border</label>');
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.text) {
                    annotation.comments[annotation.comments.length - 1].text = annotation.text;
                } else {
                    annotation.comments = annotation.comments.filter(c => c.text);
                }

                delete annotation.text;
            }
        });

        this.annotator.editor.addField({
            label: 'Border',
            type: 'input',
            load: function (el, annotation) {
                if (annotation.shapes) {
                    $(el).show();
                    $(el).addClass('annotation-border-color');
                    self.updateBorderColor(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.shapes) {
                    self.saveBorderColor(el, annotation)
                }
            }
        });


        this.annotator.editor.addField({
            label: 'Fill',
            type: 'input',
            load: function (el, annotation) {
                if (annotation.shapes) {
                    $(el).show();
                    $(el).addClass('annotation-fill-color');
                    self.updateFillColor(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.shapes) {
                    self.saveFillColor(el, annotation);
                }
            }
        });

        this.annotator.editor.addField({
            label: 'highlight',
            type: 'input',
            load: function (el, annotation) {
                if (annotation.ranges) {
                    $(el).show();
                    $(el).addClass('annotation-text-highlight');
                    self.updateHighlightColor(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.ranges) {
                    self.saveHighlightColor(el, annotation);
                }
            }
        });


        this.annotator.editor.addField({
            type: 'input',
            load: function (el, annotation) {
                if (annotation.shapes) {
                    $(el).show();
                    $(el).addClass('annotation-border-width');
                    self.updateBorderWidth(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.shapes) {
                    self.saveBorderWidth(el, annotation);
                }
            }
        });


        this.annotator.editor.addField({
            label: 'underline',
            type: 'checkbox',
            load: function (el, annotation) {
                if (annotation.ranges) {
                    $(el).show();
                    $(el).addClass('annotation-text-underline');
                    self.updateUnderline(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.ranges) {
                    self.saveUnderline(el, annotation)
                }
            }
        });

        this.annotator.editor.addField({
            label: 'strikeThrough',
            type: 'checkbox',
            load: function (el, annotation) {
                if (annotation.ranges) {
                    $(el).show();
                    $(el).addClass('annotation-text-strikethrough');
                    self.updateStrikeThrough(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.ranges) {
                    self.saveStrikeThrough(el, annotation);
                }
            }
        });

        this.annotator.editor.addField({
            label: 'redaction',
            type: 'checkbox',
            load: function (el, annotation) {
                if (annotation.ranges) {
                    $(el).show();
                    $(el).addClass('annotation-text-redaction');
                    self.updateRedaction(el, annotation);
                } else {
                    $(el).hide();
                }
            },
            submit: function (el, annotation) {
                if (annotation.ranges) {
                    self.saveRedaction(el, annotation);
                }
            }
        });
    };

    // Border Color
    PdfOptions.prototype.updateBorderColor = function (el, annotation) {
        var borderColor = annotation.properties.borderColor
        if (typeof borderColor === 'undefined') {
            borderColor = "#f00";
        }

        $(el).find('input').addClass('borderColor').val(borderColor);
        $(el).find('input').parent().find('label').remove();
        $(el).find('input').before('<label>Color </label>');
        $(el).find('input').spectrum({
            color: borderColor,
            allowEmpty: true,
            preferredFormat: 'hex'
        });
    };

    PdfOptions.prototype.saveBorderColor = function (el, annotation) {
        annotation.properties.borderColor = $(el).find('input').val();
    };

    // Fill color
    PdfOptions.prototype.updateFillColor = function (el, annotation) {
        var fillColor = annotation.properties.fillColor
        if (typeof annotation.properties.fillColor === 'undefined') {
            fillColor = "rgba(255, 255, 10, 0.3)";
        }
        $(el).find('input').addClass('fillColor').val(fillColor);
        $(el).find('input').parent().find('label').remove();
        $(el).find('input').before('<label>Fill </label>')
        $(el).find('input').spectrum({
            color: fillColor,
            allowEmpty: true,
            showAlpha: true,
            preferredFormat: 'rgb',
        });
    };

    PdfOptions.prototype.saveFillColor = function (el, annotation) {
        annotation.properties.fillColor = $(el).find('input').val();
    };

    // border width
    PdfOptions.prototype.saveBorderWidth = function (el, annotation) {
        annotation.properties.borderWidth = $(el).find('input').val() || '0';
    };

    PdfOptions.prototype.updateBorderWidth = function (el, annotation) {
        var borderWidth = annotation.properties.borderWidth
        if (typeof annotation.properties.borderWidth === 'undefined') {
            borderWidth = "1";
        }

        $(el).find('input').addClass('borderWidth').val(borderWidth || 0);
        $(el).find('input').parent().find('label').remove();
        $(el).find('input').before('<label>Width </label>');
        $(el).find('input').after('<label> px</label>');
    };


    PdfOptions.prototype.updateUnderline = function (el, annotation) {
        $(el).find('input').prop('checked', annotation.properties.underline || false);
    };

    PdfOptions.prototype.saveUnderline = function (el, annotation) {
        annotation.properties.underline = $(el).find('input').prop('checked');
    };

    PdfOptions.prototype.updateStrikeThrough = function (el, annotation) {
        $(el).find('input').prop('checked', annotation.properties.strikeThrough || false);
    };

    PdfOptions.prototype.saveStrikeThrough = function (el, annotation) {
        annotation.properties.strikeThrough = $(el).find('input').prop('checked');
    };

    PdfOptions.prototype.updateRedaction = function (el, annotation) {
        $(el).find('input').prop('checked', annotation.properties.redaction || false);
    };

    PdfOptions.prototype.saveRedaction = function (el, annotation) {
        annotation.properties.redaction = $(el).find('input').prop('checked');
    };


    PdfOptions.prototype.updateHighlightColor = function (el, annotation) {
        var highlightColor = annotation.properties.highlightColor
        if (typeof annotation.properties.highlightColor === 'undefined') {
            highlightColor = "rgba(255, 255, 10, 0.3)";
        }
        $(el).find('input').addClass('highlightColor').val(highlightColor);
        $(el).find('input').parent().find('label').remove();
        $(el).find('input').before('<label>Highlight </label>')
        $(el).find('input').spectrum({
            color: highlightColor,
            allowEmpty: true,
            showAlpha: true,
            preferredFormat: 'rgb'
        });
    };

    PdfOptions.prototype.saveHighlightColor = function (el, annotation) {
        annotation.properties.highlightColor = $(el).find('input').val();
    };

    return PdfOptions;
})(Annotator.Plugin);
