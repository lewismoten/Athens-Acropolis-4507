(function () {
  function drawSpeakerIcon(context, x, y, isOn) {
    context.save();
    context.strokeStyle = isOn ? "#99ccff" : "#7777aa";
    context.fillStyle = isOn ? "#99ccff" : "#7777aa";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, y + 5);
    context.lineTo(x + 4, y + 5);
    context.lineTo(x + 7, y + 2);
    context.lineTo(x + 7, y + 12);
    context.lineTo(x + 4, y + 9);
    context.lineTo(x, y + 9);
    context.closePath();
    context.fill();

    if (isOn) {
      context.beginPath();
      context.arc(x + 8, y + 7, 3, -0.9, 0.9);
      context.stroke();
      context.beginPath();
      context.arc(x + 8, y + 7, 5, -0.9, 0.9);
      context.stroke();
    } else {
      context.beginPath();
      context.moveTo(x + 9, y + 3);
      context.lineTo(x + 13, y + 11);
      context.moveTo(x + 13, y + 3);
      context.lineTo(x + 9, y + 11);
      context.stroke();
    }
    context.restore();
  }

  function drawExpandIcon(context, x, y, expanded) {
    context.save();
    context.fillStyle = "#99ccff";
    context.beginPath();
    if (expanded) {
      context.moveTo(x, y + 4);
      context.lineTo(x + 8, y + 4);
      context.lineTo(x + 4, y + 9);
    } else {
      context.moveTo(x + 2, y + 2);
      context.lineTo(x + 2, y + 10);
      context.lineTo(x + 7, y + 6);
    }
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawReverbGlyph(context, x, centerY, color) {
    var radius;

    context.strokeStyle = color;
    context.lineWidth = 1.4;
    for (radius = 3; radius <= 7; radius += 2) {
      context.beginPath();
      context.arc(x - 2, centerY, radius, -0.7, 0.7, false);
      context.stroke();
    }

    context.strokeStyle = "rgba(153,170,255,0.45)";
    context.lineWidth = 1.2;
    for (radius = 6; radius <= 10; radius += 2) {
      context.beginPath();
      context.arc(x + 2, centerY, radius, 2.44, 3.84, true);
      context.stroke();
    }
  }

  function drawDataEntryGlyph(context, x, centerY, value) {
    context.strokeStyle = "#ff6666";
    context.lineWidth = 0.8;
    context.beginPath();
    context.arc(x, centerY, 9.2, 0, Math.PI * 2);
    context.closePath();
    context.stroke();
    context.fillStyle = "#ff6666";
    context.beginPath();
    context.moveTo(x - 3, centerY - 7.6);
    context.lineTo(x + 3, centerY - 7.6);
    context.lineTo(x, centerY - 3.8);
    context.closePath();
    context.fill();
    context.fillStyle = "#ffbbbb";
    context.font = "bold 10px Times New Roman";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(value), x, centerY + 0.9);
  }

  function drawVolumeGlyph(context, x, centerY, laneHeight, color, value) {
    var yOffset = ((1 - (Math.max(0, Math.min(127, value === undefined ? 100 : value)) / 127)) - 0.5) * Math.min(16, laneHeight * 0.32);
    var y = centerY + yOffset;
    var arcRadius = 3.5;
    var arcOffset = 5;

    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 2.3, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(x - arcOffset, y, arcRadius, -0.75, 0.75, false);
    context.stroke();
    context.beginPath();
    context.arc(x - (arcOffset + 3), y, arcRadius + 1.8, -0.75, 0.75, false);
    context.stroke();
    context.beginPath();
    context.arc(x + arcOffset, y, arcRadius, Math.PI - 0.75, Math.PI + 0.75, false);
    context.stroke();
    context.beginPath();
    context.arc(x + (arcOffset + 3), y, arcRadius + 1.8, Math.PI - 0.75, Math.PI + 0.75, false);
    context.stroke();
  }

  function drawBankBadge(context, x, centerY, ringColor, controller, value) {
    var radius = 10;
    var valueX = x + (controller === 0 ? 5 : -5);

    context.strokeStyle = ringColor;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, centerY, radius, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = ringColor;
    context.font = "bold 10px Times New Roman";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(value), valueX, centerY + 0.2);
    context.fillStyle = "#000022";
    context.font = "bold 8px Times New Roman";
    context.textBaseline = "alphabetic";
    context.fillText(controller === 0 ? "BANK M" : "BANK L", x, centerY - 12);
  }

  function drawNrpnBadge(context, x, centerY, ringColor, controller, value) {
    var width = 20;
    var height = 12;
    var top = centerY - (height / 2) + (controller === 99 ? 2 : 8);
    var valueX = x + (controller === 99 ? 4.8 : -4.8);

    context.strokeStyle = ringColor;
    context.lineWidth = 1;
    context.strokeRect(x - (width / 2), top, width, height);
    context.fillStyle = ringColor;
    context.font = "bold 10px Times New Roman";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(value), valueX, top + (height / 2) + 0.2);
    context.fillStyle = "#000022";
    context.font = "bold 8px Times New Roman";
    context.textBaseline = "alphabetic";
    context.fillText(controller === 99 ? "NRPN M" : "NRPN L", x, top - 2);
  }

  function drawCanvasTimingSummary(context, width, text) {
    context.fillStyle = "rgba(0, 0, 32, 0.86)";
    context.fillRect(8, 6, width - 16, 18);
    context.strokeStyle = "rgba(102, 102, 170, 0.85)";
    context.lineWidth = 1;
    context.strokeRect(8.5, 6.5, width - 17, 17);
    context.fillStyle = "#ccccff";
    context.font = "12px Times New Roman";
    context.fillText(text, 14, 19);
  }

  function drawMetaInfoBox(context, x, y, text, fixedWidth, scrollProgress) {
    var width;
    var textWidth;
    var easedProgress = 0;
    var scrollStart = 0.2;
    var shift = 0;
    var exitDistance = 0;

    context.font = "10px Times New Roman";
    textWidth = context.measureText(text).width;
    width = fixedWidth || (textWidth + 8);
    context.fillStyle = "rgba(0, 0, 24, 0.92)";
    context.fillRect(x, y, width, 10);
    context.strokeStyle = "rgba(153, 204, 255, 0.45)";
    context.lineWidth = 1;
    context.strokeRect(x + 0.5, y + 0.5, width - 1, 9);
    context.fillStyle = "#ffddaa";
    if (scrollProgress) {
      if (scrollProgress > scrollStart) {
        easedProgress = (scrollProgress - scrollStart) / (1 - scrollStart);
        exitDistance = width + 6;
        shift = Math.max(0, Math.min(exitDistance, exitDistance * easedProgress));
      }
    }
    context.save();
    context.beginPath();
    context.rect(x + 4, y + 1, Math.max(1, width - 8), 8);
    context.clip();
    context.fillText(text, x + 4 - shift, y + 8);
    context.restore();
  }

  function shiftHexColor(color, amount) {
    var value = String(color || "").replace("#", "");
    var red;
    var green;
    var blue;

    if (value.length !== 6) {
      return color;
    }

    red = parseInt(value.slice(0, 2), 16);
    green = parseInt(value.slice(2, 4), 16);
    blue = parseInt(value.slice(4, 6), 16);

    if (!isFinite(red) || !isFinite(green) || !isFinite(blue)) {
      return color;
    }

    if (amount >= 0) {
      red = Math.round(red + ((255 - red) * amount));
      green = Math.round(green + ((255 - green) * amount));
      blue = Math.round(blue + ((255 - blue) * amount));
    } else {
      red = Math.round(red * (1 + amount));
      green = Math.round(green * (1 + amount));
      blue = Math.round(blue * (1 + amount));
    }

    return "#" + [red, green, blue].map(function (part) {
      return Math.max(0, Math.min(255, part)).toString(16).padStart(2, "0");
    }).join("");
  }

  function varyLaneColor(color, index) {
    var amount = (index % 2 === 0) ? 0.18 : -0.1;
    return shiftHexColor(color, amount);
  }

  window.ShoomiIndexPageVisualizer = {
    drawSpeakerIcon: drawSpeakerIcon,
    drawExpandIcon: drawExpandIcon,
    drawReverbGlyph: drawReverbGlyph,
    drawDataEntryGlyph: drawDataEntryGlyph,
    drawVolumeGlyph: drawVolumeGlyph,
    drawBankBadge: drawBankBadge,
    drawNrpnBadge: drawNrpnBadge,
    drawCanvasTimingSummary: drawCanvasTimingSummary,
    drawMetaInfoBox: drawMetaInfoBox,
    shiftHexColor: shiftHexColor,
    varyLaneColor: varyLaneColor
  };
}());
