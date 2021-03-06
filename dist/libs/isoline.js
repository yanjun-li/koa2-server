'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLHPoints = undefined;

var _meta = require('@turf/meta');

var meta = _interopRequireWildcard(_meta);

var _helpers = require('@turf/helpers');

var helper = _interopRequireWildcard(_helpers);

var _centerOfMass = require('@turf/center-of-mass');

var _centerOfMass2 = _interopRequireDefault(_centerOfMass);

var _pointsWithinPolygon = require('@turf/points-within-polygon');

var _pointsWithinPolygon2 = _interopRequireDefault(_pointsWithinPolygon);

var _lineToPolygon = require('@turf/line-to-polygon');

var _lineToPolygon2 = _interopRequireDefault(_lineToPolygon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function getLHPoints(isolines) {
  let pf = [];
  let close = mergeAndFilter(isolines);
  let low = topFeature(close);
  let high = topFeature(close.reverse());
  low.map(f => pf.push((0, _centerOfMass2.default)((0, _lineToPolygon2.default)(f), { value: 0 })));
  high.map(f => pf.push((0, _centerOfMass2.default)((0, _lineToPolygon2.default)(f), { value: 1 })));

  return helper.featureCollection(pf);
}
function mergeAndFilter(data) {
  let close = data.features.map(x => []);
  let waiting = data.features.map(x => []);
  meta.flattenEach(data, function (f, fi, fsi) {
    let coords = f.geometry.coordinates;
    let cf = coords[0];
    let cl = coords[coords.length - 1];
    if (cf[0] === cl[0] && cf[1] === cl[1]) {
      close[fi].push(f);
    } else if (cf[0] === cl[0] && Math.abs(cf[0]) === 180) {
      if (cf[0] === -180) {
        coords.forEach(c => {
          c[0] += 360;
        });
      }
      waiting[fi].push(f);
    }
  });
  for (let m = 0; m < waiting.length; m++) {
    merge(waiting[m]).map(f => close[m].push(f));
  }
  // 过滤同一区间出现的相同等值线
  let re = [];
  close.map(fs => re.push(fs.filter(f => {
    for (let m = 0; m < fs.length; m++) {
      if (f !== fs[m] && within(f, fs[m])) {
        return false;
      }
    }
    return true;
  })));
  return re;

  /**
   * 合并
   * @param fs
   */
  function merge(fs) {
    let re = [];
    while (fs.length > 0) {
      let f = fs.shift();
      let coords = f.geometry.coordinates;
      let cf = coords[0][1];
      let cl = coords[coords.length - 1][1];
      let mf = fs.find(ff => {
        let ffcf = ff.geometry.coordinates[0][1];
        let ffcl = ff.geometry.coordinates[ff.geometry.coordinates.length - 1][1];
        return cf === ffcf || cf === ffcl || cl === ffcf || cl === ffcl;
      });
      if (mf) {
        if (mergeFeature(mf, f)) {
          re.push(mf);
          fs.splice(fs.findIndex(x => x === mf), 1);
        }
      }
    }
    return re;
  }

  function mergeFeature(to, from) {
    let toc = [].concat(to.geometry.coordinates);
    let fromc = [].concat(from.geometry.coordinates);
    let tof = toc[0][1];
    let tol = toc[toc.length - 1][1];
    let fromf = fromc[0][1];
    let froml = fromc[fromc.length - 1][1];
    if (tof === fromf) {
      fromc.shift();
      fromc.reverse();
      to.geometry.coordinates = fromc.concat(toc);
    } else if (tol === fromf) {
      fromc.shift();
      to.geometry.coordinates = toc.concat(fromc);
    } else if (tof === froml) {
      toc.shift();
      to.geometry.coordinates = fromc.concat(toc);
    } else if (tol === froml) {
      fromc.reverse();
      fromc.shift();
      to.geometry.coordinates = toc.concat(fromc);
    }
    return to.geometry.coordinates[0][1] === to.geometry.coordinates[to.geometry.coordinates.length - 1][1];
  }
}

/**
* 返回最上层
* @param fs
*/
function topFeature(fs) {
  let re = [];
  for (let m = 0; m < fs.length - 1; m++) {
    fs[m].map(cf => {
      let nf = fs[m + 1].find(f => within(cf, f));
      if (nf) {
        nf.isOut = true;
        cf.isIn = true;
      }
    });
  }
  fs.map(ff => {
    ff.map(f => {
      if (f.isIn && !f.isOut) {
        re.push(f);
      }
      delete f.isIn;
      delete f.isOut;
    });
  });
  return re;
}

function within(cf, f) {
  let p = cf.geometry.coordinates[0];
  let p1 = [p[0] + 360, p[1]];
  let w = (0, _pointsWithinPolygon2.default)(helper.featureCollection([p, p1]), helper.featureCollection([(0, _lineToPolygon2.default)(f)]));
  return w.features.length !== 0;
}

exports.getLHPoints = getLHPoints;
//# sourceMappingURL=isoline.js.map