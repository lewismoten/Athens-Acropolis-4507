(function () {
  function getCanvasPoint(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function seekFromCanvasPoint(pointX, canvasWidth, options) {
    var controller;
    var song;
    var visibleWindow;
    var leftPadding = 120;
    var rightPadding = 12;
    var innerWidth;
    var relative;
    var targetSeconds;

    controller = options.getController ? options.getController() : null;
    song = controller && controller.getSong ? controller.getSong() : null;
    if (!controller || !song || !controller.seek || !options.getVisibleWindow) {
      return;
    }

    visibleWindow = options.getVisibleWindow(song.duration || 1, controller.getPlaybackPosition());
    innerWidth = canvasWidth - leftPadding - rightPadding;

    if (pointX < leftPadding || pointX > (leftPadding + innerWidth)) {
      return;
    }

    relative = (pointX - leftPadding) / Math.max(innerWidth, 1);
    targetSeconds = visibleWindow.start + (visibleWindow.seconds * Math.max(0, Math.min(1, relative)));
    if (options.seekToTime) {
      options.seekToTime(targetSeconds);
    }
  }

  function onVisualizerMove(event, options) {
    var point = getCanvasPoint(options.visualizer, event);
    var hoverMarker = (options.getTrackMarkerHitZones ? options.getTrackMarkerHitZones() : []).find(function (zone) {
      return point.x >= zone.x && point.x <= (zone.x + zone.width) &&
        point.y >= zone.y && point.y <= (zone.y + zone.height);
    });
    var hoverLane = (options.getLaneHoverZones ? options.getLaneHoverZones() : []).find(function (zone) {
      return point.x >= zone.x && point.x <= (zone.x + zone.width) &&
        point.y >= zone.y && point.y <= (zone.y + zone.height);
    });
    var overMute = (options.getLaneHitZones ? options.getLaneHitZones() : []).some(function (zone) {
      return point.x >= zone.x && point.x <= (zone.x + zone.width) &&
        point.y >= zone.y && point.y <= (zone.y + zone.height);
    });

    if (hoverMarker) {
      options.visualizer.style.cursor = "help";
      if (options.showTrackTooltip) {
        options.showTrackTooltip(hoverMarker, point);
      }
      return;
    }

    if (hoverLane) {
      options.visualizer.style.cursor = overMute ? "pointer" : "help";
      if (options.showTrackLaneTooltip) {
        options.showTrackLaneTooltip(hoverLane, point);
      }
      return;
    }

    if (options.hideTrackTooltip) {
      options.hideTrackTooltip();
    }
    options.visualizer.style.cursor = overMute ? "pointer" : "crosshair";
  }

  function onVisualizerClick(event, options) {
    var point = getCanvasPoint(options.visualizer, event);
    var clickedMarker = (options.getTrackMarkerHitZones ? options.getTrackMarkerHitZones() : []).find(function (zone) {
      return point.x >= zone.x && point.x <= (zone.x + zone.width) &&
        point.y >= zone.y && point.y <= (zone.y + zone.height);
    });
    var clickedZone = (options.getLaneHitZones ? options.getLaneHitZones() : []).find(function (zone) {
      return point.x >= zone.x && point.x <= (zone.x + zone.width) &&
        point.y >= zone.y && point.y <= (zone.y + zone.height);
    });

    if (clickedMarker) {
      if (options.seekToTime) {
        options.seekToTime(clickedMarker.time);
      }
      return;
    }

    if (!clickedZone) {
      seekFromCanvasPoint(point.x, options.visualizer.width, options);
      return;
    }

    if (clickedZone.type === "expand-drums") {
      if (options.toggleDrumsExpanded) {
        options.toggleDrumsExpanded();
      }
      return;
    }

    if (options.toggleMuteKey) {
      options.toggleMuteKey(clickedZone.muteKey);
    }
  }

  function onVisualizerWheel(event, options) {
    var controller;
    var song;
    var duration;
    var seconds;
    var visibleWindow;
    var dominantDelta;
    var nextStart;

    controller = options.getController ? options.getController() : null;
    song = controller && controller.getSong ? controller.getSong() : null;
    if (!controller || !song || !controller.isPaused || !controller.isPaused() || (options.isFullSong && options.isFullSong())) {
      return;
    }

    duration = song.duration || 1;
    seconds = Math.min(Number(options.windowSlider.value) || 10, duration);
    if (seconds >= duration) {
      return;
    }

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    visibleWindow = options.getVisibleWindow(duration, controller.getPlaybackPosition());
    dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    nextStart = visibleWindow.start + ((dominantDelta / 180) * Math.max(0.5, seconds * 0.18));
    if (options.setManualWindowStart) {
      options.setManualWindowStart(Math.max(0, Math.min(nextStart, duration - seconds)));
    }
    if (options.drawVisualizer) {
      options.drawVisualizer();
    }
  }

  function onMetaVisualizerMove(event, options) {
    var point = getCanvasPoint(options.metaVisualizer, event);
    var hoverZone = (options.getMetaHitZones ? options.getMetaHitZones() : []).find(function (zone) {
      return point.x >= zone.x && point.x <= (zone.x + zone.width) &&
        point.y >= zone.y && point.y <= (zone.y + zone.height);
    });

    if (hoverZone) {
      options.metaVisualizer.style.cursor = "help";
      if (options.showMetaTooltip) {
        options.showMetaTooltip(hoverZone, point);
      }
      return;
    }

    options.metaVisualizer.style.cursor = "crosshair";
    if (options.hideMetaTooltip) {
      options.hideMetaTooltip();
    }
  }

  function onMetaVisualizerClick(event, options) {
    var point = getCanvasPoint(options.metaVisualizer, event);
    seekFromCanvasPoint(point.x, options.metaVisualizer.width, options);
  }

  function onLyricPointerDown(event, options) {
    var target = event.target;
    var row = null;
    var seekTime;

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    while (target && target !== options.lyricStatus) {
      if (target.getAttribute && target.getAttribute("data-lyric-time") !== null) {
        row = target;
        break;
      }
      target = target.parentNode;
    }

    if (!row || !options.seekToTime) {
      return;
    }

    seekTime = Number(row.getAttribute("data-lyric-time"));
    options.seekToTime(seekTime);
  }

  function attachInteractionHandlers(options) {
    options.visualizer.style.cursor = "default";
    options.visualizer.onclick = function (event) {
      onVisualizerClick(event, options);
    };
    options.visualizer.onmousemove = function (event) {
      onVisualizerMove(event, options);
    };
    options.visualizer.onwheel = function (event) {
      onVisualizerWheel(event, options);
    };
    options.visualizer.onmouseleave = function () {
      options.visualizer.style.cursor = "crosshair";
      if (options.hideTrackTooltip) {
        options.hideTrackTooltip();
      }
    };

    options.metaVisualizer.style.cursor = "default";
    options.metaVisualizer.onclick = function (event) {
      onMetaVisualizerClick(event, options);
    };
    options.metaVisualizer.onmousemove = function (event) {
      onMetaVisualizerMove(event, options);
    };
    options.metaVisualizer.onwheel = function (event) {
      onVisualizerWheel(event, options);
    };
    options.metaVisualizer.onmouseleave = function () {
      options.metaVisualizer.style.cursor = "crosshair";
      if (options.hideMetaTooltip) {
        options.hideMetaTooltip();
      }
    };

    options.lyricStatus.onmousedown = function (event) {
      onLyricPointerDown(event, options);
    };
  }

  window.ShoomiIndexInteraction = {
    attachInteractionHandlers: attachInteractionHandlers
  };
})();
