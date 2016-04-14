/*global jQuery, window, autosize */
'use strict';
var loremIpsum,
    del1stSentence,
    getNewSelection,
    getBuildingBlock,
    splitIntoWords;

loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed dolor in ex pharetra congue. Ut sit amet dignissim tortor, consectetur feugiat augue. Nulla facilisi. Suspendisse vulputate est et sem aliquam, pulvinar iaculis purus vestibulum. Nullam dictum urna lorem, eget mattis ante dapibus eget. Aliquam eu ex vitae sapien aliquet sodales sit amet eget nunc. Curabitur feugiat neque vitae libero posuere dignissim. Sed sed mollis elit. Sed risus risus, tincidunt eu magna et, efficitur varius diam. Aliquam ut tortor varius, egestas dolor nec, vestibulum ante. Donec molestie porttitor pellentesque.  Integer cursus dui at molestie auctor. Aenean nibh ante, tempus quis bibendum at, cursus ut ante. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nam fringilla facilisis erat nec pharetra. Vivamus sollicitudin eros maximus, dictum nisi eget, porttitor neque. Nulla non eros et dui pellentesque commodo nec in eros. Nam neque est, suscipit placerat feugiat sed, accumsan ac quam. Vestibulum a efficitur mauris. Aliquam mauris libero, pretium quis nisi eu, maximus pharetra eros. Vestibulum justo metus, vehicula ut convallis ac, dignissim in metus. Pellentesque ultrices faucibus viverra.';


del1stSentence = function (text) {
    var dotIndex,
        askIndex,
        exclamationIndex,
        minIndex;
    dotIndex = text.indexOf('.');
    dotIndex = dotIndex > -1 ? dotIndex : Infinity;

    askIndex = text.indexOf('?');
    askIndex = askIndex > -1 ? askIndex : Infinity;

    exclamationIndex = text.indexOf('!');
    exclamationIndex = exclamationIndex > -1 ? exclamationIndex : Infinity;

    minIndex = Math.min(dotIndex, askIndex, exclamationIndex);
    minIndex = minIndex + 1 > text.length ? text.length : minIndex + 1;

    return text.substring(minIndex, text.length).trim();
};

getNewSelection = function (currentSelection, fullText) {
    var isCharOfList,
        isWhitespace,
        isSentenceEnd,
        beforeSelectionIndex,
        afterSelectionIndex,
        increase,
        inc,
        decrease,
        dec,
        getSelectionBound,
        getNextWordSelectionBound;


    isCharOfList = function (char, list) {
        return list.some(function (listChar) {
            return listChar === char;
        });
    };

    isWhitespace = function (char) {
        return isCharOfList(char, [' ', '\t', '\r', '\n']);
    };

    isSentenceEnd = function (char) {
        return isCharOfList(char, ['.', '?', '!', ',', ';']);
    };

    increase = function (index, maximum) {
        return Math.min(index + 1, maximum);
    };

    decrease = function (index, minimum) {
        return Math.max(index - 1, minimum);
    };

    inc = function (index) {
        return increase(index, fullText.length);
    };

    dec = function (index) {
        return decrease(index, 0);
    };

    getSelectionBound = function (index, fullText, operation, inverseOperation) {
        var updatedIndex,
            char;
        if (index === 0 && operation(index) === 0) {
            updatedIndex = index;
        } else if ((index >= fullText.length - 1) && (operation(index) >= fullText.length - 1)) {
            updatedIndex = index;
        } else {
            char = fullText.charAt(index);
            if (isWhitespace(char) || isSentenceEnd(char)) {
                updatedIndex = inverseOperation(index);
            } else {
                updatedIndex = getSelectionBound(operation(index), fullText, operation, inverseOperation);
            }
        }
        return updatedIndex;
    };

    getNextWordSelectionBound = function (index, fullText) {
        var updatedIndex,
            char;
        char = fullText.charAt(index);
        if (index === fullText.length - 1) {
            updatedIndex = index;
        } else if (isWhitespace(char) || isSentenceEnd(char)) { // skip over empty spaces and sentence end signs
            updatedIndex = getNextWordSelectionBound(index + 1, fullText);
        } else {
            updatedIndex = getSelectionBound(index, fullText, inc, dec);
        }
        return updatedIndex;
    };

    if (currentSelection.length === 0) {
        beforeSelectionIndex = getSelectionBound(currentSelection.start, fullText, dec, inc);
        afterSelectionIndex = getSelectionBound(currentSelection.end, fullText, inc, dec);
    } else {
        // expand selection to right to select the next word
        beforeSelectionIndex = currentSelection.start;
        afterSelectionIndex = getNextWordSelectionBound(currentSelection.end, fullText);
    }
    return {
        start: beforeSelectionIndex,
        end: afterSelectionIndex
    };
};

getBuildingBlock = function (text) {
    return '<li class="well selector">' +
                '<div class="action-container">' +
                    '<a href="#" class="text-danger" data-action="close"><i class="fa fa-times-circle"></i></a>' +
                    '<span class="text-right">' +
                        '<a href="#" data-action="split"><i class="fa fa-align-justify"></i></a>' +
                        '<a href="#" data-action="merge"><i class="fa fa-toggle-down"></i></a>' +
                    '</span>' +
                '</div>' +
                '<div class="container" data-content="true" ><textarea class="editable">' + text + '</textarea></div>' +
            '</li>';
};

splitIntoWords = function (text) {
    var words;
    words = text.split(/[\s\.,;?!]+/g);
    return words;
};

jQuery('document').ready(function () {

    var removeElement,
        split,
        merge,
        resizeTextAreas,
        lastWorkingSelection;

    removeElement = function (parentLi) {
        var elements, element, i;
        elements = parentLi.children();
        for (i = 0; i < elements.length; i += 1) {
            element = elements[i];
            jQuery(element).css('height', jQuery(element).innerHeight());
            jQuery(element).addClass('oli-hidden');
        }
        jQuery(parentLi).addClass('oli-hidden');
        window.setTimeout(function () {
            jQuery(parentLi).remove();
            resizeTextAreas();
        }, 300);
    };

    split = function (parentLi) {
        var element, text, words;
        element = parentLi.children('[data-content=true]').children('textarea');
        text = element.val();
        removeElement(parentLi);
        words = splitIntoWords(text);
        words.forEach(function (word) {
            if (word.length > 0) {
                jQuery('#selectionBlocks').append(getBuildingBlock(word));
            }
        });
    };

    merge = function (li, nextLi) {
        var textLi, textNextLi;
        textLi = li.children('[data-content=true]').children('textarea').val();
        textNextLi = nextLi.children('[data-content=true]').children('textarea').val();
        nextLi.children('[data-content=true]').children('textarea').val(textLi + ' ' + textNextLi);
        removeElement(li);
        autosize(nextLi.children('[data-content=true]').children('textarea'));
    };

    resizeTextAreas = function () {
        window.setTimeout(function () {
            autosize(jQuery('[data-content=true] textarea'));
        }, 300);
    };

    jQuery('#selectionBlocks').on('keyup', 'textarea', function () {
        resizeTextAreas();
    });

    jQuery('#selectionBlocks').sortable({
        axis: 'y'
    });

    jQuery('#loremIpsum').click(function (event) {
        event.preventDefault();
        jQuery('#inputText').val(loremIpsum);
    });
    jQuery('#delSentence').click(function (event) {
        var text,
            truncatedText;
        event.preventDefault();
        text = jQuery('#inputText').val();
        truncatedText = del1stSentence(text);
        jQuery('#inputText').val(truncatedText);
    });

    jQuery('#inputText').on('mouseup', function (event) {
        var selection;
        event.preventDefault();
        if (event.which === 1) {
            if (event.ctrlKey === false) {
                if (event.detail > 2) {
                    jQuery('#inputText').textrange('set', lastWorkingSelection.start, lastWorkingSelection.end - lastWorkingSelection.start + 1);
                }
                selection = getNewSelection(jQuery(this).textrange(), jQuery(this).val(), event);
                jQuery('#inputText').textrange('set', selection.start, selection.end - selection.start + 1);
                lastWorkingSelection = jQuery('#inputText').textrange();
            }
        }
    });

    jQuery('#inputText').on('dblclick', function (event) {
        event.preventDefault();
    });

    jQuery('#inputText').on('contextmenu', function (event) {
        var selection;
        event.preventDefault();
        selection = jQuery('#inputText').textrange();
        jQuery('#selectionBlocks').append(getBuildingBlock(selection.text));
        resizeTextAreas();
    });

    jQuery('#selectionBlocks').on('click', '[data-action=close]', function (event) {
        var parentLi;
        event.preventDefault();
        parentLi = jQuery(this).parents('li');
        removeElement(parentLi);
    });

    jQuery('#selectionBlocks').on('click', '[data-action=split]', function (event) {
        var parentLi;
        event.preventDefault();
        parentLi = jQuery(this).parents('li');
        split(parentLi);
        resizeTextAreas();
    });

    jQuery('#selectionBlocks').on('click', '[data-action=merge]', function (event) {
        var parentLi, nextLi;
        event.preventDefault();
        parentLi = jQuery(this).parents('li');
        nextLi = jQuery(parentLi).next();
        merge(parentLi, nextLi);
    });

    jQuery('#splitAll').on('click', function (event) {
        var elements, i;
        event.preventDefault();
        elements = jQuery('.selector');
        for (i = 0; i < elements.length; i += 1) {
            split(jQuery(elements[i]));
        }
    });

    jQuery('#mergeAll').on('click', function (event) {
        var elements, i, mergedText;
        event.preventDefault();
        event.stopPropagation();
        mergedText = '';
        elements = jQuery('[data-content=true] textarea.editable');
        for (i = 0; i < elements.length; i += 1) {
            mergedText += jQuery(elements[i]).val();
            mergedText += " ";
        }
        jQuery('#inputText').val(mergedText);
        resizeTextAreas();
    });

    jQuery('#deleteAll').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        jQuery('#selectionBlocks').html('');
    });

    jQuery('.add-char-block').on('click', function (event) {
        var value;
        event.preventDefault();
        value = jQuery(this).attr('data-value');
        jQuery('#selectionBlocks').append(getBuildingBlock(value));
    });
});