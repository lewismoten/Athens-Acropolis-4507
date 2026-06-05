(function () {
  var canvas = document.getElementById("dream-marquee");

  if (!canvas || !canvas.getContext) {
    return;
  }

  var context = canvas.getContext("2d");
  var backgroundColor = "#000033";
  var dotColor = "#9999ff";
  var displayFrames = 100;
  var dotCount = 50;
  var waveHeight = 8;
  var defaultColors = parseColorList("ffaa00");
  var entries = parseEntries([
    [">>,>>", "The beginning of all dreams", "880000|990000|aa0000|bb0000|cc0000|dd0000|ee0000|ff0000|ee0000|dd0000|cc0000|bb0000|aa0000|990000|880000|990000|aa0000|bb0000|cc0000|dd0000|ee0000|0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|"],
    ["<<,<<", "Located in GeoCities", "00ff00|00ee00|00dd00|00cc00|00bb00|00aa00|009900|008800|009900|00aa00|00bb00|00cc00|00dd00|00ee00|00ff00|00ee00|00dd00|00cc00|00bb00|00aa00|"],
    ["^^,<>", "/Athens/Acropolis/4507/", "00ff00|eeee00|dddd00|cccc00|bbbb00|aaaa00|999900|008800|999900|aaaa00|bbbb00|cccc00|dddd00|eeee00|ffff00|eeee00|dddd00|00cc00|bbbb00|aaaa00|999900|888800|009900|"],
    ["VV,<>", "Get your FREE homepage now!", "880088|990099|aa00aa|bb00bb|cc00cc|dd00dd|ee00ee|ff00ff|ee00ee|00dddd|00cccc|00bbbb|00aaaa|009999|880088|990099|aa00aa|bb00bb|cc00cc|dd00dd|ee00ee|ff00ff|ee00ee|dd00dd|cc00cc|bb00bb|aa00aa|990099|880088|990099|aa00aa|bb00bb|cc00cc|"],
    ["<<,<<", "http://www.geocities.com", "aaaaaa|bbbbbb|cccccc|dddddd|eeeeee|ffffff|eeeeee|dddddd|cccccc|bbbbbb|aaaaaa|999999|888888|999999|aaaaaa|bbbbbb|cccccc|dddddd|eeeeee|ffffff|eeeeee|dddddd|cccccc|bbbbbb|aaaaaa|999999|888888|999999|aaaaaa|bbbbbb|"],
    ["<<,>>", "sweet dreams!", "0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|000099|000088|000088|000099|0000aa|0000bb|0000cc|0000dd|0000ee|0000ff|0000ee|0000dd|0000cc|"]
  ]);

  entries.unshift({
    start: ">>",
    end: ">>",
    text: "Shoomi's HomePage",
    colors: parseColorList("0000ff|0000ee|0000dd|0000cc|0000bb|0000aa|000099|000088|000000|000088|000099|0000aa|0000bb|0000cc|0000dd|0000ee|0000ff|0000ee|"),
    holdFrames: displayFrames
  });

  var state = {
    currentIndex: 0,
    entryFrame: 0,
    dots: createDots(dotCount),
    lastTimestamp: 0
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(tick);

  function tick(timestamp) {
    if (!state.lastTimestamp) {
      state.lastTimestamp = timestamp;
    }

    if (timestamp - state.lastTimestamp >= 1000 / 30) {
      state.lastTimestamp = timestamp;
      drawFrame();
      state.entryFrame += 1;

      if (state.entryFrame > entries[state.currentIndex].durationFrames) {
        state.currentIndex = (state.currentIndex + 1) % entries.length;
        state.entryFrame = 0;
      }
    }

    requestAnimationFrame(tick);
  }

  function drawFrame() {
    var entry = entries[state.currentIndex];
    var metrics = measureEntry(entry);
    var progress = Math.min(state.entryFrame / entry.transitionFrames, 1);
    var holdProgress = Math.max(state.entryFrame - entry.transitionFrames, 0);
    var position = getPosition(entry, metrics, progress, holdProgress);

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawDots();
    drawText(entry, metrics, position.x, position.y);
  }

  function drawDots() {
    var speed = 0.35;

    context.fillStyle = dotColor;
    for (var index = 0; index < state.dots.length; index += 1) {
      var dot = state.dots[index];
      dot.x -= dot.speed * speed;

      if (dot.x < -dot.radius) {
        dot.x = canvas.width + dot.radius;
        dot.y = Math.random() * canvas.height;
      }

      context.beginPath();
      context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2, false);
      context.fill();
    }
  }

  function drawText(entry, metrics, baseX, baseY) {
    context.font = "italic 29px Times New Roman, Times, serif";
    context.textBaseline = "middle";

    for (var index = 0; index < entry.characters.length; index += 1) {
      var character = entry.characters[index];
      var color = entry.colors[index % entry.colors.length] || defaultColors[0];
      var wave = Math.sin((state.entryFrame / 4) + (index / 1.7)) * waveHeight;

      context.fillStyle = color;
      context.fillText(character.value, baseX + character.offsetX, baseY + wave);
    }
  }

  function measureEntry(entry) {
    context.font = "italic 29px Times New Roman, Times, serif";

    var offsetX = 0;
    var characters = [];

    for (var index = 0; index < entry.text.length; index += 1) {
      var value = entry.text.charAt(index);
      var width = context.measureText(value).width;

      characters.push({
        value: value,
        width: width,
        offsetX: offsetX
      });

      offsetX += width;
    }

    entry.characters = characters;

    return {
      width: offsetX,
      height: 29
    };
  }

  function getPosition(entry, metrics, progress, holdProgress) {
    var centerX = (canvas.width - metrics.width) / 2;
    var centerY = canvas.height / 2;
    var edgePadding = 18;
    var startX = axisPoint(entry.start, "x", metrics.width, edgePadding, centerX);
    var startY = axisPoint(entry.start, "y", metrics.height, edgePadding, centerY);
    var endX = axisPoint(entry.end, "x", metrics.width, edgePadding, centerX);
    var endY = axisPoint(entry.end, "y", metrics.height, edgePadding, centerY);
    var x = lerp(startX, centerX, easeOutCubic(progress));
    var y = lerp(startY, centerY, easeOutCubic(progress));

    if (state.entryFrame > entry.holdStartFrame) {
      var exitProgress = Math.min(holdProgress / entry.transitionFrames, 1);
      x = lerp(centerX, endX, easeInCubic(exitProgress));
      y = lerp(centerY, endY, easeInCubic(exitProgress));
    }

    return { x: x, y: y };
  }

  function axisPoint(direction, axis, size, edgePadding, center) {
    if (axis === "x") {
      if (direction.indexOf("<") !== -1) {
        return -size - edgePadding;
      }

      if (direction.indexOf(">") !== -1) {
        return canvas.width + edgePadding;
      }
    }

    if (axis === "y") {
      if (direction.indexOf("^") !== -1) {
        return -edgePadding;
      }

      if (direction.indexOf("V") !== -1) {
        return canvas.height + edgePadding;
      }
    }

    return center;
  }

  function parseEntries(rawEntries) {
    var results = [];

    for (var index = 0; index < rawEntries.length; index += 1) {
      var item = rawEntries[index];
      var actions = item[0].split(",");
      var text = item[1];
      var colors = parseColorList(item[2]);
      var travel = Math.max(35, Math.round(text.length * 1.6));

      results.push({
        start: actions[0] || "<>",
        end: actions[1] || "<>",
        text: text,
        colors: colors.length ? colors : defaultColors,
        holdFrames: displayFrames,
        transitionFrames: travel,
        holdStartFrame: travel + displayFrames,
        durationFrames: (travel * 2) + displayFrames
      });
    }

    return results;
  }

  function parseColorList(rawValue) {
    var values = rawValue.split("|");
    var colors = [];

    for (var index = 0; index < values.length; index += 1) {
      if (values[index]) {
        colors.push("#" + values[index]);
      }
    }

    return colors;
  }

  function createDots(count) {
    var dots = [];

    for (var index = 0; index < count; index += 1) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: (Math.random() * 1.8) + 0.5,
        speed: (Math.random() * 2.5) + 0.4
      });
    }

    return dots;
  }

  function resizeCanvas() {
    var bodyWidth = document.body.clientWidth || 500;
    canvas.width = Math.max(500, Math.min(bodyWidth - 16, 1400));
    canvas.height = 78;
    context.font = "italic 29px Times New Roman, Times, serif";
  }

  function lerp(start, end, progress) {
    return start + ((end - start) * progress);
  }

  function easeOutCubic(value) {
    var inverse = 1 - value;
    return 1 - (inverse * inverse * inverse);
  }

  function easeInCubic(value) {
    return value * value * value;
  }
}());
