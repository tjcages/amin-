import React, { useEffect, useRef } from "react";
import styles from "../styles/home.module.css";

const Home = () => {
  const ref = useRef();

  var boxchecked = false;
  var userinput1 = 0;
  var userinput2 = 0;
  var Nstart = 32;
  var dst;
  var dstYUV;
  var dstRGB;
  var imageDataSrc;
  var imageDataDst;
  var imageDataYUV;
  var imageDataRGB;
  var imgW = 0;
  var imgH = 0;

  var imageSrc = "./images/3.jpeg";
  var checked = true;
  var parameter1 = 25;
  var parameter2 = 50;

  useEffect(() => {
    if (ref.current) {
      ref.current.onload = init();
    }
  });

  const setPixelsYUV = (
    srcdata,
    dstdata,
    x,
    y,
    PatchWidth,
    PatchHeight,
    BoxWidth
  ) => {
    var indexSrc = 0;
    var indexDst = 0;
    for (var i = 0; i < PatchHeight; i++) {
      indexSrc = i * PatchWidth;
      indexDst = ((i + y) * BoxWidth + x) * 4;
      for (var j = 0; j < PatchWidth; j++) {
        var yuv = {
          y: srcdata[0].data[indexSrc],
          u: srcdata[1].data[indexSrc],
          v: srcdata[2].data[indexSrc++],
        };

        var col = YUV_to_RGB(yuv);
        dstdata.data[indexDst++] = col.r;
        dstdata.data[indexDst++] = col.g;
        dstdata.data[indexDst++] = col.b;
        indexDst++;
      }
    }
  };

  const setPixelsGray = (
    srcdata,
    dstdata,
    x,
    y,
    PatchWidth,
    PatchHeight,
    BoxWidth
  ) => {
    var indexSrc = 0;
    var indexDst = 0;
    for (var i = 0; i < PatchHeight; i++) {
      indexSrc = i * PatchWidth;
      indexDst = ((i + y) * BoxWidth + x) * 4;
      for (var j = 0; j < PatchWidth; j++) {
        var yuv = { y: srcdata[0].data[indexSrc++], u: 128, v: 128 };

        var col = YUV_to_RGB(yuv);
        dstdata.data[indexDst++] = col.r;
        dstdata.data[indexDst++] = col.g;
        dstdata.data[indexDst++] = col.b;
        indexDst++;
      }
    }
  };

  const setPixelsUV = (
    srcdata,
    dstdata,
    x,
    y,
    PatchWidth,
    PatchHeight,
    BoxWidth
  ) => {
    var indexSrc = 0;
    var indexDst = 0;
    var col = { r: 0, g: 0, b: 0 };
    for (var i = 0; i < PatchHeight; i++) {
      indexSrc = i * PatchWidth;
      indexDst = ((i + y) * BoxWidth + x) * 4;
      for (var j = 0; j < PatchWidth; j++) {
        var yuv = {
          y: 180,
          u: srcdata[1].data[indexSrc],
          v: srcdata[2].data[indexSrc++],
        };
        if (yuv.u == -1 || yuv.v == -1) col = { r: 0, g: 0, b: 0 };
        else col = YUV_to_RGB(yuv);
        dstdata.data[indexDst++] = col.r;
        dstdata.data[indexDst++] = col.g;
        dstdata.data[indexDst++] = col.b;
        indexDst++;
      }
    }
  };

  const getYUV = (srcdata, x, y, PatchWidth, PatchHeight, BoxWidth) => {
    var ly = { data: [] };
    var lu = { data: [] };
    var lv = { data: [] };
    var yuv = [];
    var index = 0;
    for (var i = 0; i < PatchHeight; i++) {
      index = ((i + y) * BoxWidth + x) * 4;
      for (var j = 0; j < PatchWidth; j++) {
        var col = {
          r: srcdata.data[index++],
          g: srcdata.data[index++],
          b: srcdata.data[index++],
        };
        index++;
        var colyuv = RGB_to_YUV(col);
        ly.data.push(colyuv.y);
        lu.data.push(colyuv.u);
        lv.data.push(colyuv.v);
      }
    }
    yuv.push(ly);
    yuv.push(lu);
    yuv.push(lv);
    return yuv;
  };

  const AVG = (srcdata, x, y, PatchWidth, PatchHeight, BoxWidth) => {
    var total = 0;
    var index = 0;
    for (var i = 0; i < PatchHeight; i++) {
      index = (i + y) * BoxWidth + x;
      for (var j = 0; j < PatchWidth; j++)
        total = total + srcdata.data[index++];
    }
    return Math.floor(total / (PatchWidth * PatchHeight));
  };

  const boxErr = (srcdata, x, y, PatchWidth, PatchHeight, BoxWidth) => {
    var index = 0;
    var gray = AVG(srcdata, x, y, PatchWidth, PatchHeight, BoxWidth);
    var d = 0;
    for (var i = 0; i < PatchHeight; i++) {
      for (var j = 0; j < PatchWidth; j++) {
        index = j + x + (i + y) * BoxWidth;
        const dr = gray - srcdata.data[index];
        d = d + dr * dr;
      }
    }
    return (d / (PatchWidth * PatchHeight)) * 24;
  };

  const drawbox = (
    dstdata,
    x,
    y,
    PatchWidth,
    PatchHeight,
    value,
    BoxWidth,
    chk
  ) => {
    var index = 0;
    var black = 0;
    var c = 0;
    for (var i = 0; i < PatchHeight; i++) {
      for (var j = 0; j < PatchWidth; j++) {
        index = j + x + (i + y) * BoxWidth;
        if (chk == true && (i == PatchHeight - 1 || j == PatchWidth - 1))
          c = black;
        else c = value;
        dstdata.data[index] = c;
      }
    }
  };

  const drawBoxRGB = (
    dstdata,
    x,
    y,
    PatchWidth,
    PatchHeight,
    col,
    BoxWidth,
    chk
  ) => {
    var index = 0;
    var black = { r: 0, g: 0, b: 0 };
    var c = { r: 0, g: 0, b: 0 };
    for (var i = 0; i < PatchHeight; i++) {
      for (var j = 0; j < PatchWidth; j++) {
        index = (j + x + (i + y) * BoxWidth) * 4;
        if (chk == true && (i == PatchHeight - 1 || j == PatchWidth - 1))
          c = black;
        else c = col;
        dstdata.data[index + 0] = c.r;
        dstdata.data[index + 1] = c.g;
        dstdata.data[index + 2] = c.b;
        dstdata.data[index + 3] = 255;
      }
    }
  };

  const box = (
    imgdata,
    dstdata,
    x,
    y,
    nx,
    ny,
    BoxWidth,
    boundry,
    docount,
    chk
  ) => {
    var devider = 4;
    var error = boxErr(imgdata, x, y, nx, ny, BoxWidth);
    if (nx == devider || ny == devider || error < boundry) {
      var value = AVG(imgdata, x, y, nx, ny, BoxWidth);
      if (nx / devider > 1) value = Math.round(value / 8) * 8;
      else value = Math.round(value / 32) * 32;
      drawbox(dstdata, x, y, nx, ny, value, BoxWidth, chk);
    } else {
      box(
        imgdata,
        dstdata,
        x,
        y,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
      box(
        imgdata,
        dstdata,
        x + nx / 2,
        y,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
      box(
        imgdata,
        dstdata,
        x,
        y + ny / 2,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
      box(
        imgdata,
        dstdata,
        x + nx / 2,
        y + ny / 2,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
    }
  };

  const boxUV = (
    imgdata,
    dstdata,
    x,
    y,
    nx,
    ny,
    BoxWidth,
    boundry,
    docount,
    chk
  ) => {
    var devider = 4;
    var error1 = boxErr(imgdata[1], x, y, nx, ny, BoxWidth);
    var error2 = boxErr(imgdata[2], x, y, nx, ny, BoxWidth);
    if (nx == devider || ny == devider || error1 + error2 < boundry) {
      var value = AVG(imgdata[1], x, y, nx, ny, BoxWidth);
      drawbox(dstdata[0], x, y, nx, ny, value, BoxWidth, chk);
      value = AVG(imgdata[2], x, y, nx, ny, BoxWidth);
      drawbox(dstdata[1], x, y, nx, ny, value, BoxWidth, chk);
    } else {
      boxUV(
        imgdata,
        dstdata,
        x,
        y,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
      boxUV(
        imgdata,
        dstdata,
        x + nx / 2,
        y,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
      boxUV(
        imgdata,
        dstdata,
        x,
        y + ny / 2,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
      boxUV(
        imgdata,
        dstdata,
        x + nx / 2,
        y + ny / 2,
        nx / 2,
        ny / 2,
        BoxWidth,
        boundry,
        docount,
        chk
      );
    }
  };

  const draw = () => {
    var chk = checked;
    if (
      userinput1 != parameter1 ||
      userinput2 != parameter2 ||
      boxchecked != checked
    ) {
      var col = { r: 0, g: 0, b: 0 };
      drawBoxRGB(imageDataDst, 0, 0, imgW, imgH, col, imgW, false);
      drawBoxRGB(imageDataYUV, 0, 0, imgW, imgH, col, imgW, false);
      drawBoxRGB(imageDataRGB, 0, 0, imgW, imgH, col, imgW, false);
      var yend = Math.floor(imgH / Nstart);
      var xend = Math.floor(imgW / Nstart);

      var ltmp = { data: [] };
      for (let q = 0; q < Nstart * Nstart * 4; q++) ltmp.data.push(0);
      var ly = { data: [] };
      var lu = { data: [] };
      var lv = { data: [] };
      for (let q = 0; q < Nstart * Nstart; q++) {
        ly.data.push(0);
        lu.data.push(0);
        lv.data.push(0);
      }

      for (let yu = 0; yu < yend; yu++) {
        for (let xu = 0; xu < xend; xu++) {
          var x = xu * Nstart;
          var y = yu * Nstart;
          var yuvdata = getYUV(imageDataSrc, x, y, Nstart, Nstart, imgW);

          var boundry1 = parameter1 * parameter1;
          var boundry2 = parameter2 * parameter2;

          box(
            yuvdata[0],
            ly,
            0,
            0,
            Nstart,
            Nstart,
            Nstart,
            boundry1,
            true,
            chk
          );
          boxUV(
            [yuvdata[0], yuvdata[1], yuvdata[2]],
            [lu, lv],
            0,
            0,
            Nstart,
            Nstart,
            Nstart,
            boundry2,
            true,
            chk
          );

          var yuv = [ly, lu, lv];

          setPixelsGray(yuv, imageDataDst, x, y, Nstart, Nstart, imgW);
          setPixelsUV(yuv, imageDataYUV, x, y, Nstart, Nstart, imgW);

          box(
            yuvdata[0],
            ly,
            0,
            0,
            Nstart,
            Nstart,
            Nstart,
            boundry1,
            false,
            false
          );
          boxUV(
            [yuvdata[0], yuvdata[1], yuvdata[2]],
            [lu, lv],
            0,
            0,
            Nstart,
            Nstart,
            Nstart,
            boundry2,
            false,
            false
          );

          var yuv = [ly, lu, lv];
          setPixelsYUV(yuv, imageDataRGB, x, y, Nstart, Nstart, imgW);
        }
      }
      dst.putImageData(imageDataDst, 0, 0); // at coords 0,0
      dstYUV.putImageData(imageDataYUV, 0, 0); // at coords 0,0
      dstRGB.putImageData(imageDataRGB, 0, 0); // at coords 0,0
    }
    boxchecked = checked;
    userinput1 = parameter1;
  };

  //----------------------------------------------

  const init = () => {
    // var image_x = ref.current;
    // image_x.parentNode.removeChild(image_x);
    dst = document.getElementById("dst").getContext("2d");
    dstYUV = document.getElementById("YUV").getContext("2d");
    dstRGB = document.getElementById("RGB").getContext("2d");
    imgW = 400;
    imgH = 605;

    dst.drawImage(ref.current, 0, 0, imgW, imgH);
    imageDataSrc = dst.getImageData(0, 0, imgW, imgH);
    imageDataDst = dst.getImageData(0, 0, imgW, imgH);
    imageDataYUV = dstYUV.getImageData(0, 0, imgW, imgH);
    imageDataRGB = dstRGB.getImageData(0, 0, imgW, imgH);

    draw();
  };

  const RGB_to_YUV = (rgb) => {
    var Y = 0.257 * rgb.r + 0.504 * rgb.g + 0.098 * rgb.b + 16;
    var U = -0.148 * rgb.r - 0.291 * rgb.g + 0.439 * rgb.b + 128;
    var V = 0.439 * rgb.r - 0.368 * rgb.g - 0.071 * rgb.b + 128;
    return { y: Y, u: U, v: V };
  };

  const YUV_to_RGB = (yuv) => {
    yuv.y -= 10;
    yuv.u -= 128;
    yuv.v -= 128;
    var R = 1.164 * yuv.y + 1.596 * yuv.v;
    var G = 1.164 * yuv.y - 0.392 * yuv.u - 0.813 * yuv.v;
    var B = 1.164 * yuv.y + 2.017 * yuv.u;
    return { r: R, g: G, b: B };
  };

  return (
    <div className={styles.main}>
      <div className={styles.horiz}>
        <img
          className={styles.image}
          ref={ref}
          src={imageSrc}
          id="image"
          alt="image"
          height="605"
          width="400"
        />

        <canvas
          className={styles.canvas}
          id="dst"
          width="400"
          height="605"
        ></canvas>
        <canvas
          className={styles.canvas}
          id="YUV"
          width="400"
          height="605"
        ></canvas>
        <canvas
          className={styles.canvas}
          id="RGB"
          width="400"
          height="605"
        ></canvas>
      </div>
      <span>aminé</span>
    </div>
  );
};

export default Home;
