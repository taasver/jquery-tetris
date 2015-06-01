/* 
 * Library that adds tetris to your page
 * 
 * Requires:
 *  1. jQuery
 *  2. jQuery UI
 * 
 * Sample usage: 
 *  1. Create a div - <div id="tetris-container"></div>
 *  2. $('#tetris-container').tetris();
 * 
 * author: Taavi Aasver [taavi.aasver@gmail.com]
 * version: 1.1
 */
(function($) {

    $.fn.tetris = function(options) {

        var settings = $.extend({
            saveservice: false,
            cellsinrow: 10,
            cellsincolumn: 20,
            csscellmargin: 2,
            labelpause: 'Paused',
            labelrestart: 'Restart',
            labelgameover: 'Game Over!',
            labelyourname: 'Name',
            labelsubmitscore: 'Submit score',
            labelalltime: 'All time',
            labellast7days: 'Last 7 days',
            labellevel: 'Level',
            labelabout: 'i',
            shapes: [[3, 1, 4, 1, 5, 1, 6, 1], [3, 0, 3, 1, 4, 1, 5, 1], [3, 1, 4, 1, 5, 0, 5, 1], [4, 0, 5, 0, 4, 1, 5, 1],
                [3, 1, 4, 0, 4, 1, 5, 0], [3, 1, 4, 0, 4, 1, 5, 1], [3, 0, 4, 0, 4, 1, 5, 1]]
        }, options);

        var LEFT = 1, RIGHT = 2;
        var cellSize, grid, timer, isPaused, gameOver, canPause = true;
        var $info, $score, $restartBtn, $aboutBtn;
        var $grid, $cells, $pause, $about, $closeAbout, $results, $submitInfo, 
            $submitName, $submitBtn, $filterAll, $filterWeek;

        generateGrid();
        generateCells();
        generateInfo();
        $(this).append([$grid, $info]);

        $(window).resize(function() {
            resize();
        });
        
        grid = new Grid();
        grid.init();
        
        function startTimer() {
            timer = setInterval(grid.tick, grid.timeOut());
        }
        function stopTimer() {
            clearInterval(timer);
        }
        
        function restart() {
            $(window).unbind('keydown');
            $grid.find('.game_info').hide();
            stopTimer();
            grid = new Grid();
            grid.init();
        }

        function pause() {
            if (canPause) {
                stopTimer();
                isPaused = true;
                $about.is(":visible") ? $pause.css("top", "20%") : $pause.css("top", "30%");
                $pause.show();
            }
        }

        function unPause() {
            canPause = false;
            pauseTimer = setTimeout(function() {
                canPause = true;
            }, 2000);
            startTimer();
            isPaused = false;
            $pause.hide();
            $about.hide();
        }

        function resize() {
            cellSize = getCellSize();
            $grid.height(cellSize * settings.cellsincolumn);
            $grid.width(cellSize * settings.cellsinrow);
            $score.width(cellSize * 2.5);
            $restartBtn.width(cellSize * 2.5);
            $aboutBtn.width(cellSize);
            $closeAbout.width(cellSize - settings.csscellmargin * 2);
            $score.height(cellSize - settings.csscellmargin * 2);
            $restartBtn.height(cellSize - settings.csscellmargin * 2);
            $restartBtn.css("line-height", cellSize - settings.csscellmargin + "px");
            $aboutBtn.height(cellSize - settings.csscellmargin * 2);
            $aboutBtn.css("line-height", cellSize - settings.csscellmargin + "px");
            $aboutBtn.css("top", cellSize * (settings.cellsincolumn - 1) - settings.csscellmargin + "px");
            $closeAbout.height(cellSize - settings.csscellmargin * 2);
            $closeAbout.css("line-height", cellSize - settings.csscellmargin + "px");
            $cells.each(function() {
                $(this).height(cellSize - settings.csscellmargin * 2);
                $(this).width(cellSize - settings.csscellmargin * 2);
            });
        }

        function handleAboutClick() {
            var aboutVisible = $about.is(":visible");
            if (gameOver) {
                aboutVisible ? $results.show() : $results.hide();
                $about.toggle();
            } else if (isPaused) {
                aboutVisible ? $pause.css("top", "30%") : $pause.css("top", "20%");
                $about.toggle();
            } else if (canPause) {
                $about.show();
                pause();
            }
        }

        function showResults() {
            if (settings.saveservice) {
                $submitInfo.show();
                $submitName.off('click');
                $submitName.on('click', function () {$(this).select();});
                updateTop();
            } else {
                $results.show();
            }
        }
        
        function updateTop(isAllTimeScores) {
            $grid.find('.top').remove();
            var url = settings.saveservice;
            if (isAllTimeScores) {
                $filterWeek.css("text-decoration", "none");
                $filterAll.css("text-decoration", "underline");
            } else {
                $filterWeek.css("text-decoration", "underline");
                $filterAll.css("text-decoration", "none");
                url += "?date=" + (new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
                
            }
            $.getJSON(url, function(data) {
                var items = [];
                $.each(data, function(key, val) {
                    $.each(val, function(key2, val2) {
                        items.push("<li>" + key + ".\t" + key2 + "\t" + val2 + "</li>");
                    });
                });
                $("<ul/>", {
                    "class": "top",
                    html: items.join("")
                }).appendTo("#results");
            }).fail(function() {
                $("<ul/>", {
                    "class": "top",
                    html: "Cannot load results"
                }).appendTo("#results");
            });
            $results.show();
        }

        function submitScore() {
            var name = $submitName.val();
            if (name.lenght <= 0)
                name = 'Anonymous';
            $submitInfo.hide();
            $.post(settings.saveservice, {name: name, score: grid.getScore(), date: new Date().getTime()}).done(function() {
                updateTop();
            });
        }

        function getCellSize() {
            return (($(this).height()) / settings.cellsincolumn).toFixed(0);
        }

        function generateGrid() {
            $grid = $('<div/>', {id: 'tetris-grid'});
            $pause = $('<div/>', {id: 'pause', class: 'game_info', text: settings.labelpause});
            $about = $('<div/>', {id: 'about', class: 'game_info', text: 'Tetris'});
            $closeAbout = $('<a/>', {id: 'close_about', class: 'button', html: '&times;'}).on('click', handleAboutClick);
            var aboutHtml = '<div class="text1"><br>Keys: arrows, space and "p" for pause<br>' +
                    '<br>More rows = more points!<br><br></div>' +
                    '<div class="text2">Tetris &reg; & &copy; 1985~2014 Tetris Holding. ' +
                    '<a href="http://www.tetris.com">[tetris.com]</a><br>' +
                    'This version is developed by Taavi Aasver</div>';
            $about.append([$closeAbout, aboutHtml]);
            $results = $('<div/>', {id: 'results', class: 'game_info', html: settings.labelgameover + '<br>'});
             if (settings.saveservice) {
                 $submitInfo = $('<div/>', {id: 'submit_info'});
                 $submitName = $('<input/>', {id: 'name_box', type: 'text'});
                 var $submitNameText = $('<span/>', {id: 'name_text', text: settings.labelyourname} + ' ').append($submitName);
                 $submitBtn = $('<a/>', {id: 'score_submit', class: 'button', text: settings.labelsubmitscore}).on('click', submitScore);
                 $submitInfo.append([$submitNameText,'<br>',$submitBtn]);
                 var $filter = $('<div />', {class: 'filter'});
                 $filterAll = $('<a/>', {id: 'all_time', text: settings.labelalltime + ' '}).on('click', updateTop);
                 $filterWeek = $('<a/>', {id: 'last_week', text: settings.labellast7days}).on('click', function() {updateTop(false);});
                 $filter.append([$filterAll, $filterWeek]);
                $results.append([$submitInfo, $filter]);
             }
            $grid.append([$pause, $about, $results]);  
        }

        function generateCells() {
            cellSize = getCellSize();
            for (var i = 0; i < settings.cellsinrow * settings.cellsincolumn; i++) {
                var $cell = $("<div>", {class: "cell cell_empty"});
                $cell.height(cellSize - settings.csscellmargin * 2);
                $cell.width(cellSize - settings.csscellmargin * 2);
                $grid.append($cell);
            }
            $cells = $grid.find('.cell');
        }

        function generateInfo() {
            $info = $('<div/>', {id: 'tetris-grid-info'});
            $score = $('<div/>', {id: 'score'});
            $restartBtn = $('<a/>', {id: 'restart', class: 'button', text: settings.labelrestart}).on("click", restart);
            $aboutBtn = $('<a/>', {id: 'about_button', class: 'button', text: settings.labelabout}).on("click", handleAboutClick);
            $info.append([$score, $restartBtn, $aboutBtn]);        
        }

        function Grid() {
            
            var activeShape, nextShape, score = 0, level = 1, levelUp = 0, loc;

            this.init = function() {
                isPaused = false;
                gameOver = false;
                resize();
                clearCells();
                switchShape();
                repaintShape(activeShape, "cell_full");
                updateScore();
                startTimer();
            }

            this.getLevel = function() {
                return level;
            }
            this.getScore = function() {
                return score;
            }
            this.timeOut = function() {
                var time = 800 - level * 100;
                return time <= 50 ? 50 : time;
            };

            this.tick = function() {
                removeShape(activeShape, "cell_full");
                if (canDrop()) {
                    activeShape.drop();
                } else {
                    repaintShape(activeShape, "cell_full");
                    clearFullLines();
                    switchShape();
                    updateGameOver();
                    if (gameOver) {
                        stopTimer();
                        showResults();
                        return;
                    }
                }
                repaintShape(activeShape, "cell_full");
            }

            $(window).keydown(function(e) {
                var key = e.which;
                if (isPaused && key != 80)
                    return;
                if (activeShape && !gameOver) {
                    var to = 0;
                    switch (key) {
                        case 37:
                            to = LEFT;
                            break;
                        case 38:
                            loc = activeShape.getLocation();
                            if (loc[1] === loc[3] && loc[5] === loc[7] && loc[1] + 1 == loc[5]
                                    && loc[0] === loc[4])
                                return;  //O-shape
                            removeShape(activeShape, "cell_full");
                            rotateShape();
                            repaintShape(activeShape, "cell_full");
                            return;
                        case 39:
                            to = RIGHT;
                            break;
                        case 32:
                            var drop = true;
                            while (drop) {
                                removeShape(activeShape, "cell_full");
                                canDrop() ? activeShape.drop() : drop = false;
                                repaintShape(activeShape, "cell_full");
                            }
                            grid.tick();
                            return;
                        case 40:
                            grid.tick();
                            return;
                        case 80:
                            isPaused ? unPause() : pause();
                            return;
                        default:
                            return;
                    }
                    removeShape(activeShape, "cell_full");
                    if (canMove(to))
                        activeShape.move(to);
                    repaintShape(activeShape, "cell_full");
                }
            });

            function clearCells() {
                for (var i = 0; i < settings.cellsinrow * settings.cellsincolumn; i++) {
                    $cells.eq(i).removeClass("cell_full");
                    $cells.eq(i).removeClass("cell_next");
                }
            }

            function removeShape(shape, className) {
                loc = shape.getLocation();
                for (var i = 0; i < loc.length; i += 2) {
                    $cells.eq(loc[i] + loc[i + 1] * settings.cellsinrow).removeClass(className);
                }
            }

            function repaintShape(shape, className) {
                loc = shape.getLocation();
                for (var i = 0; i < loc.length; i += 2) {
                    $cells.eq(loc[i] + loc[i + 1] * settings.cellsinrow).addClass(className);
                }
            }

            function rotateShape() {
                loc = activeShape.getLocation(), newLoc = [], origin = activeShape.getOrigin();
                for (var i = 0; i < loc.length; i += 2) {
                    var trans = [loc[i] - origin[0], loc[i + 1] - origin[1]];
                    trans[1] *= -1;
                    newLoc[i] = Math.round(trans[0] * Math.cos(Math.PI / 2) - trans[1] * Math.sin(Math.PI / 2));
                    newLoc[i + 1] = Math.round(trans[0] * Math.sin(Math.PI / 2) + trans[1] * Math.cos(Math.PI / 2));
                    newLoc[i + 1] *= -1;
                    newLoc[i] += origin[0];
                    newLoc[i + 1] += origin[1];
                    for (var j = 0; j < newLoc.length; j += 2) {
                        if (newLoc[j] < 0 || newLoc[j] >= settings.cellsinrow
                                || newLoc[j + 1] < 0 || newLoc[j + 1] >= settings.cellsincolumn
                                || $cells.eq(newLoc[j] + newLoc[j + 1] * settings.cellsinrow).hasClass("cell_full")) {
                            return;
                        }
                    }
                }
                activeShape.setLocation(newLoc);
            }

            function canMove(to) {
                loc = activeShape.getLocation();
                for (var i = 0; i < loc.length; i += 2) {
                    var cell = loc[i] + loc[i + 1] * settings.cellsinrow;
                    if (to === RIGHT)
                        cell++;
                    else if (to === LEFT)
                        cell--;
                    if ((to === LEFT && loc[i] <= 0)
                            || (to === RIGHT && loc[i] >= settings.cellsinrow - 1)
                            || $cells.eq(cell).hasClass("cell_full")) {
                        return false;
                    }
                }
                return true;
            }

            function canDrop() {
                loc = activeShape.getLocation();
                for (var i = 0; i < loc.length; i += 2) {
                    var cellUnder = loc[i] + loc[i + 1] * settings.cellsinrow + settings.cellsinrow;
                    if (cellUnder > settings.cellsinrow * settings.cellsincolumn - 1
                            || $cells.eq(cellUnder).hasClass("cell_full"))
                        return false;
                }
                return true;
            }

            function clearFullLines() {
                var fullRows = 0;
                for (var i = 0; i < $cells.length; i += settings.cellsinrow) {
                    for (var j = 0; j < settings.cellsinrow; j++) {
                        if (!$cells.eq(i + j).hasClass("cell_full"))
                            break;
                        if (j === settings.cellsinrow - 1) {
                            fullRows++;
                            for (var z = i; z > 0; z -= settings.cellsinrow) {
                                for (var x = 0; x < settings.cellsinrow; x++) {
                                    $cells.eq(z + x).removeClass("cell_full");
                                    if ($cells.eq(z + x - settings.cellsinrow).hasClass("cell_full"))
                                        $cells.eq(z + x).addClass("cell_full");
                                }
                            }
                            for (var z = 0; z < settings.cellsinrow; z++) {
                                $cells.eq(z).removeClass("cell_full");
                            }
                        }
                    }
                }
                if (fullRows > 4)
                    gameOver = true; //cheater
                levelUp += fullRows;
                if (levelUp >= 10) {
                    levelUp = 0;
                    level++;
                }
                score += fullRows * fullRows * 50 * level;
                stopTimer();
                startTimer();
                updateScore();
            }

            function updateGameOver() {
                loc = activeShape.getLocation();
                for (var i = 0; i < loc.length; i += 2) {
                    var cell = loc[i] + loc[i + 1] * settings.cellsinrow;
                    if ($cells.eq(cell).hasClass("cell_full")) {
                        gameOver = true;
                        return;
                    }
                }
            }
            
            function updateScore() {
                $info.find('#score').html('<div id="level">' + settings.labellevel + ' ' + level + '</div>' + score);
            }

            function switchShape() {
                activeShape = nextShape ? nextShape : getNewShape();
                if (nextShape) {
                    removeShape(nextShape, 'cell_next');
                }
                nextShape = getNewShape();
                repaintShape(nextShape, 'cell_next');
            }

            function getNewShape() {
                return new Shape(settings.shapes[Math.floor(Math.random() * settings.shapes.length)]);
            }
        }

        function Shape(initial_loc) {
            var origin = [4, 1];
            var xy = initial_loc.slice(0);

            this.getOrigin = function() {
                return origin;
            }
            this.getLocation = function() {
                return xy;
            }
            this.setLocation = function(loc) {
                xy = loc;
            }

            this.drop = function() {
                origin[1]++;
                for (var i = 1; i < xy.length; i += 2) {
                    xy[i]++;
                }
            }

            this.move = function(dir) {
                dir === RIGHT ? origin[0]++ : origin[0]--;
                for (var i = 0; i < xy.length; i += 2) {
                    dir === RIGHT ? xy[i]++ : xy[i]--;
                }
            }
        }

    };

}(jQuery));