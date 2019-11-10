var updateProperties = function (annotation) {
    var el, type;
    if (annotation.highlights) {
        el = $(annotation.highlights);
        type = 'text';
    } else {
        el = $('.annotator-' + annotation.id);
        type = 'pdf';
    }

    if (type === 'pdf') {
        if (annotation['borderColor'] || annotation['borderWidth']) {
            el.css({ 'border-style': 'solid' })
        }

        if (annotation['borderColor']) {
            el.css({ 'border-color': annotation['borderColor'] })
        } else {
            el.css({ 'border-color': 'transparent' })
        }

        if (annotation['fillColor']) {
            el.css({ 'background-color': annotation['fillColor'] })
        } else {
            el.css({ 'background-color': 'transparent' })
        }

        if (annotation['borderWidth']) {
            el.css({ 'border-width': annotation['borderWidth'] + 'px' })
        }
    }

    if (type === 'text') {
        if (annotation['underline']) {
            el.css({ 'border-bottom': '1px solid black' });
        } else {
            el.css({ 'border-bottom': 'none' });
        }

        if (annotation['strikeThrough']) {
            el.addClass('strikeThrough');
        } else {
            el.removeClass('strikeThrough');
        }

        if (annotation['redaction']) {
            el.css({ 'background-color': 'black' })
        } else if (annotation['highlightColor']) {
            el.css({ 'background-color': annotation['highlightColor'] })
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

        this.annotator.editor.addField({
            load: function (el, annotation) {
                if (annotation.shapes) {
                    $(el).show();
                    $(el).addClass('annotation-border-label');
                    $(el).html('<label class="border-label">Border</label>');
                } else {
                    $(el).hide();
                }
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
                self.saveBorderColor(el, annotation)
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
            label: 'Width',
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
        var borderColor = annotation.borderColor
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
        annotation['borderColor'] = $(el).find('input').val();
    };

    // Fill color
    PdfOptions.prototype.updateFillColor = function (el, annotation) {
        var fillColor = annotation.fillColor
        if (typeof annotation.fillColor === 'undefined') {
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
        annotation['fillColor'] = $(el).find('input').val();
    };

    // border width
    PdfOptions.prototype.saveBorderWidth = function (el, annotation) {
        annotation['borderWidth'] = $(el).find('input').val() || 0;
    };

    PdfOptions.prototype.updateBorderWidth = function (el, annotation) {
        var borderWidth = annotation.borderWidth
        if (typeof annotation.borderWidth === 'undefined') {
            borderWidth = "1";
        }

        $(el).find('input').addClass('borderWidth').val(borderWidth || 0);
        $(el).find('input').parent().find('label').remove();
        $(el).find('input').before('<label>Width </label>');
        $(el).find('input').after('<label> px</label>');
    };


    PdfOptions.prototype.updateUnderline = function (el, annotation) {
        $(el).find('input').prop('checked', annotation.underline || false);
    };

    PdfOptions.prototype.saveUnderline = function (el, annotation) {
        annotation['underline'] = $(el).find('input').prop('checked');
    };

    PdfOptions.prototype.updateStrikeThrough = function (el, annotation) {
        $(el).find('input').prop('checked', annotation.strikeThrough || false);
    };

    PdfOptions.prototype.saveStrikeThrough = function (el, annotation) {
        annotation['strikeThrough'] = $(el).find('input').prop('checked');
    };

    PdfOptions.prototype.updateRedaction = function (el, annotation) {
        $(el).find('input').prop('checked', annotation.redaction || false);
    };

    PdfOptions.prototype.saveRedaction = function (el, annotation) {
        annotation['redaction'] = $(el).find('input').prop('checked');
    };


    PdfOptions.prototype.updateHighlightColor = function (el, annotation) {
        var highlightColor = annotation.highlightColor
        if (typeof annotation.highlightColor === 'undefined') {
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
        annotation['highlightColor'] = $(el).find('input').val();
    };

    return PdfOptions;
})(Annotator.Plugin);
