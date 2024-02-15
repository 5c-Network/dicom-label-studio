import React from "react";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import Hammer from "hammerjs";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneTools from "cornerstone-tools";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneFileImageLoader from "cornerstone-file-image-loader";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import * as blobUtil from "blob-util";
//import * as math from 'mathjs'
import { uids } from "../constants/uids";
import { SETTINGS_SAVEAS } from "../constants/settings";
import OpenUrlDlg from "./OpenUrlDlg";
import CinePlayer from "./CinePlayer";
import { isMobile } from "react-device-detect";
import { import as csTools } from "cornerstone-tools";
import db from "../db/db";
import fs from "../fs/fs";
//import { EPSILON } from '../LinearAlgebra/constants'
import Matrix from "../LinearAlgebra/Matrix";
import Point from "../LinearAlgebra/Point";
//import Vector from '../LinearAlgebra/Vector'
import Line from "../LinearAlgebra/Line";
import DicomGeometry from "../DicomGeometry/DicomGeometry";

import { areEqual } from "../LinearAlgebra/utils";

import {
  clearStore,
  dcmIsOpen,
  activeDcm,
  dcmTool,
  activeMeasurements,
  doFsRefresh,
  setDcmEnableTool,
} from "../actions";

import {
  getDicomIpp,
  //getDicomFrameOfReferenceUID,
  capitalize,
  getFileName,
  getSettingsOverlay,
  getSettingsSaveInto,
  isFileImage,
  isFsFileImage,
  isLocalizer,
  isUrlImage,
  //objectIsEmpty,
} from "../functions";

const scrollToIndex = csTools("util/scrollToIndex");

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneFileImageLoader.external.cornerstone = cornerstone;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.init({
  globalToolSyncEnabled: true,
});

// const toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;

// const existingToolState = toolStateManager.saveToolState();

class DicomViewer extends React.Component {
  constructor(props) {
    super(props);
    this.files = null;
    this.filename = "";
    this.localfile = null;
    this.localurl = null;
    this.fsItem = null;
    this.dicomImage = null;
    this.explorerIndex = 0;
    this.imageId = null;
    this.image = null;
    this.isDicom = false;
    this.layoutIndex = 0;
    this.numberOfFrames = 1;
    this.measurements = [];
    this.xSize = 0;
    this.ySize = 0;
    this.zSize = 0;
    this.volume = null;
    this.originImage = null;
    this.mprPlane = "";
    this.sliceMax = 0;
    this.sliceIndex = 0;
    this.mpr = {};
    this.referenceLines = {};
    this.shouldScroll = false;
  }

  state = {
    visibleOpenUrlDlg: false,
    progress: null,
    visibleCinePlayer: false,
    errorOnOpenImage: null,
    errorOnCors: false,
    frame: 1,
    inPlay: false,
    viewport: null,
  };

  componentDidMount() {
    //console.log('dicomviewer - componentDidMount: ')
    this.props.runTool(this);
    this.props.changeTool(this);
    cornerstone.events.addEventListener(
      "cornerstoneimageloaded",
      this.onImageLoaded
    );
    const { dcmRef } = this.props;
    dcmRef(this);
    this.layoutIndex = this.props.index;

  

    document
      .getElementById(`viewer-${this.props.index}`)
      .addEventListener("wheel", this.handlerMouseScroll);

    //   cornerstoneTools?.restoreToolState?.(element, null,[
    //     {
    //         "tool": "Length",
    //         "note": "",
    //         "data": {
    //             "visible": true,
    //             "active": false,
    //             "invalidated": false,
    //             "handles": {
    //                 "start": {
    //                     "x": 315.8893576835277,
    //                     "y": 312.1162665644778,
    //                     "highlight": true,
    //                     "active": false
    //                 },
    //                 "end": {
    //                     "x": 372.59821844302144,
    //                     "y": 232.18377711300104,
    //                     "highlight": true,
    //                     "active": false,
    //                     "moving": false
    //                 },
    //                 "textBox": {
    //                     "active": false,
    //                     "hasMoved": false,
    //                     "movesIndependently": false,
    //                     "drawnIndependently": true,
    //                     "allowedOutsideImage": true,
    //                     "hasBoundingBox": true,
    //                     "x": 372.59821844302144,
    //                     "y": 232.18377711300104,
    //                     "boundingBox": {
    //                         "width": 76.6943359375,
    //                         "height": 25,
    //                         "left": 1646.888888835907,
    //                         "top": 417.402774810791
    //                     }
    //                 }
    //             },
    //             "uuid": "54fc61af-2358-4929-be8d-4ca8d333fcb1",
    //             "length": 82.1179739812005,
    //             "unit": "mm"
    //         }
    //     }
    // ])
  }

  componentWillUnmount() {
    this.props.runTool(undefined);
    this.props.changeTool(undefined);
    const { dcmRef } = this.props;
    dcmRef(undefined);
  }

  restoneImageData = () => {
    console.log("joojj")
    const element = this.dicomImage;
    const x = [
      {
          "tool": "Length",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 148.98495034869194,
                      "y": 238.63080308897696,
                      "highlight": true,
                      "active": false
                  },
                  "end": {
                      "x": 148.98495034869194,
                      "y": 238.2619270082853,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 148.98495034869194,
                      "y": 238.63080308897696,
                      "boundingBox": {
                          "width": 68.35205078125,
                          "height": 25,
                          "left": 65.64793467246834,
                          "top": 57.41136809247372
                      }
                  }
              },
              "uuid": "c8c13d55-6fd6-4294-a047-cf1fe67aba79",
              "length": 0.2838616714697456,
              "unit": "mm"
          },
          "sliceIndex": 0
      },
      {
          "tool": "Length",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 165.95325006050751,
                      "y": 274.41178291606633,
                      "highlight": true,
                      "active": false
                  },
                  "end": {
                      "x": 208.00512325935478,
                      "y": 193.25904516390491,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 208.00512325935478,
                      "y": 193.25904516390491,
                      "boundingBox": {
                          "width": 76.6943359375,
                          "height": 25,
                          "left": 82.9390009548891,
                          "top": 44.118860887862766
                      }
                  }
              },
              "uuid": "1cabd76c-8f51-4340-8466-c97bd71f8ffb",
              "length": 70.33585877717721,
              "unit": "mm"
          },
          "sliceIndex": 0
      },
      {
          "tool": "Angle",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 389.49215495964296,
                      "y": 217.97374257024498,
                      "highlight": true,
                      "active": false
                  },
                  "middle": {
                      "x": 359.24431634292824,
                      "y": 265.18988089877524,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "end": {
                      "x": 403.1405699452337,
                      "y": 255.96797888148419,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 91.17764967626161,
                      "y": 265.18988089877524,
                      "boundingBox": {
                          "width": 53.53515625,
                          "height": 25,
                          "left": 38.712202053592264,
                          "top": 65.19234791956306
                      }
                  }
              },
              "uuid": "e3aadeff-6a9d-412d-9111-98cfd48b6017",
              "rAngle": 45.49
          },
          "sliceIndex": 0
      },
      {
          "tool": "Angle",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 389.49215495964296,
                      "y": 217.97374257024498,
                      "highlight": true,
                      "active": false
                  },
                  "middle": {
                      "x": 359.24431634292824,
                      "y": 265.18988089877524,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "end": {
                      "x": 403.1405699452337,
                      "y": 255.96797888148419,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 91.17764967626161,
                      "y": 265.18988089877524,
                      "boundingBox": {
                          "width": 53.53515625,
                          "height": 25,
                          "left": 38.712202053592264,
                          "top": 65.19234791956306
                      }
                  }
              },
              "uuid": "e3aadeff-6a9d-412d-9111-98cfd48b6017",
              "rAngle": 45.49
          },
          "sliceIndex": 0
      },
      {
          "tool": "EllipticalRoi",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 334.8984950172798,
                      "y": 269.616393867075,
                      "highlight": true,
                      "active": false
                  },
                  "end": {
                      "x": 395.39417225070923,
                      "y": 331.21869934257927,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "initialRotation": 0,
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 395.39417225070923,
                      "y": 300.4175466048271,
                      "boundingBox": {
                          "width": 286.80419921875,
                          "height": 45,
                          "left": 1808.888888835907,
                          "top": 791.9131927490236
                      }
                  }
              },
              "uuid": "8bb24821-3b0c-4104-8df2-e251eeee9aff",
              "cachedStats": {
                  "area": 1730.1563177893775,
                  "count": 2909,
                  "mean": -601.1289102784463,
                  "variance": 53558.74412466324,
                  "stdDev": 231.42762178414063,
                  "min": -829,
                  "max": 78
              },
              "unit": "HU"
          },
          "sliceIndex": 4
      },
      {
          "tool": "RectangleRoi",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "start": {
                      "x": 159.31348060805794,
                      "y": 282.1581806105908,
                      "highlight": true,
                      "active": false
                  },
                  "end": {
                      "x": 234.93307714984468,
                      "y": 352.6135120226946,
                      "highlight": true,
                      "active": false,
                      "moving": false
                  },
                  "initialRotation": 0,
                  "textBox": {
                      "active": true,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 234.93307714984468,
                      "y": 317.3858463166427,
                      "boundingBox": {
                          "width": 143.4033203125,
                          "height": 65,
                          "left": 1373.888888835907,
                          "top": 827.9131927490236
                      }
                  }
              },
              "uuid": "347d317f-bbb9-4c82-b9bd-299ec93aca82",
              "cachedStats": {
                  "area": 3155.009997176291,
                  "count": 5396,
                  "mean": -320.96756856931063,
                  "variance": 138657.11106829124,
                  "stdDev": 372.366903830471,
                  "min": -821,
                  "max": 157
              },
              "unit": "HU"
          },
          "sliceIndex": 4
      },
      {
          "tool": "FreehandRoi",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "points": [
                      {
                          "x": 258.54114631410977,
                          "y": 289.53570222442363,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 257.4345180720349,
                                  "y": 291.0112065471902
                              }
                          ]
                      },
                      {
                          "x": 257.4345180720349,
                          "y": 291.0112065471902,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 256.32788982995993,
                                  "y": 292.11783478926515
                              }
                          ]
                      },
                      {
                          "x": 256.32788982995993,
                          "y": 292.11783478926515,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 254.85238550719333,
                                  "y": 293.59333911203174
                              }
                          ]
                      },
                      {
                          "x": 254.85238550719333,
                          "y": 293.59333911203174,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 253.00800510373512,
                                  "y": 295.43771951548996
                              }
                          ]
                      },
                      {
                          "x": 253.00800510373512,
                          "y": 295.43771951548996,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 251.53250078096863,
                                  "y": 296.9132238382565
                              }
                          ]
                      },
                      {
                          "x": 251.53250078096863,
                          "y": 296.9132238382565,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 250.05699645820204,
                                  "y": 298.3887281610231
                              }
                          ]
                      },
                      {
                          "x": 250.05699645820204,
                          "y": 298.3887281610231,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 248.95036821612706,
                                  "y": 299.86423248378964
                              }
                          ]
                      },
                      {
                          "x": 248.95036821612706,
                          "y": 299.86423248378964,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 247.8437399740522,
                                  "y": 300.97086072586455
                              }
                          ]
                      },
                      {
                          "x": 247.8437399740522,
                          "y": 300.97086072586455,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 247.10598781266884,
                                  "y": 302.07748896793953
                              }
                          ]
                      },
                      {
                          "x": 247.10598781266884,
                          "y": 302.07748896793953,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 245.99935957059398,
                                  "y": 303.18411721001445
                              }
                          ]
                      },
                      {
                          "x": 245.99935957059398,
                          "y": 303.18411721001445,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 244.892731328519,
                                  "y": 304.29074545208937
                              }
                          ]
                      },
                      {
                          "x": 244.892731328519,
                          "y": 304.29074545208937,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 243.7861030864441,
                                  "y": 305.02849761347267
                              }
                          ]
                      },
                      {
                          "x": 243.7861030864441,
                          "y": 305.02849761347267,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 243.04835092506084,
                                  "y": 305.7662497748559
                              }
                          ]
                      },
                      {
                          "x": 243.04835092506084,
                          "y": 305.7662497748559,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 242.31059876367755,
                                  "y": 306.5040019362392
                              }
                          ]
                      },
                      {
                          "x": 242.31059876367755,
                          "y": 306.5040019362392,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 241.20397052160263,
                                  "y": 307.2417540976225
                              }
                          ]
                      },
                      {
                          "x": 241.20397052160263,
                          "y": 307.2417540976225,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 240.09734227952765,
                                  "y": 307.9795062590058
                              }
                          ]
                      },
                      {
                          "x": 240.09734227952765,
                          "y": 307.9795062590058,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 239.3595901181444,
                                  "y": 308.7172584203891
                              }
                          ]
                      },
                      {
                          "x": 239.3595901181444,
                          "y": 308.7172584203891,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 238.25296187606943,
                                  "y": 309.45501058177234
                              }
                          ]
                      },
                      {
                          "x": 238.25296187606943,
                          "y": 309.45501058177234,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 237.14633363399452,
                                  "y": 310.93051490453894
                              }
                          ]
                      },
                      {
                          "x": 237.14633363399452,
                          "y": 310.93051490453894,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 236.0397053919196,
                                  "y": 312.4060192273055
                              }
                          ]
                      },
                      {
                          "x": 236.0397053919196,
                          "y": 312.4060192273055,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 234.93307714984468,
                                  "y": 313.8815235500721
                              }
                          ]
                      },
                      {
                          "x": 234.93307714984468,
                          "y": 313.8815235500721,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 233.82644890776976,
                                  "y": 315.7259039535303
                              }
                          ]
                      },
                      {
                          "x": 233.82644890776976,
                          "y": 315.7259039535303,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 233.08869674638646,
                                  "y": 316.4636561149136
                              }
                          ]
                      },
                      {
                          "x": 233.08869674638646,
                          "y": 316.4636561149136,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 232.71982066569484,
                                  "y": 317.5702843569885
                              }
                          ]
                      },
                      {
                          "x": 232.71982066569484,
                          "y": 317.5702843569885,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 231.98206850431154,
                                  "y": 318.3080365183718
                              }
                          ]
                      },
                      {
                          "x": 231.98206850431154,
                          "y": 318.3080365183718,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 231.24431634292824,
                                  "y": 319.04578867975505
                              }
                          ]
                      },
                      {
                          "x": 231.24431634292824,
                          "y": 319.04578867975505,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 230.13768810085332,
                                  "y": 320.52129300252165
                              }
                          ]
                      },
                      {
                          "x": 230.13768810085332,
                          "y": 320.52129300252165,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 229.39993593947003,
                                  "y": 321.25904516390494
                              }
                          ]
                      },
                      {
                          "x": 229.39993593947003,
                          "y": 321.25904516390494,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 228.66218377808673,
                                  "y": 321.9967973252882
                              }
                          ]
                      },
                      {
                          "x": 228.66218377808673,
                          "y": 321.9967973252882,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 227.9244316167035,
                                  "y": 322.7345494866715
                              }
                          ]
                      },
                      {
                          "x": 227.9244316167035,
                          "y": 322.7345494866715,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 226.4489272939369,
                                  "y": 323.8411777287464
                              }
                          ]
                      },
                      {
                          "x": 226.4489272939369,
                          "y": 323.8411777287464,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 224.97342297117035,
                                  "y": 324.9478059708214
                              }
                          ]
                      },
                      {
                          "x": 224.97342297117035,
                          "y": 324.9478059708214,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 223.86679472909537,
                                  "y": 325.6855581322046
                              }
                          ]
                      },
                      {
                          "x": 223.86679472909537,
                          "y": 325.6855581322046,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 222.76016648702046,
                                  "y": 326.7921863742796
                              }
                          ]
                      },
                      {
                          "x": 222.76016648702046,
                          "y": 326.7921863742796,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 221.65353824494554,
                                  "y": 327.52993853566284
                              }
                          ]
                      },
                      {
                          "x": 221.65353824494554,
                          "y": 327.52993853566284,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 220.178033922179,
                                  "y": 328.26769069704613
                              }
                          ]
                      },
                      {
                          "x": 220.178033922179,
                          "y": 328.26769069704613,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 218.7025295994124,
                                  "y": 329.00544285842943
                              }
                          ]
                      },
                      {
                          "x": 218.7025295994124,
                          "y": 329.00544285842943,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 217.59590135733748,
                                  "y": 329.74319501981273
                              }
                          ]
                      },
                      {
                          "x": 217.59590135733748,
                          "y": 329.74319501981273,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 216.48927311526256,
                                  "y": 330.11207110050435
                              }
                          ]
                      },
                      {
                          "x": 216.48927311526256,
                          "y": 330.11207110050435,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 215.01376879249597,
                                  "y": 330.480947181196
                              }
                          ]
                      },
                      {
                          "x": 215.01376879249597,
                          "y": 330.480947181196,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 213.90714055042105,
                                  "y": 330.84982326188765
                              }
                          ]
                      },
                      {
                          "x": 213.90714055042105,
                          "y": 330.84982326188765,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 212.80051230834613,
                                  "y": 331.21869934257927
                              }
                          ]
                      },
                      {
                          "x": 212.80051230834613,
                          "y": 331.21869934257927,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 211.6938840662712,
                                  "y": 331.58757542327095
                              }
                          ]
                      },
                      {
                          "x": 211.6938840662712,
                          "y": 331.58757542327095,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 210.58725582419623,
                                  "y": 331.95645150396257
                              }
                          ]
                      },
                      {
                          "x": 210.58725582419623,
                          "y": 331.95645150396257,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 209.48062758212131,
                                  "y": 331.95645150396257
                              }
                          ]
                      },
                      {
                          "x": 209.48062758212131,
                          "y": 331.95645150396257,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 207.6362471786631,
                                  "y": 332.3253275846542
                              }
                          ]
                      },
                      {
                          "x": 207.6362471786631,
                          "y": 332.3253275846542,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 205.79186677520488,
                                  "y": 332.69420366534587
                              }
                          ]
                      },
                      {
                          "x": 205.79186677520488,
                          "y": 332.69420366534587,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 203.94748637174672,
                                  "y": 332.69420366534587
                              }
                          ]
                      },
                      {
                          "x": 203.94748637174672,
                          "y": 332.69420366534587,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 202.1031059682885,
                                  "y": 333.0630797460375
                              }
                          ]
                      },
                      {
                          "x": 202.1031059682885,
                          "y": 333.0630797460375,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 200.99647772621353,
                                  "y": 333.0630797460375
                              }
                          ]
                      },
                      {
                          "x": 200.99647772621353,
                          "y": 333.0630797460375,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 199.520973403447,
                                  "y": 333.0630797460375
                              }
                          ]
                      },
                      {
                          "x": 199.520973403447,
                          "y": 333.0630797460375,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 198.41434516137207,
                                  "y": 333.0630797460375
                              }
                          ]
                      },
                      {
                          "x": 198.41434516137207,
                          "y": 333.0630797460375,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 197.30771691929715,
                                  "y": 332.69420366534587
                              }
                          ]
                      },
                      {
                          "x": 197.30771691929715,
                          "y": 332.69420366534587,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 195.83221259653055,
                                  "y": 332.69420366534587
                              }
                          ]
                      },
                      {
                          "x": 195.83221259653055,
                          "y": 332.69420366534587,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 194.72558435445563,
                                  "y": 332.3253275846542
                              }
                          ]
                      },
                      {
                          "x": 194.72558435445563,
                          "y": 332.3253275846542,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 193.61895611238072,
                                  "y": 331.95645150396257
                              }
                          ]
                      },
                      {
                          "x": 193.61895611238072,
                          "y": 331.95645150396257,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 192.88120395099742,
                                  "y": 331.21869934257927
                              }
                          ]
                      },
                      {
                          "x": 192.88120395099742,
                          "y": 331.21869934257927,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 191.7745757089225,
                                  "y": 330.11207110050435
                              }
                          ]
                      },
                      {
                          "x": 191.7745757089225,
                          "y": 330.11207110050435,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 191.0368235475392,
                                  "y": 329.00544285842943
                              }
                          ]
                      },
                      {
                          "x": 191.0368235475392,
                          "y": 329.00544285842943,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 190.2990713861559,
                                  "y": 327.8988146163545
                              }
                          ]
                      },
                      {
                          "x": 190.2990713861559,
                          "y": 327.8988146163545,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.93019530546428,
                                  "y": 326.4233102935879
                              }
                          ]
                      },
                      {
                          "x": 189.93019530546428,
                          "y": 326.4233102935879,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.5613192247726,
                                  "y": 324.5789298901297
                              }
                          ]
                      },
                      {
                          "x": 189.5613192247726,
                          "y": 324.5789298901297,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 323.4723016480548
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 323.4723016480548,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 322.36567340597986
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 322.36567340597986,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 321.25904516390494
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 321.25904516390494,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 320.15241692183
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 320.15241692183,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 318.6769125990634
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 318.6769125990634,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 316.8325321956052
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 316.8325321956052,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 315.7259039535303
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 315.7259039535303,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 314.2503996307637
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 314.2503996307637,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 313.1437713886888
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 313.1437713886888,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 311.66826706592224
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 311.66826706592224,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 310.19276274315564
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 310.19276274315564,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.19244314408098,
                                  "y": 308.3483823396974
                              }
                          ]
                      },
                      {
                          "x": 189.19244314408098,
                          "y": 308.3483823396974,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.5613192247726,
                                  "y": 306.5040019362392
                              }
                          ]
                      },
                      {
                          "x": 189.5613192247726,
                          "y": 306.5040019362392,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 189.93019530546428,
                                  "y": 305.02849761347267
                              }
                          ]
                      },
                      {
                          "x": 189.93019530546428,
                          "y": 305.02849761347267,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 190.2990713861559,
                                  "y": 303.18411721001445
                              }
                          ]
                      },
                      {
                          "x": 190.2990713861559,
                          "y": 303.18411721001445,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 190.2990713861559,
                                  "y": 301.70861288724785
                              }
                          ]
                      },
                      {
                          "x": 190.2990713861559,
                          "y": 301.70861288724785,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 190.66794746684758,
                                  "y": 300.60198464517293
                              }
                          ]
                      },
                      {
                          "x": 190.66794746684758,
                          "y": 300.60198464517293,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 190.66794746684758,
                                  "y": 299.12648032240634
                              }
                          ]
                      },
                      {
                          "x": 190.66794746684758,
                          "y": 299.12648032240634,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 191.0368235475392,
                                  "y": 298.0198520803314
                              }
                          ]
                      },
                      {
                          "x": 191.0368235475392,
                          "y": 298.0198520803314,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 191.40569962823082,
                                  "y": 296.5443477575649
                              }
                          ]
                      },
                      {
                          "x": 191.40569962823082,
                          "y": 296.5443477575649,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 191.7745757089225,
                                  "y": 295.43771951548996
                              }
                          ]
                      },
                      {
                          "x": 191.7745757089225,
                          "y": 295.43771951548996,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 192.14345178961412,
                                  "y": 293.96221519272336
                              }
                          ]
                      },
                      {
                          "x": 192.14345178961412,
                          "y": 293.96221519272336,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 192.5123278703058,
                                  "y": 292.4867108699568
                              }
                          ]
                      },
                      {
                          "x": 192.5123278703058,
                          "y": 292.4867108699568,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 192.88120395099742,
                                  "y": 291.0112065471902
                              }
                          ]
                      },
                      {
                          "x": 192.88120395099742,
                          "y": 291.0112065471902,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 192.88120395099742,
                                  "y": 289.53570222442363
                              }
                          ]
                      },
                      {
                          "x": 192.88120395099742,
                          "y": 289.53570222442363,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 193.25008003168904,
                                  "y": 288.4290739823487
                              }
                          ]
                      },
                      {
                          "x": 193.25008003168904,
                          "y": 288.4290739823487,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 193.98783219307234,
                                  "y": 287.3224457402738
                              }
                          ]
                      },
                      {
                          "x": 193.98783219307234,
                          "y": 287.3224457402738,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 194.35670827376396,
                                  "y": 286.2158174981989
                              }
                          ]
                      },
                      {
                          "x": 194.35670827376396,
                          "y": 286.2158174981989,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 195.09446043514725,
                                  "y": 285.4780653368156
                              }
                          ]
                      },
                      {
                          "x": 195.09446043514725,
                          "y": 285.4780653368156,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 195.46333651583893,
                                  "y": 284.37143709474066
                              }
                          ]
                      },
                      {
                          "x": 195.46333651583893,
                          "y": 284.37143709474066,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 196.20108867722217,
                                  "y": 283.63368493335736
                              }
                          ]
                      },
                      {
                          "x": 196.20108867722217,
                          "y": 283.63368493335736,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 196.93884083860547,
                                  "y": 282.89593277197406
                              }
                          ]
                      },
                      {
                          "x": 196.93884083860547,
                          "y": 282.89593277197406,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 198.41434516137207,
                                  "y": 282.1581806105908
                              }
                          ]
                      },
                      {
                          "x": 198.41434516137207,
                          "y": 282.1581806105908,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 199.8898494841386,
                                  "y": 281.0515523685159
                              }
                          ]
                      },
                      {
                          "x": 199.8898494841386,
                          "y": 281.0515523685159,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 201.3653538069052,
                                  "y": 279.9449241264409
                              }
                          ]
                      },
                      {
                          "x": 201.3653538069052,
                          "y": 279.9449241264409,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 202.47198204898012,
                                  "y": 278.838295884366
                              }
                          ]
                      },
                      {
                          "x": 202.47198204898012,
                          "y": 278.838295884366,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 203.94748637174672,
                                  "y": 278.1005437229827
                              }
                          ]
                      },
                      {
                          "x": 203.94748637174672,
                          "y": 278.1005437229827,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 205.05411461382164,
                                  "y": 276.9939154809078
                              }
                          ]
                      },
                      {
                          "x": 205.05411461382164,
                          "y": 276.9939154809078,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 206.52961893658818,
                                  "y": 276.25616331952455
                              }
                          ]
                      },
                      {
                          "x": 206.52961893658818,
                          "y": 276.25616331952455,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 207.6362471786631,
                                  "y": 275.51841115814125
                              }
                          ]
                      },
                      {
                          "x": 207.6362471786631,
                          "y": 275.51841115814125,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 209.1117515014297,
                                  "y": 274.78065899675795
                              }
                          ]
                      },
                      {
                          "x": 209.1117515014297,
                          "y": 274.78065899675795,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 210.58725582419623,
                                  "y": 274.04290683537465
                              }
                          ]
                      },
                      {
                          "x": 210.58725582419623,
                          "y": 274.04290683537465,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 211.6938840662712,
                                  "y": 273.30515467399135
                              }
                          ]
                      },
                      {
                          "x": 211.6938840662712,
                          "y": 273.30515467399135,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 212.80051230834613,
                                  "y": 272.93627859329973
                              }
                          ]
                      },
                      {
                          "x": 212.80051230834613,
                          "y": 272.93627859329973,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 213.90714055042105,
                                  "y": 272.19852643191643
                              }
                          ]
                      },
                      {
                          "x": 213.90714055042105,
                          "y": 272.19852643191643,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 215.38264487318764,
                                  "y": 271.8296503512248
                              }
                          ]
                      },
                      {
                          "x": 215.38264487318764,
                          "y": 271.8296503512248,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 216.85814919595418,
                                  "y": 271.46077427053314
                              }
                          ]
                      },
                      {
                          "x": 216.85814919595418,
                          "y": 271.46077427053314,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 218.7025295994124,
                                  "y": 271.0918981898415
                              }
                          ]
                      },
                      {
                          "x": 218.7025295994124,
                          "y": 271.0918981898415,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 219.80915784148732,
                                  "y": 271.0918981898415
                              }
                          ]
                      },
                      {
                          "x": 219.80915784148732,
                          "y": 271.0918981898415,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 221.28466216425392,
                                  "y": 270.7230221091499
                              }
                          ]
                      },
                      {
                          "x": 221.28466216425392,
                          "y": 270.7230221091499,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 223.12904256771213,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 223.12904256771213,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 224.23567080978705,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 224.23567080978705,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 225.34229905186197,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 225.34229905186197,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 226.4489272939369,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 226.4489272939369,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 227.9244316167035,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 227.9244316167035,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 229.0310598587784,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 229.0310598587784,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 230.87544026223662,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 230.87544026223662,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 232.35094458500316,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 232.35094458500316,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 234.19532498846138,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 234.19532498846138,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 236.0397053919196,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 236.0397053919196,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 237.14633363399452,
                                  "y": 270.3541460284582
                              }
                          ]
                      },
                      {
                          "x": 237.14633363399452,
                          "y": 270.3541460284582,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 238.99071403745273,
                                  "y": 270.7230221091499
                              }
                          ]
                      },
                      {
                          "x": 238.99071403745273,
                          "y": 270.7230221091499,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 240.46621836021933,
                                  "y": 271.46077427053314
                              }
                          ]
                      },
                      {
                          "x": 240.46621836021933,
                          "y": 271.46077427053314,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 241.94172268298587,
                                  "y": 272.5674025126081
                              }
                          ]
                      },
                      {
                          "x": 241.94172268298587,
                          "y": 272.5674025126081,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 243.41722700575247,
                                  "y": 273.30515467399135
                              }
                          ]
                      },
                      {
                          "x": 243.41722700575247,
                          "y": 273.30515467399135,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 244.15497916713576,
                                  "y": 274.04290683537465
                              }
                          ]
                      },
                      {
                          "x": 244.15497916713576,
                          "y": 274.04290683537465,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 245.26160740921063,
                                  "y": 274.78065899675795
                              }
                          ]
                      },
                      {
                          "x": 245.26160740921063,
                          "y": 274.78065899675795,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 246.3682356512856,
                                  "y": 275.14953507744957
                              }
                          ]
                      },
                      {
                          "x": 246.3682356512856,
                          "y": 275.14953507744957,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 247.10598781266884,
                                  "y": 275.88728723883287
                              }
                          ]
                      },
                      {
                          "x": 247.10598781266884,
                          "y": 275.88728723883287,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 247.8437399740522,
                                  "y": 276.62503940021617
                              }
                          ]
                      },
                      {
                          "x": 247.8437399740522,
                          "y": 276.62503940021617,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 248.95036821612706,
                                  "y": 277.36279156159947
                              }
                          ]
                      },
                      {
                          "x": 248.95036821612706,
                          "y": 277.36279156159947,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 249.68812037751042,
                                  "y": 278.1005437229827
                              }
                          ]
                      },
                      {
                          "x": 249.68812037751042,
                          "y": 278.1005437229827,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 250.42587253889366,
                                  "y": 278.838295884366
                              }
                          ]
                      },
                      {
                          "x": 250.42587253889366,
                          "y": 278.838295884366,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 251.163624700277,
                                  "y": 279.9449241264409
                              }
                          ]
                      },
                      {
                          "x": 251.163624700277,
                          "y": 279.9449241264409,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 252.27025294235187,
                                  "y": 280.6826762878242
                              }
                          ]
                      },
                      {
                          "x": 252.27025294235187,
                          "y": 280.6826762878242,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 253.00800510373512,
                                  "y": 281.4204284492075
                              }
                          ]
                      },
                      {
                          "x": 253.00800510373512,
                          "y": 281.4204284492075,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 253.74575726511847,
                                  "y": 282.1581806105908
                              }
                          ]
                      },
                      {
                          "x": 253.74575726511847,
                          "y": 282.1581806105908,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 254.85238550719333,
                                  "y": 282.52705669128244
                              }
                          ]
                      },
                      {
                          "x": 254.85238550719333,
                          "y": 282.52705669128244,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 255.5901376685767,
                                  "y": 283.26480885266574
                              }
                          ]
                      },
                      {
                          "x": 255.5901376685767,
                          "y": 283.26480885266574,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 256.32788982995993,
                                  "y": 284.00256101404904
                              }
                          ]
                      },
                      {
                          "x": 256.32788982995993,
                          "y": 284.00256101404904,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 257.0656419913433,
                                  "y": 284.7403131754323
                              }
                          ]
                      },
                      {
                          "x": 257.0656419913433,
                          "y": 284.7403131754323,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 257.8033941527265,
                                  "y": 285.4780653368156
                              }
                          ]
                      },
                      {
                          "x": 257.8033941527265,
                          "y": 285.4780653368156,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 258.54114631410977,
                                  "y": 286.2158174981989
                              }
                          ]
                      },
                      {
                          "x": 258.54114631410977,
                          "y": 286.2158174981989,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 259.2788984754931,
                                  "y": 287.3224457402738
                              }
                          ]
                      },
                      {
                          "x": 259.2788984754931,
                          "y": 287.3224457402738,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 259.2788984754931,
                                  "y": 288.4290739823487
                              }
                          ]
                      },
                      {
                          "x": 259.2788984754931,
                          "y": 288.4290739823487,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 258.54114631410977,
                                  "y": 289.53570222442363,
                                  "highlight": true,
                                  "active": true,
                                  "lines": [
                                      {
                                          "x": 257.4345180720349,
                                          "y": 291.0112065471902
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 259.2788984754931,
                      "y": 301.70861288724785,
                      "boundingBox": {
                          "width": 142.56103515625,
                          "height": 65,
                          "left": 1424.900096038233,
                          "top": 326.36825243815224
                      }
                  },
                  "invalidHandlePlacement": false
              },
              "uuid": "910d0520-a469-43a7-90d7-bdc94ef2c2cb",
              "canComplete": false,
              "highlight": false,
              "polyBoundingBox": {
                  "left": 189.19244314408098,
                  "top": 270.3541460284582,
                  "width": 70.08645533141214,
                  "height": 62.70893371757927
              },
              "meanStdDev": {
                  "count": 2963,
                  "mean": 93.05366182922714,
                  "variance": 316.4213526051808,
                  "stdDev": 17.788236354545685
              },
              "area": 1755.2185613201655,
              "unit": "HU"
          },
          "sliceIndex": 8
      },
      {
          "tool": "FreehandRoi",
          "note": "",
          "data": {
              "visible": true,
              "active": false,
              "invalidated": false,
              "handles": {
                  "points": [
                      {
                          "x": 310.9215497723231,
                          "y": 199.89881461635449,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 307.6016650460983,
                                  "y": 248.59045726765132
                              }
                          ]
                      },
                      {
                          "x": 307.6016650460983,
                          "y": 248.59045726765132,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 358.506564181545,
                                  "y": 250.80371375180118
                              }
                          ]
                      },
                      {
                          "x": 358.506564181545,
                          "y": 250.80371375180118,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 362.9330771498447,
                                  "y": 196.5789298901297
                              }
                          ]
                      },
                      {
                          "x": 362.9330771498447,
                          "y": 196.5789298901297,
                          "highlight": true,
                          "active": true,
                          "lines": [
                              {
                                  "x": 310.9215497723231,
                                  "y": 199.89881461635449,
                                  "highlight": true,
                                  "active": true,
                                  "lines": [
                                      {
                                          "x": 307.6016650460983,
                                          "y": 248.59045726765132
                                      }
                                  ]
                              }
                          ]
                      }
                  ],
                  "textBox": {
                      "active": false,
                      "hasMoved": false,
                      "movesIndependently": false,
                      "drawnIndependently": true,
                      "allowedOutsideImage": true,
                      "hasBoundingBox": true,
                      "x": 362.9330771498447,
                      "y": 253.7502398312264,
                      "boundingBox": {
                          "width": 142.56103515625,
                          "height": 65,
                          "left": 1548.191882781749,
                          "top": 269.32401573675173
                      }
                  },
                  "invalidHandlePlacement": false
              },
              "uuid": "a55ad737-e32b-4425-9f44-62cbe7f6d13f",
              "canComplete": false,
              "highlight": false,
              "polyBoundingBox": {
                  "left": 307.6016650460983,
                  "top": 196.5789298901297,
                  "width": 55.3314121037464,
                  "height": 114.34261988219339
              },
              "meanStdDev": {
                  "count": 2646,
                  "mean": 89.29818594104309,
                  "variance": 142.18961878024038,
                  "stdDev": 11.924328860788785
              },
              "area": 1566.788197933708,
              "unit": "HU"
          },
          "sliceIndex": 8
      }
  ]

    x.forEach((measure) => {
      if(measure.sliceIndex === this.sliceIndex){
        this.measurementSave(measure);
        cornerstoneTools.addToolState(element, measure.tool, measure.data);
        this.runTool(measure.tool);
        cornerstone.updateImage(element);
        cornerstoneTools.setToolEnabled(measure.tool)
      }
      })
      
  }

  componentDidUpdate(previousProps) {
    //console.log('dicomviewer - componentDidUpdate: ')
    const isOpen = this.props.isOpen[this.props.index];
    if (this.props.layout !== previousProps.layout && isOpen) {
      cornerstone.resize(this.dicomImage);
    }

    console.log("this.measure", this.measurements)
    if(isOpen){
    this.restoneImageData()
      
    }
  }

  handlerMouseScroll = (e) => {
    if (this.shouldScroll) {
      if (e.deltaY > 0) this.props.listOpenFilesNextFrame();
      else if (e.deltaY < 0) this.props.listOpenFilesPreviousFrame();
    }
  };

  onOpenUrl = (e) => {
    const eventData = e.detail;
    this.setState({ progress: eventData.percentComplete });
  };

  showOpenUrlDlg = (url) => {
    this.setState({ visibleOpenUrlDlg: true }, () => {
      cornerstone.events.addEventListener(
        "cornerstoneimageloadprogress",
        this.onOpenUrl
      );
      this.loadImage(undefined, url);
    });
  };

  hideOpenUrlDlg = () => {
    this.setState({ visibleOpenUrlDlg: false, progress: null });
  };

  measurementSave = (measure) => {
    this.measurements.push(measure);
  };

  measurementClear = () => {
    this.measurements.splice(0, this.measurements.length);
  };

  measurementRemove = (index) => {
    //console.log('this.measurements: ', this.measurements)
    this.measurements.splice(index, 1);
  };

  getTransferSyntax = () => {
    const value = this.image.data.string("x00020010");
    return value + " [" + uids[value] + "]";
  };

  getSopClass = () => {
    const value = this.image.data.string("x00080016");
    return value + " [" + uids[value] + "]";
  };


  getSopInstanceUID = () => {
    const value = this.image.data.string("x00080018");
    return value;
  };

  getPixelRepresentation = () => {
    const value = this.image.data.uint16("x00280103");
    if (value === undefined) return;
    return value + (value === 0 ? " (unsigned)" : " (signed)");
  };

  getPlanarConfiguration = () => {
    const value = this.image.data.uint16("x00280006");
    if (value === undefined) return;
    return value + (value === 0 ? " (pixel)" : " (plane)");
  };

  getDicomViewerElement = () => {
    return document.getElementsByClassName("cornerstone-enabled-image");
  };

  onImageLoaded = (e) => {
    //console.log('cornerstoneimageloaded: ')
    this.props.onLoadedImage();
  };

  // Listen for changes to the viewport so we can update the text overlays in the corner
  onImageRendered = (e) => {
    //console.log('cornerstoneimagerendered: ', e.target)

    //const viewport = cornerstone.getViewport(this.dicomImage)
    const viewport = cornerstone.getViewport(e.target);
    this.zoom = Math.round(viewport.scale.toFixed(2) * 100);

    document.getElementById(`mrtopleft-${this.props.index}`).textContent =
      this.mprIsOrthogonalView()
        ? `${capitalize(this.mprPlane)}`
        : `${this.PatientsName}`;

    // document.getElementById(
    //   `mrtopright-${this.props.index}`
    // ).textContent = `${viewport?.displayedArea?.brhc?.x}x${viewport?.displayedArea?.brhc?.y}`;

    document.getElementById(
      `mrbottomleft-${this.props.index}`
    ).textContent = `WW/WC: ${Math.round(
      viewport.voi.windowWidth
    )}/${Math.round(viewport.voi.windowCenter)}`;

    document.getElementById(
      `mrbottomright-${this.props.index}`
    ).textContent = `Zoom: ${this.zoom}%`;

    document.getElementById(`mrtopcenter-${this.props.index}`).textContent = ``;
    document.getElementById(
      `mrbottomcenter-${this.props.index}`
    ).textContent = ``;
    document.getElementById(
      `mrleftcenter-${this.props.index}`
    ).textContent = ``;
    document.getElementById(
      `mrrightcenter-${this.props.index}`
    ).textContent = ``;

    if (this.mprPlane === "sagittal") {
      document.getElementById(
        `mrtopcenter-${this.props.index}`
      ).textContent = `S`;
      document.getElementById(
        `mrbottomcenter-${this.props.index}`
      ).textContent = `I`;
      document.getElementById(
        `mrleftcenter-${this.props.index}`
      ).textContent = `A`;
      document.getElementById(
        `mrrightcenter-${this.props.index}`
      ).textContent = `P`;
    } else if (this.mprPlane === "axial") {
      document.getElementById(
        `mrtopcenter-${this.props.index}`
      ).textContent = `A`;
      document.getElementById(
        `mrbottomcenter-${this.props.index}`
      ).textContent = `P`;
      document.getElementById(
        `mrleftcenter-${this.props.index}`
      ).textContent = `R`;
      document.getElementById(
        `mrrightcenter-${this.props.index}`
      ).textContent = `L`;
    } else if (this.mprPlane === "coronal") {
      document.getElementById(
        `mrtopcenter-${this.props.index}`
      ).textContent = `S`;
      document.getElementById(
        `mrbottomcenter-${this.props.index}`
      ).textContent = `I`;
      document.getElementById(
        `mrleftcenter-${this.props.index}`
      ).textContent = `R`;
      document.getElementById(
        `mrrightcenter-${this.props.index}`
      ).textContent = `L`;
    }

    if (this.referenceLines.isScoutDraw) {
      this.referenceLines.isScoutDraw = false;
      this.referenceLinesDraw();
    }

    if (this.mpr.isSliceLocation) {
      this.mpr.isSliceLocation = false;
      this.mprSliceLocationDraw();
    }

    if (
      this.isDicom &&
      this.state.visibleCinePlayer &&
      this.numberOfFrames > 1
    ) {
      document.getElementById(
        `frameLabel-${this.props.index}`
      ).textContent = `${this.state.frame} / ${this.numberOfFrames}`;
      if (this.state.inPlay) {
        let frame =
          this.state.frame === this.numberOfFrames ? 1 : this.state.frame + 1;
        this.setState({ frame: frame });
      }
    }

    this.props.onRenderedImage(this.props.index);
  };

  onMeasurementModified = (e) => {
    //console.log('cornerstonetoolsmeasurementmodified: ', e.detail.measurementData)
  };

  onMeasurementAdded = (e) => {
    //console.log('cornerstonetoolsmeasurementadded: ', e.detail.measurementData)
    if (this.props.tool !== "Angle") return;
    const measure = {
      tool: this.props.tool,
      note: "",
      data: e.detail.measurementData,
      sliceIndex: this.sliceIndex
    };
    this.measurementSave(measure);
    this.props.setActiveMeasurements(this.measurements);
  };

  onMeasurementCompleted = (e) => {
    //console.log('cornerstonetoolsmeasurementcompleted: ', e.detail.measurementData)
    const measure = {
      tool: this.props.tool,
      note: "",
      data: e.detail.measurementData,
      sliceIndex: this.sliceIndex
    };
    if (this.props.tool === "FreehandRoi") {
      setTimeout(() => {
        this.measurementSave(measure);
        this.props.setActiveMeasurements(this.measurements);
      }, 500);
    } else {
      this.measurementSave(measure);
      this.props.setActiveMeasurements(this.measurements);
    }
  };

  onErrorOpenImageClose = () => {
    this.setState({ errorOnOpenImage: null });
  };

  onErrorCorsClose = () => {
    this.setState({ errorOnCors: false });
  };

  updateImage = () => {
    const element = this.dicomImage;
    cornerstone.updateImage(element);
  };

  displayImageFromFiles = (index) => {
    //console.log('displayImageFromFiles: ', index)

    const files = this.files === null ? this.props.files : this.files;

    const image = files[index].image;
    const imageId = files[index].imageId;
    this.filename = files[index].name;
    this.sliceIndex = index;

    const element = this.dicomImage;
    element.addEventListener("cornerstonenewimage", this.onNewImage);
    element.addEventListener("cornerstoneimagerendered", this.onImageRendered);
    element.addEventListener(
      "cornerstonetoolsmeasurementadded",
      this.onMeasurementAdded
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementmodified",
      this.onMeasurementModified
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementcompleted",
      this.onMeasurementCompleted
    );
    cornerstone.enable(element);

    this.image = image;

    this.isDicom = true;

    this.PatientsName = image.data.string("x00100010");
    this.sopInstanceUid = this.getSopInstanceUID();

    let stack = { currentImageIdIndex: 0, imageIds: "" };
    this.numberOfFrames = image.data.intString("x00280008");
    if (this.numberOfFrames > 0) {
      let imageIds = [];
      for (var i = 0; i < this.numberOfFrames; ++i) {
        imageIds.push(imageId + "?frame=" + i);
      }
      stack.imageIds = imageIds;
    }

    cornerstone.displayImage(element, image);

    this.mprPlanePosition();

    this.enableTool();

    if (this.numberOfFrames > 1) {
      cornerstoneTools.addStackStateManager(element, ["stack", "playClip"]);
      cornerstoneTools.addToolState(element, "stack", stack);
      this.setState({ frame: 1 });
    }

    // Load the possible measurements from DB and save in the store
    db.measurement
      .where("sopinstanceuid")
      .equals(this.sopInstanceUid)
      .each((measure) => {
        //console.log('load measure from db: ', measure)
        this.measurementSave(measure);
        cornerstoneTools.addToolState(element, measure.tool, measure.data);
        this.runTool(measure.tool);
        cornerstone.updateImage(element);
        cornerstoneTools.setToolEnabled(measure.tool);
      })
      .then(() => {
        //if (this.useIsNormal) {
        this.props.setActiveMeasurements(this.measurements);
        this.props.setActiveDcm(this); // {image: this.image, element: this.dicomImage, isDicom: this.isDicom}
        this.props.setIsOpenStore({ index: this.props.index, value: true });
        //}
      });
  };

  loadImageFromCanvas = (canvas) => {
    //console.log('loadImageFromCanvas, dcmViewer: ', this.props.index)

    const element = this.dicomImage;
    element.addEventListener("cornerstonenewimage", this.onNewImage);
    element.addEventListener("cornerstoneimagerendered", this.onImageRendered);
    element.addEventListener(
      "cornerstonetoolsmeasurementadded",
      this.onMeasurementAdded
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementmodified",
      this.onMeasurementModified
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementcompleted",
      this.onMeasurementCompleted
    );
    cornerstone.enable(element);

    const imageId = cornerstoneFileImageLoader.fileManager.addCanvas(canvas);

    cornerstone.loadImage(imageId).then(
      (image) => {
        this.image = image;

        this.isDicom = false;

        cornerstone.displayImage(element, image);

        this.enableTool();

        this.props.setIsOpenStore({ index: this.props.index, value: true });
      },
      (e) => {
        console.log("error", e);
        this.setState({ errorOnOpenImage: "This is not a valid canvas." });
      }
    );
  };

  loadImageFromCustomObject = (columns, rows, pixelData) => {
    //console.log('loadImageFromCustomObject: ')

    const element = this.dicomImage;
    element.addEventListener("cornerstonenewimage", this.onNewImage);
    element.addEventListener("cornerstoneimagerendered", this.onImageRendered);
    element.addEventListener(
      "cornerstonetoolsmeasurementadded",
      this.onMeasurementAdded
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementmodified",
      this.onMeasurementModified
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementcompleted",
      this.onMeasurementCompleted
    );
    cornerstone.enable(element);

    let customObj = {
      rows: rows,
      columns: columns,
      pixelData: pixelData,
      image: this.originImage,
    };

    const imageId = cornerstoneFileImageLoader.fileManager.addCustom(customObj);

    cornerstone.loadImage(imageId).then(
      (image) => {
        //console.log('loadImageFromCustomObject, image: ', image)
        this.image = image;
        this.isDicom = true;

        cornerstone.displayImage(element, image);

        //this.enableTool()

        this.props.setIsOpenStore({ index: this.props.index, value: true });
      },
      (e) => {
        console.log("error", e);
        this.setState({ errorOnOpenImage: "This is not a valid canvas." });
      }
    );
  };

  loadImage = (localfile, url = undefined, fsItem = undefined) => {
    //console.log('loadImage, localfile: ', localfile)
    //console.log('loadImage, fsItem: ', fsItem)
    //console.log('loadImage, url: ', url)

    if (localfile === undefined && url === undefined && fsItem === undefined)
      return;

    if (fsItem !== undefined) {
      this.fsItem = fsItem;
    } else if (localfile !== undefined) {
      this.localfile = localfile;
    } else {
      this.localurl = url;
    }

    const element = this.dicomImage;

    element.addEventListener("cornerstonenewimage", this.onNewImage);
    element.addEventListener("cornerstoneimagerendered", this.onImageRendered);
    element.addEventListener(
      "cornerstonetoolsmeasurementadded",
      this.onMeasurementAdded
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementmodified",
      this.onMeasurementModified
    );
    element.addEventListener(
      "cornerstonetoolsmeasurementcompleted",
      this.onMeasurementCompleted
    );

    let imageId = undefined;

    cornerstone.enable(element);

    if (localfile === undefined && isUrlImage(url)) {
      // check if it's a simple image [jpeg or png] from url
      //console.log('image: ', file)
      cornerstone.loadImage(url).then(
        (image) => {
          //console.log('loadImage, image from url: ', image)

          this.hideOpenUrlDlg();

          this.image = image;

          this.isDicom = false;

          cornerstone.displayImage(element, image);

          this.enableTool();

          this.props.setActiveDcm(this); // {image: this.image, element: this.dicomImage, isDicom: this.isDicom}
          this.props.isOpenStore(true);
        },
        (e) => {
          console.log("error", e);
          this.setState({
            errorOnOpenImage: "This is not a valid JPG or PNG file.",
          });
        }
      );
    } else if (
      (localfile !== undefined && isFileImage(localfile)) ||
      (fsItem !== undefined && isFsFileImage(fsItem))
    ) {
      // otherwise try to open as local image file (JPEG, PNG)
      if (fsItem !== undefined) {
        imageId = cornerstoneFileImageLoader.fileManager.addBuffer(fsItem.data);
      } else {
        imageId = cornerstoneFileImageLoader.fileManager.add(localfile);
      }
      cornerstone.loadImage(imageId).then(
        (image) => {
          console.log("loadImage, image from local: ", image);

          this.image = image;
          this.isDicom = false;
          this.PatientsName = "";

          cornerstone.displayImage(element, image);

          this.enableTool();

          this.props.setActiveDcm(this); // {image: this.image, element: this.dicomImage, isDicom: this.isDicom}
          //this.props.isOpenStore(true)
          this.props.setIsOpenStore({ index: this.props.index, value: true });
        },
        (e) => {
          console.log("error", e);
          this.setState({
            errorOnOpenImage: "This is not a valid JPG or PNG file.",
          });
        }
      );
    } else {
      // otherwise try to open as Dicom file
      //let size = 0
      if (fsItem !== undefined) {
        imageId = cornerstoneWADOImageLoader.wadouri.fileManager.addBuffer(
          fsItem.data
        );
        this.filename = fsItem.name;
        //size = fsItem.size
      } else if (localfile !== undefined) {
        imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(localfile);
        this.filename = localfile.name;
        //size = localfile.size
      } else {
        // it's a web dicom image
        imageId = "wadouri:" + url;
      }

      //console.log('loadImage, imageId: ', imageId)

      cornerstone.loadAndCacheImage(imageId).then(
        (image) => {
          //console.log('loadImage, image: ', image)
          //let pixelDataElement = image.data.elements.x7fe00010
          //console.log('loadImage, pixelDataElement: ', pixelDataElement)
          //console.log('loadImage, getPixelData: ', image.getPixelData())

          this.hideOpenUrlDlg();

          this.image = image;

          this.isDicom = true;

          this.PatientsName = image.data.string("x00100010");
          this.sopInstanceUid = this.getSopInstanceUID();

          let stack = { currentImageIdIndex: 0, imageIds: "" };
          this.numberOfFrames = image.data.intString("x00280008");
          if (this.numberOfFrames > 0) {
            let imageIds = [];
            for (var i = 0; i < this.numberOfFrames; ++i) {
              imageIds.push(imageId + "?frame=" + i);
            }
            stack.imageIds = imageIds;
          }

          cornerstone.displayImage(element, image);
          //cornerstoneTools.mouseInput.enable(element);
          //cornerstoneTools.mouseWheelInput.enable(element);

          this.enableTool();

          if (this.numberOfFrames > 1) {
            cornerstoneTools.addStackStateManager(element, [
              "stack",
              "playClip",
            ]);
            cornerstoneTools.addToolState(element, "stack", stack);
            //cornerstoneTools.setToolActive('StackScrollMouseWheel', { })
            this.setState({ frame: 1 });
          }

          // Load the possible measurements from DB and save in the store
          db.measurement
            .where("sopinstanceuid")
            .equals(this.sopInstanceUid)
            .each((measure) => {
              //console.log('load measure from db: ', measure)
              //this.props.measurementStore(measure)
              this.measurementSave(measure);
              cornerstoneTools.addToolState(
                element,
                measure.tool,
                measure.data
              );
              this.runTool(measure.tool);
              cornerstone.updateImage(element);
              cornerstoneTools.setToolEnabled(measure.tool);
            })
            .then(() => {
              //console.log('this.measurements: ', this.measurements)
              this.props.setActiveMeasurements(this.measurements);
              this.props.setActiveDcm(this); // {name: this.filename, size: size, image: this.image, element: this.dicomImage, isDicom: this.isDicom}
              this.props.setIsOpenStore({
                index: this.props.index,
                value: true,
              });
            });
        },
        (e) => {
          console.log("error", e);
          this.hideOpenUrlDlg();
          //console.log('toString: ', e.error.toString())
          const error = e.error.toString();
          if (error === "[object XMLHttpRequest]") {
            this.setState({ errorOnCors: true });
          } else {
            const pos = error.indexOf(":");
            this.setState({
              errorOnOpenImage: pos < 0 ? e.error : error.substring(pos + 1),
            });
          }
        }
      );
    }
  };

  enableTool = (toolName, mouseButtonNumber) => {
    if (this.props.dcmEnableTool) return;
    // Enable all tools we want to use with this element
    const WwwcTool = cornerstoneTools.WwwcTool;
    const LengthTool = cornerstoneTools["LengthTool"];
    const PanTool = cornerstoneTools.PanTool;
    const ZoomTouchPinchTool = cornerstoneTools.ZoomTouchPinchTool;
    const ZoomTool = cornerstoneTools.ZoomTool;
    const ProbeTool = cornerstoneTools.ProbeTool;
    const EllipticalRoiTool = cornerstoneTools.EllipticalRoiTool;
    const RectangleRoiTool = cornerstoneTools.RectangleRoiTool;
    const FreehandRoiTool = cornerstoneTools.FreehandRoiTool;
    const AngleTool = cornerstoneTools.AngleTool;
    const MagnifyTool = cornerstoneTools.MagnifyTool;
    const StackScrollMouseWheelTool =
      cornerstoneTools.StackScrollMouseWheelTool;

    cornerstoneTools.addTool(MagnifyTool);
    cornerstoneTools.addTool(AngleTool);
    cornerstoneTools.addTool(WwwcTool);
    cornerstoneTools.addTool(LengthTool);
    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.addTool(ZoomTouchPinchTool);
    cornerstoneTools.addTool(ZoomTool);
    cornerstoneTools.addTool(ProbeTool);
    cornerstoneTools.addTool(EllipticalRoiTool);
    cornerstoneTools.addTool(RectangleRoiTool);
    cornerstoneTools.addTool(FreehandRoiTool);
    cornerstoneTools.addTool(StackScrollMouseWheelTool);

    this.props.setDcmEnableToolStore(true);
  };

  // helper function used by the tool button handlers to disable the active tool
  // before making a new tool active
  disableAllTools = () => {
    this.props.setDcmEnableToolStore(false);
    cornerstoneTools.setToolEnabled("Length");
    cornerstoneTools.setToolEnabled("Pan");
    cornerstoneTools.setToolEnabled("Magnify");
    cornerstoneTools.setToolEnabled("Angle");
    cornerstoneTools.setToolEnabled("RectangleRoi");
    cornerstoneTools.setToolEnabled("Wwwc");
    cornerstoneTools.setToolEnabled("ZoomTouchPinch");
    cornerstoneTools.setToolEnabled("Probe");
    cornerstoneTools.setToolEnabled("EllipticalRoi");
    cornerstoneTools.setToolEnabled("FreehandRoi");
    cornerstoneTools.setToolEnabled("StackScrollMouseWheel");
  };

  runTool = (toolName, opt) => {
    //console.log(`runTool: ${toolName}, ${opt}`)
    if (this.state.inPlay) {
      this.runCinePlayer("pause");
    }
    switch (toolName) {
      case "setfiles": {
        this.files = opt;
        this.sliceMax = this.files.length;
        this.shouldScroll = this.files.length > 1;
        break;
      }
      case "openimage": {
        cornerstone.disable(this.dicomImage);
        this.displayImageFromFiles(opt);
        break;
      }
      case "openLocalFs": {
        cornerstone.disable(this.dicomImage);
        this.loadImage(opt);
        break;
      }
      case "openSandboxFs": {
        cornerstone.disable(this.dicomImage);
        this.loadImage(undefined, undefined, opt);
        break;
      }
      case "openurl": {
        this.showOpenUrlDlg(opt);
        break;
      }
      case "clear": {
        this.setState({ visibleCinePlayer: false });
        this.mprPlane = "";
        this.files = null;
        this.props.setIsOpenStore({ index: this.props.index, value: false });
        cornerstone.disable(this.dicomImage);
        break;
      }
      case "notool": {
        this.disableAllTools();
        break;
      }
      case "Wwwc": {
        cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 });
        break;
      }
      case "Pan": {
        cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
        break;
      }
      case "Zoom": {
        cornerstoneTools.setToolActive(isMobile ? "ZoomTouchPinch" : "Zoom", {
          mouseButtonMask: 1,
        });
        break;
      }
      case "Length": {
        cornerstoneTools.setToolActive(
          "Length",
          isMobile ? { isTouchActive: true } : { mouseButtonMask: 1 }
        );
        break;
      }
      case "Probe": {
        cornerstoneTools.setToolActive("Probe", { mouseButtonMask: 1 });
        break;
      }
      case "EllipticalRoi": {
        cornerstoneTools.setToolActive("EllipticalRoi", { mouseButtonMask: 1 });
        break;
      }
      case "RectangleRoi": {
        cornerstoneTools.setToolActive("RectangleRoi", { mouseButtonMask: 1 });
        break;
      }
      case "Angle": {
        cornerstoneTools.setToolActive("Angle", { mouseButtonMask: 1 });
        break;
      }
      case "Magnify": {
        cornerstoneTools.setToolActive("Magnify", { mouseButtonMask: 1 });
        break;
      }
      case "FreehandRoi": {
        cornerstoneTools.setToolActive("FreehandRoi", { mouseButtonMask: 1 });
        break;
      }
      case "Invert": {
        const element = this.dicomImage;
        const viewport = cornerstone.getViewport(element);
        viewport.invert = !viewport.invert;
        cornerstone.setViewport(element, viewport);
        break;
      }
      case "saveas": {
        let type = localStorage.getItem(SETTINGS_SAVEAS);
        if (getSettingsSaveInto() === "local") {
          // cornerstoneTools.SaveAs(this.dicomImage, `${this.filename}.${type}`, `image/${type}`)
          const element = this.dicomImage;
          const viewport = cornerstone.getViewport(element);
          const canvas =
            document.getElementsByClassName("cornerstone-canvas")[
              this.props.activeDcmIndex
            ];
          const zoom = viewport.scale.toFixed(2);
          const cols = this.image.columns * zoom;
          const rows = this.image.rows * zoom;

          let myCanvas = document.createElement("canvas");
          myCanvas = this.cropCanvas(
            canvas,
            Math.round(canvas.width / 2 - cols / 2),
            Math.round(canvas.height / 2 - rows / 2),
            cols,
            rows
          );

          let a = document.createElement("a");
          a.href = myCanvas.toDataURL(`image/${type}`);
          a.download = `${this.filename}.${type}`;
          document.body.appendChild(a); // Required for this to work in FireFox
          a.click();
        } else {
          // store image into sandbox file system
          const element = this.dicomImage;
          const viewport = cornerstone.getViewport(element);
          const canvas =
            document.getElementsByClassName("cornerstone-canvas")[
              this.props.activeDcmIndex
            ];
          const zoom = viewport.scale.toFixed(2);
          const cols = this.image.columns * zoom;
          const rows = this.image.rows * zoom;

          let myCanvas = document.createElement("canvas");
          myCanvas = this.cropCanvas(
            canvas,
            Math.round(canvas.width / 2 - cols / 2),
            Math.round(canvas.height / 2 - rows / 2),
            cols,
            rows
          );

          blobUtil.canvasToBlob(myCanvas, `image/${type}`).then((blob) => {
            blobUtil.blobToArrayBuffer(blob).then((arrayBuffer) => {
              const name = `${getFileName(this.filename)}-MPR-${this.mprPlane}`;
              let newName = name;
              let counter = 1;
              let done = false;
              do {
                let filename = `${newName}.${type}`;
                const checkName = this.props.fsCurrentList.find(
                  (e) => e.name === filename
                );
                if (checkName === undefined) {
                  fs.transaction("rw", fs.files, async () => {
                    await fs.files.add({
                      parent: this.props.fsCurrentDir,
                      name: filename,
                      type: type,
                      size: arrayBuffer.byteLength,
                      data: arrayBuffer,
                    });
                  }).then(() => {
                    this.props.makeFsRefresh();
                  });
                  done = true;
                } else {
                  newName = `${name} - ${counter}`;
                  counter++;
                }
              } while (!done);
            });
          });
        }
        break;
      }
      case "cine": {
        this.setState({ visibleCinePlayer: !this.state.visibleCinePlayer });
        break;
      }
      case "reset": {
        this.reset();
        break;
      }
      case "removetool": {
        //console.log('removetool index: ', opt)
        const element = this.dicomImage;
        cornerstoneTools.removeToolState(
          element,
          this.measurements[opt].tool,
          this.measurements[opt].data
        );
        cornerstone.updateImage(element);
        //this.props.measurementRemoveStore(opt)
        this.measurementRemove(opt);
        this.props.setActiveMeasurements(this.measurements);
        break;
      }
      case "removetools": {
        const element = this.dicomImage;
        // for each measurement remove it
        this.measurements.forEach((measure) => {
          cornerstoneTools.clearToolState(element, measure.tool);
        });
        cornerstone.updateImage(element);
        this.measurementClear();
        // also remove all measurements from db
        db.measurement
          .where("sopinstanceuid")
          .equals(this.sopInstanceUid)
          .delete();
        this.props.setActiveMeasurements(this.measurements);
        break;
      }
      case "savetools": {
        // first, remove eventually previous measurements from db
        db.measurement
          .where("sopinstanceuid")
          .equals(this.sopInstanceUid)
          .delete();
        // then save all the current measurements
        this.measurements.forEach((measure) => {
          try {
            db.measurement.add({
              sopinstanceuid: this.sopInstanceUid,
              tool: measure.tool,
              note: measure.note,
              data: measure.data,
            });
          } catch (error) {
            console.error(error);
          }
        });
        break;
      }
      default: {
        break;
      }
    }
  };

  cropCanvas = (canvas, x, y, width, height) => {
    // create a temp canvas
    const newCanvas = document.createElement("canvas");
    // set its dimensions
    newCanvas.width = width;
    newCanvas.height = height;
    // draw the canvas in the new resized temp canvas
    newCanvas
      .getContext("2d")
      .drawImage(canvas, x, y, width, height, 0, 0, width, height);
    return newCanvas;
  };



  changeTool = (toolName, value) => {
    //console.log('change tool, value: ', toolName, value)

    switch (toolName) {
      case "Wwwc":
        if (value === 1) {
          cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("Wwwc");
        }
        break;
      case "Pan":
        if (value === 1) {
          cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("Pan");
        }
        break;
      case "Zoom":
        if (value === 1) {
          cornerstoneTools.setToolActive(isMobile ? "ZoomTouchPinch" : "Zoom", {
            mouseButtonMask: 1,
          });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive(isMobile ? "ZoomTouchPinch" : "Zoom");
        }
        break;
      case "Length":
        if (value === 1) {
          cornerstoneTools.setToolActive(
            "Length",
            isMobile ? { isTouchActive: true } : { mouseButtonMask: 1 }
          );
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("Length");
        }
        break;
      case "Probe":
        if (value === 1) {
          cornerstoneTools.setToolActive("Probe", { mouseButtonMask: 1 });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("Probe");
        }
        break;
      case "Angle":
        if (value === 1) {
          cornerstoneTools.setToolActive("Angle", { mouseButtonMask: 1 });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("Angle");
        }
        break;
      case "Magnify":
        if (value === 1) {
          cornerstoneTools.setToolActive("Magnify", { mouseButtonMask: 1 });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("Magnify");
        }
        break;
      case "EllipticalRoi":
        if (value === 1) {
          cornerstoneTools.setToolActive("EllipticalRoi", {
            mouseButtonMask: 1,
          });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("EllipticalRoi");
        }
        break;
      case "RectangleRoi":
        if (value === 1) {
          cornerstoneTools.setToolActive("RectangleRoi", {
            mouseButtonMask: 1,
          });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("RectangleRoi");
        }
        break;
      case "FreehandRoi":
        if (value === 1) {
          cornerstoneTools.setToolActive("FreehandRoi", { mouseButtonMask: 1 });
        } else if (value === 0) {
          cornerstoneTools.setToolPassive("FreehandRoi");
        }
        break;
      default:
        break;
    }
  };

  runCinePlayer = (cmdName) => {
    //console.log('this.state.frame: ', this.state.frame)
    const element = this.dicomImage;
    switch (cmdName) {
      case "firstframe": {
        let frame = 1;
        this.setState({ frame: frame });
        scrollToIndex(element, 0);
        break;
      }
      case "previousframe": {
        if (this.state.frame > 1) {
          let frame = this.state.frame - 1;
          this.setState({ frame: frame });
          scrollToIndex(element, frame - 1);
        }
        break;
      }
      case "play": {
        cornerstoneTools.playClip(element, 30);
        this.setState({ inPlay: true });
        break;
      }
      case "pause": {
        cornerstoneTools.stopClip(element);
        this.setState({ inPlay: false });
        break;
      }
      case "nextframe": {
        if (this.state.frame < this.numberOfFrames) {
          let frame = this.state.frame + 1;
          this.setState({ frame: frame });
          scrollToIndex(element, frame - 1);
        }
        break;
      }
      case "lastframe": {
        let frame = this.numberOfFrames;
        this.setState({ frame: frame });
        scrollToIndex(element, frame - 1);
        break;
      }
      default:
        break;
    }
  };

  reset = () => {
    const element = this.dicomImage;
    const defaultViewport = cornerstone.getDefaultViewportForImage(
      element,
      this.image
    );
    let viewport = cornerstone.getViewport(element);
    viewport.voi.windowWidth = defaultViewport.voi.windowWidth;
    viewport.voi.windowCenter = defaultViewport.voi.windowCenter;
    viewport.invert = false;
    cornerstone.setViewport(element, viewport);
  };

  // -------------------------------------------------------------------------------------------- MPR
  //#region MPR

  mprPlanePosition = () => {
    try {
      if (!this.isDicom) return this.mprPlane;
      const image = this.files[0].image;
      const imageOrientation = image.data.string("x00200037").split("\\");
      let v = new Array(6).fill(0);
      v[0] = parseFloat(imageOrientation[0]); // the x direction cosines of the first row X
      v[1] = parseFloat(imageOrientation[1]); // the y direction cosines of the first row X
      v[2] = parseFloat(imageOrientation[2]); // the z direction cosines of the first row X
      v[3] = parseFloat(imageOrientation[3]); // the x direction cosines of the first column Y
      v[4] = parseFloat(imageOrientation[4]); // the y direction cosines of the first column Y
      v[5] = parseFloat(imageOrientation[5]); // the z direction cosines of the first column Y
      v = v.map((x) => Math.round(x));
      let p = [
        v[1] * v[5] - v[2] * v[4],
        v[2] * v[3] - v[0] * v[5],
        v[0] * v[4] - v[1] * v[3],
      ]; // cross product of X x Y
      p = p.map((x) => Math.abs(x));
      if (p[0] === 1) {
        this.mprPlane = "sagittal";
      } else if (p[1] === 1) {
        this.mprPlane = "coronal";
      } else if (p[2] === 1) {
        this.mprPlane = "axial";
      }
    } catch (error) {
      // it's not possible to build MPR
      this.mprPlane = "";
    }
    return this.mprPlane;
  };

  transpose = (matrix) => {
    return Object.keys(matrix[0]).map((colNumber) =>
      matrix.map((rowNumber) => rowNumber[colNumber])
    );
  };

  mprRenderYZPlane = (filename, origin, x, mprData) => {
    if (this.volume === null) return;

    //console.log('mprRenderYZPlane, mprData: ', mprData)

    this.mprData = mprData;

    const files = this.files === null ? this.props.files : this.files;

    this.sliceIndex = x;

    this.filename = filename;
    cornerstone.disable(this.dicomImage);

    if (origin === "sagittal") this.mprPlane = "coronal";
    else if (origin === "axial") this.mprPlane = "sagittal";
    else this.mprPlane = "sagittal";

    this.xSize = files[0].columns;
    this.ySize = files[0].rows;
    this.zSize = mprData.zDim;

    const i = Math.round((x / this.xSize) * files.length);
    this.originImage = files[i].image;

    if (origin === "sagittal") {
      let xoffset = Math.floor(this.xSize / 2) - Math.floor(this.zSize / 2);
      let plane = new Int16Array(this.xSize * this.ySize);
      for (let y = 0; y < this.ySize; y++)
        for (let z = 0; z < this.zSize; z++)
          plane[z + this.ySize * y + xoffset] =
            this.volume[z][x + this.ySize * y];
      this.loadImageFromCustomObject(this.xSize, this.ySize, plane);
    } else if (origin === "coronal") {
      let xoffset = Math.floor(this.xSize / 2) - Math.floor(this.zSize / 2);
      let plane = new Int16Array(this.xSize * this.ySize);
      for (let y = 0; y < this.ySize; y++)
        for (let z = 0; z < this.zSize; z++)
          plane[z + this.ySize * y + xoffset] =
            this.volume[z][x + this.ySize * y];
      this.loadImageFromCustomObject(this.xSize, this.ySize, plane);
    } else {
      // axial
      const yzPlane = this.mprBuildYZPlane(x);
      this.loadImageFromCustomObject(this.ySize, this.zSize, yzPlane);
    }
  };

  mprBuildYZPlane = (x) => {
    //console.log(`mprBuildYZPlane, ySize: ${this.ySize}, zSize: ${this.zSize} `)
    let plane = new Int16Array(this.ySize * this.zSize);
    for (var y = 0; y < this.ySize; y++)
      for (var z = 0; z < this.zSize; z++)
        plane[y + this.ySize * z] = this.volume[z][x + this.ySize * y];
    return plane;
  };

  mprRenderXZPlane = (filename, origin, y, mprData) => {
    if (this.volume === null) return;

    this.mprData = mprData;

    //console.log('mprRenderXZPlane, mprData: ', mprData)

    const files = this.files === null ? this.props.files : this.files;

    this.sliceIndex = y;

    this.filename = filename;
    cornerstone.disable(this.dicomImage);

    if (origin === "sagittal") this.mprPlane = "axial";
    else if (origin === "axial") this.mprPlane = "coronal";
    else this.mprPlane = "axial";

    this.xSize = files[0].columns;
    this.ySize = files[0].rows;
    this.zSize = mprData.zDim;

    const i = Math.trunc((y / this.ySize) * files.length);
    this.originImage = files[i].image;

    if (origin === "sagittal") {
      let xoffset = Math.floor(this.xSize / 2) - Math.floor(this.zSize / 2);
      let plane = new Int16Array(this.xSize * this.ySize);
      for (let x = 0; x < this.xSize; x++)
        for (let z = 0; z < this.zSize; z++)
          plane[z + this.xSize * x + xoffset] =
            this.volume[z][x + this.xSize * y];
      this.loadImageFromCustomObject(this.xSize, this.ySize, plane);
    } else {
      const xzPlane = this.mprBuildXZPlane(y);
      this.loadImageFromCustomObject(this.xSize, this.zSize, xzPlane);
    }
  };

  mprBuildXZPlane = (y) => {
    let plane = new Int16Array(this.xSize * this.zSize);
    for (let x = 0; x < this.xSize; x++)
      for (let z = 0; z < this.zSize; z++)
        plane[x + this.xSize * z] = this.volume[z][x + this.xSize * y];
    return plane;
  };

  mprIsOrthogonalView = () => {
    return (
      this.mprPlane !== "" &&
      this.props.layout[0] === 1 &&
      this.props.layout[1] === 3
    );
  };

  mprReferenceLines = (index) => {
    const fromPlane = this.props.activeDcm.mprPlane;
    const toPlane = this.mprPlane;
    const border = 3;
    const offset =
      this.mprData.instanceNumberOrder === 1
        ? index * this.mprData.zStep
        : (this.mprData.indexMax - index) * this.mprData.zStep;

    this.mpr.sliceLocation = {};
    if (fromPlane === "axial") {
      this.mpr.sliceLocation.p0 = new Point(border, offset);
      this.mpr.sliceLocation.p1 = new Point(this.xSize - border, offset);
    } else if (fromPlane === "sagittal") {
      const start = Math.round((this.xSize - this.zSize) / 2);
      this.mpr.sliceLocation.p0 = new Point(start + offset, border);
      this.mpr.sliceLocation.p1 = new Point(
        start + offset,
        this.ySize - border
      );
    } else {
      // from coronal
      if (toPlane === "axial") {
        this.mpr.sliceLocation.p0 = new Point(border, offset);
        this.mpr.sliceLocation.p1 = new Point(this.xSize - border, offset);
      } else {
        // to sagittal
        const start = Math.round((this.xSize - this.zSize) / 2);
        this.mpr.sliceLocation.p0 = new Point(start + offset, border);
        this.mpr.sliceLocation.p1 = new Point(
          start + offset,
          this.ySize - border
        );
      }
    }
    this.mpr.isSliceLocation = true;
    this.updateImage();
  };

  mprReferenceLines2 = (index) => {
    // from second view to third view or from third view to second view
    const fromPlane = this.props.activeDcm.mprPlane;
    const toPlane = this.mprPlane;
    const border = 3;
    const offset = this.mprData.instanceNumberOrder === 1 ? index : index;

    this.mpr.sliceLocation = {};
    if (fromPlane === "axial") {
      this.mpr.sliceLocation.p0 = new Point(border, offset);
      this.mpr.sliceLocation.p1 = new Point(this.xSize - border, offset);
    } else if (fromPlane === "sagittal") {
      this.mpr.sliceLocation.p0 = new Point(offset, border);
      this.mpr.sliceLocation.p1 = new Point(offset, this.zSize - border);
    } else {
      // from coronal
      if (toPlane === "axial") {
        this.mpr.sliceLocation.p0 = new Point(border, offset);
        this.mpr.sliceLocation.p1 = new Point(this.xSize - border, offset);
      } else {
        // to sagittal
        this.mpr.sliceLocation.p0 = new Point(offset, border);
        this.mpr.sliceLocation.p1 = new Point(offset, this.zSize - border);
      }
    }
    this.mpr.isSliceLocation = true;
    this.updateImage();
  };

  mprReferenceLines3 = (index, mprData) => {
    // from second or third view to first view
    const xSize = this.image.columns;
    const ySize = this.image.rows;
    const fromPlane = this.props.activeDcm.mprPlane;
    const toPlane = this.mprPlane;
    const offset = 3;

    this.mpr.sliceLocation = {};
    if (fromPlane === "axial") {
      this.mpr.sliceLocation.p0 = new Point(offset, index);
      this.mpr.sliceLocation.p1 = new Point(xSize - offset, index);
    } else if (fromPlane === "sagittal") {
      this.mpr.sliceLocation.p0 = new Point(index, offset);
      this.mpr.sliceLocation.p1 = new Point(index, ySize - offset);
    } else {
      // from coronal
      if (toPlane === "axial") {
        this.mpr.sliceLocation.p0 = new Point(offset, index);
        this.mpr.sliceLocation.p1 = new Point(xSize - offset, index);
      } else {
        // to sagittal
        this.mpr.sliceLocation.p0 = new Point(index, offset);
        this.mpr.sliceLocation.p1 = new Point(index, ySize - offset);
      }
    }
    this.mpr.isSliceLocation = true;
    this.updateImage();
  };

  mprSliceLocationDraw = () => {
    const canvas = document
      .getElementById(`viewer-${this.props.index}`)
      .getElementsByClassName("cornerstone-canvas")[0];
    const ctx = canvas.getContext("2d");
    const p0 = this.mpr.sliceLocation.p0;
    const p1 = this.mpr.sliceLocation.p1;
    ctx.beginPath();
    ctx.setLineDash([]);
    if (this.zoom < 150) ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 51, 0.7)";
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  //#endregion

  // -------------------------------------------------------------------------------------------- REFERENCE LINES
  //#region REFERENCE LINES

  // see https://stackoverflow.com/questions/10241062/how-to-draw-scout-reference-lines-in-dicom
  //     http://www.dclunie.com/dicom3tools/workinprogress/dcpost.cc
  //
  referenceLinesBuild = (srcImage) => {
    //console.log('referenceLinesBuild - srcImage: ', srcImage)

    this.referenceLines.dst = new DicomGeometry(this.image);
    //console.log('this.referenceLines.dst: ', this.referenceLines.dst)
    this.referenceLines.src = new DicomGeometry(srcImage);
    //console.log('this.referenceLines.src: ', this.referenceLines.src)

    this.referenceLines.isReferenceLine =
      this.referenceLines.dst.orientation !== undefined &&
      this.referenceLines.src.orientation !== undefined &&
      this.referenceLines.dst.orientation !==
        this.referenceLines.src.orientation;

    this.referenceLines.isScoutDraw = true;

    this.updateImage();
  };

  referenceLinesBuildLine = () => {
    const dst = this.referenceLines.dst;
    const src = this.referenceLines.src;

    const nP = dst.nrmDir.dotProduct(dst.topLeft);
    const nA = dst.nrmDir.dotProduct(src.topLeft);
    const nB = dst.nrmDir.dotProduct(src.topRight);
    const nC = dst.nrmDir.dotProduct(src.bottomRight);
    const nD = dst.nrmDir.dotProduct(src.bottomLeft);

    let list = [];

    if (!areEqual(nB, nA)) {
      const t = (nP - nA) / (nB - nA);
      if (t > 0 && t <= 1)
        list.push(src.topLeft.add(src.topRight.sub(src.topLeft).mul(t)));
    }

    if (!areEqual(nC, nB)) {
      const t = (nP - nB) / (nC - nB);
      if (t > 0 && t <= 1)
        list.push(src.topRight.add(src.bottomRight.sub(src.topRight).mul(t)));
    }

    if (!areEqual(nD, nC)) {
      const t = (nP - nC) / (nD - nC);
      if (t > 0 && t <= 1)
        list.push(
          src.bottomRight.add(src.bottomLeft.sub(src.bottomRight).mul(t))
        );
    }

    if (!areEqual(nA, nD)) {
      const t = (nP - nD) / (nA - nD);
      if (t > 0 && t <= 1)
        list.push(src.bottomLeft.add(src.topLeft.sub(src.bottomLeft).mul(t)));
    }

    // the destinationplane should have been crossed exactly two times
    if (list.length !== 2) return;

    // now back from 3D patient space to 2D pixel space
    const p = {
      startPoint: this.transformDstPatientPointToImage(list[0]),
      endPoint: this.transformDstPatientPointToImage(list[1]),
    };
    return p;
  };

  transformDstPatientPointToImage = (p) => {
    const v = new Matrix([p.x], [p.y], [p.z], [1]);
    const transformed = this.referenceLines.dst.transformRcsToImage.multiply(v);
    // validation, if the point is within the image plane, then the z-component of the transformed point should be zero
    const point = new Point(
      Math.round(transformed.get(0, 0)),
      Math.round(transformed.get(1, 0))
    );
    return point;
  };

  referenceLinesBuildPlane = () => {
    const dst = this.referenceLines.dst;
    const src = this.referenceLines.src;

    let pos = [];

    // TLHC is what is in ImagePositionPatient
    pos[0] = src.topLeft;
    // TRHC
    pos[1] = src.topLeft.add(src.rowDir.mul(src.lengthX));
    // BRHC
    pos[2] = src.topLeft.add(
      src.rowDir.mul(src.lengthX).add(src.colDir.mul(src.lengthY))
    );
    // BLHC
    pos[3] = src.topLeft.add(src.colDir.mul(src.lengthY));

    let pixel = [];

    let rotation = new Matrix(
      dst.rowDir.toArray(),
      dst.colDir.toArray(),
      dst.nrmDir.toArray()
    );

    for (let i = 0; i < 4; i++) {
      // move everything to origin of target
      pos[i] = pos[i].add(Point.zero.sub(dst.topLeft));

      // The rotation is easy ... just rotate by the row, col and normal vectors ...
      const m = rotation.multiply(pos[i].toMatrix());
      pos[i] = new Point(
        Math.round(m.get(0, 0)),
        Math.round(m.get(1, 0)),
        Math.round(m.get(2, 0))
      );

      // DICOM coordinates are center of pixel 1\1
      pixel[i] = new Point(
        Math.trunc(pos[i].x / dst.spacingY + 0.5),
        Math.trunc(pos[i].y / dst.spacingX + 0.5)
      );
    }

    //console.log('referenceLinesBuildPlane: ', pixel)
    return pixel;
  };

  referenceLinesDraw = () => {
    if (!this.referenceLines.isReferenceLine) return;

    const canvas = document
      .getElementById(`viewer-${this.props.index}`)
      .getElementsByClassName("cornerstone-canvas")[0];
    const ctxH = canvas.getContext("2d");

    this.referenceLines.plane = this.referenceLinesBuildPlane();

    this.referenceLines.line = this.referenceLinesBuildLine();

    const line = this.referenceLines.line;
    console.log(line);
    ctxH.beginPath();
    ctxH.setLineDash([]);
    ctxH.strokeStyle = "rgba(255, 255, 51, 0.5)";
    ctxH.moveTo(line.startPoint.x, line.startPoint.y);
    ctxH.lineTo(line.endPoint.x, line.endPoint.y);
    ctxH.lineWidth = 1;
    ctxH.stroke();

    const plane = this.referenceLines.plane;

    const d =
      Math.max(this.referenceLines.dst.rows, this.referenceLines.dst.cols) / 30;

    const line0 = new Line(plane[0], plane[1]);
    const line1 = new Line(plane[1], plane[2]);
    const line2 = new Line(plane[2], plane[3]);
    const line3 = new Line(plane[3], plane[0]);

    if (Math.min(line0.distance(line2), line1.distance(line3)) < d) return;

    ctxH.beginPath();
    ctxH.setLineDash([3, 3]);
    ctxH.strokeStyle = "rgba(135, 206, 250, 0.5)";
    ctxH.moveTo(plane[0].x, plane[0].y);
    ctxH.lineTo(plane[1].x, plane[1].y);
    ctxH.lineTo(plane[2].x, plane[2].y);
    ctxH.lineTo(plane[3].x, plane[3].y);
    ctxH.lineTo(plane[0].x, plane[0].y);
    ctxH.lineWidth = 1;
    ctxH.stroke();
  };

  //#endregion

  dicomImageRef = (el) => {
    this.dicomImage = el;
  };

  onImageClick = () => {
    //console.log('onImageClick: ')
  };

  isLocalizer = () => {
    return isLocalizer(this.image);
  };

  findFirstSliceWithIppValue = (ippValue, ippPos) => {
    const increasing =
      this.files[0].sliceDistance -
        this.files[this.files.length - 1].sliceDistance <
      0;
    //console.log('DicomViewer - findFirstSliceWithIppValue, ippValue: ', ippValue)
    for (let i = 0; i < this.files.length; i++) {
      const ipp = getDicomIpp(this.files[i].image, ippPos);
      //console.log(`DicomViewer - findFirstSliceWithIppValue, i: ${i}, ipp: ${ipp}`)
      if (increasing) {
        if (ipp >= ippValue) return i;
      } else {
        if (ipp <= ippValue) return i;
      }
    }
    return -1;
  };

  render() {
    const visible = this.props.visible ? "visible" : "hidden";
    const isOpen = this.props.isOpen[this.props.index];
    const visibleOpenUrlDlg = this.state.visibleOpenUrlDlg;
    const errorOnOpenImage = this.state.errorOnOpenImage;
    const progress = this.state.progress;
    console.log("Ind --==>", this.props.slice, this.sliceIndex)

    console.log(this.props, "====>", this.state);
    const styleContainer = {
      width: "100%",
      height: "100%",
      border:
        this.props.activeDcmIndex === this.props.index &&
        (this.props.layout[0] > 1 || this.props.layout[1] > 1)
          ? "solid 1px #AAAAAA"
          : null,
      position: "relative",
    };

    const styleDicomImage = {
      width: "100%",
      height: "100%",
      position: "relative",
    };

    const overlay = getSettingsOverlay() && this.props.overlay;

    return (
      <div className="container" style={styleContainer}>
        <div>
          <button>Hello</button>
        </div>
        {visibleOpenUrlDlg ? (
          <OpenUrlDlg progress={progress} onClose={this.hideOpenUrlDlg} />
        ) : null}
        <Dialog
          open={errorOnOpenImage !== null}
          onClose={this.onErrorOpenImageClose}
        >
          <DialogTitle id="alert-dialog-title">
            {"Error on opening image"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {this.state.errorOnOpenImage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.onErrorOpenImageClose} autoFocus>
              Ok
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={this.state.errorOnCors}
          onClose={this.onErrorCorsClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Error on loading image"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              <Typography gutterBottom>
                CORS or Cross Origin Resource Sharing is a browser security
                policy that prevents javascript from loading data from a server
                with a different base URL than the server that served up the
                javascript file.
              </Typography>
              <Typography gutterBottom>
                See the &nbsp;
                <Link
                  href="http://enable-cors.org/"
                  target="_blank"
                  color="textPrimary"
                >
                  Enable CORS site
                </Link>
                &nbsp; for information about CORS.
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.onErrorCorsClose} autoFocus>
              Ok
            </Button>
          </DialogActions>
        </Dialog>

        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            color: "#FFFFFF",
            fontSize: "1.00em",
            textShadow: "1px 1px #000000",
            visibility: visible,
          }}
          onContextMenu={() => false}
          className="cornerstone-enabled-image"
        >
          <div
            id={`viewer-${this.props.index}`}
            ref={this.dicomImageRef}
            style={styleDicomImage}
          ></div>

          <div
            id={`mrtopleft-${this.props.index}`}
            style={{
              position: "absolute",
              top: 0,
              left: 3,
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>
          <div
            id={`mrtopright-${this.props.index}`}
            style={{
              position: "absolute",
              top: 0,
              right: 3,
              display: isOpen && overlay ? "" : "none",
            }}
          >

            <button onClick={this.restoneImageData}>Hello</button>
          </div>
          <div
            id={`mrbottomright-${this.props.index}`}
            style={{
              position: "absolute",
              bottom: 0,
              right: 3,
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>
          <div
            id={`mrbottomleft-${this.props.index}`}
            style={{
              position: "absolute",
              bottom: 0,
              left: 3,
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>

          <div
            id={`mrtopcenter-${this.props.index}`}
            style={{
              position: "absolute",
              top: 0,
              width: "60px",
              left: "50%",
              marginLeft: "0px",
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>

          <div
            id={`mrleftcenter-${this.props.index}`}
            style={{
              position: "absolute",
              top: "50%",
              width: "30px",
              left: 3,
              marginLeft: "0px",
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>

          <div
            id={`mrrightcenter-${this.props.index}`}
            style={{
              position: "absolute",
              top: "50%",
              width: "30px",
              right: 3,
              marginRight: "-20px",
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>

          <div
            id={`mrbottomcenter-${this.props.index}`}
            style={{
              position: "absolute",
              bottom: 0,
              width: "60px",
              left: "50%",
              marginLeft: "0px",
              display: isOpen && overlay ? "" : "none",
            }}
          ></div>

          {this.state.visibleCinePlayer && this.numberOfFrames > 1 ? (
            <div
              style={{
                position: "absolute",
                width: "100%",
                bottom: 0,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  margin: "0 auto",
                  width: "240px",
                  backgroundColor: "rgba(136, 136, 136, 0.5)",
                }}
              >
                <CinePlayer
                  runCinePlayer={this.runCinePlayer}
                  inPlay={this.state.inPlay}
                />
                <div
                  id={`frameLabel-${this.props.index}`}
                  style={{
                    width: 230,
                    margin: "0 auto",
                    marginTop: -10,
                    textAlign: "center",
                  }}
                >
                  {this.state.frame} / {this.numberOfFrames}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    files: state.files,
    series: state.series,
    url: state.url,
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    activeDcm: state.activeDcm,
    explorerActiveSeriesIndex: state.explorerActiveSeriesIndex,
    measurements: state.measurements,
    layout: state.layout,
    fsCurrentDir: state.fsCurrentDir,
    fsCurrentList: state.fsCurrentList,
    volume: state.volume,
    dcmEnableTool: state.dcmEnableTool,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    clearingStore: () => dispatch(clearStore()),
    setIsOpenStore: (value) => dispatch(dcmIsOpen(value)),
    toolStore: (tool) => dispatch(dcmTool(tool)),
    setActiveDcm: (dcm) => dispatch(activeDcm(dcm)),
    setActiveMeasurements: (measurements) =>
      dispatch(activeMeasurements(measurements)),
    makeFsRefresh: (dcm) => dispatch(doFsRefresh()),
    setDcmEnableToolStore: (value) => dispatch(setDcmEnableTool(value)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DicomViewer);
