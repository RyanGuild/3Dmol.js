
// interpolation function used from http://hevi.info/do-it-yourself/interpolating-and-array-to-fit-another-size/
function interpolateArray(data, fitCount) {
    function linearInterpolate(before, after, atPoint) {
        return before + (after - before) * atPoint;
    }
    var newData = [];
    var springFactor = (data.length - 1) / (fitCount - 1);
    newData[0] = data[0]; // for new allocation
    for (var i = 1; i < fitCount - 1; i++) {
        var tmp = i * springFactor;
        var before = (Math.floor(tmp)).toFixed();
        var after = (Math.ceil(tmp)).toFixed();
        var atPoint = tmp - before;
        newData[i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
}





/**
 * A GLVolumetricRender is a "shape" for representing volumetric data as a density distribution.
 *
 * @constructor $3Dmol.GLVolumetricRender
 *
 * @param {$3Dmol.VolumeData} data - volumetric data
 * @param {VolumetricRenderSpec} spec - specification of volumetric render
 * @returns {$3Dmol.GLShape}
 */
function GLVolumetricRender(data, spec) {

    spec = spec || {};
    this.transferfn = Object.assign([], spec.transferfn);
    this.shapeObj = null;
    this.renderedShapeObj = null;
    this.subsamples = spec.subsamples || 5.0;

    let TRANSFER_BUFFER_SIZE = 256;
    this.transferfunctionbuffer = [];
    // arrange points based on position property
    this.transferfn.forEach(function (a) { a.value = parseFloat(a.value); });
    this.transferfn.sort(function (a, b) { return a.value - b.value; });
    this.min = transferfn[0].value;
    if (transferfn.length == 0) transferfn.push(transferfn[0]); //need at least two
    this.max = transferfn[transferfn.length - 1].value;

    // create and fill an array of interpolated values per 2 colors
    let pos1, pos2, color1, color2, R, G, B, A, alpha1, alpha2;
    for (let i = 0; i < transferfn.length - 1; i++) {
        color1 = $3Dmol.CC.color(transferfn[i].color);
        color2 = $3Dmol.CC.color(transferfn[i + 1].color);
        alpha1 = transferfn[i].opacity;
        alpha2 = transferfn[i + 1].opacity;
        pos1 = Math.floor((transferfn[i].value - min) * TRANSFER_BUFFER_SIZE / (max - min));
        pos2 = Math.floor((transferfn[i + 1].value - min) * TRANSFER_BUFFER_SIZE / (max - min));
        if (pos1 == pos2)
            continue;
        R = interpolateArray([color1.r * 255, color2.r * 255], pos2 - pos1);
        G = interpolateArray([color1.g * 255, color2.g * 255], pos2 - pos1);
        B = interpolateArray([color1.b * 255, color2.b * 255], pos2 - pos1);
        A = interpolateArray([alpha1 * 255, alpha2 * 255], pos2 - pos1);

        for (let j = 0; j < R.length; j++) {
            this.transferfunctionbuffer.push(R[j]);
            this.transferfunctionbuffer.push(G[j]);
            this.transferfunctionbuffer.push(B[j]);
            this.transferfunctionbuffer.push(A[j]); // opacity will be added later
        }
    }

    this.transferfunctionbuffer = new Uint8ClampedArray(transferfunctionbuffer);

    //need to create transformation matrix that maps model points into
    //texture space
    // need extent (bounding box dimensions), maxdepth (box diagonal), 
    // texmatrix (conversion from model to texture coords), minunit,
    let texmatrix, extent, maxdepth, minunit;
    // possibly non-orthnormal basis if matrix
    if (data.matrix) {
        //figure out bounding box of transformed grid
        let start = new $3Dmol.Vector3(0, 0, 0);
        let end = new $3Dmol.Vector3(data.size.x, data.size.y, data.size.z);
        let unit = new $3Dmol.Vector3(1, 1, 1);

        start.applyMatrix4(data.matrix);
        end.applyMatrix4(data.matrix);
        unit.applyMatrix4(data.matrix).sub(start);

        extent = [[start.x, start.y, start.z], [end.x, end.y, end.z]];

        //check all corners, these may not be the farthest apart
        for (let i = 1; i < 7; i++) {
            end.x = (i & 1) ? data.size.x : 0;
            end.y = (i & 2) ? data.size.y : 0;
            end.z = (i & 4) ? data.size.z : 0;
            end.applyMatrix4(data.matrix);
            extent[0][0] = Math.min(extent[0][0], end.x);
            extent[0][1] = Math.min(extent[0][1], end.y);
            extent[0][2] = Math.min(extent[0][2], end.z);
            extent[1][0] = Math.max(extent[1][0], end.x);
            extent[1][1] = Math.max(extent[1][1], end.y);
            extent[1][2] = Math.max(extent[1][2], end.z);
        }

        let xoff = end.x - start.x;
        let yoff = end.y - start.y;
        let zoff = end.z - start.z;
        maxdepth = Math.sqrt(xoff * xoff + yoff * yoff + zoff * zoff);

        minunit = Math.min(Math.min(unit.x, unit.y), unit.z);

        //invert onto grid, then scale by grid dimensions to get
        //normalized texture coordinates
        texmatrix = new $3Dmol.Matrix4().identity().scale({ x: data.size.x, y: data.size.y, z: data.size.z });
        texmatrix = texmatrix.multiplyMatrices(data.matrix, texmatrix);

        texmatrix = texmatrix.getInverse(texmatrix);

    } else {
        texmatrix = new $3Dmol.Matrix4().identity();
        let xoff = data.unit.x * data.size.x;
        let yoff = data.unit.y * data.size.y;
        let zoff = data.unit.z * data.size.z;
        //scale doesn't apply to the translation vector, so preapply it
        texmatrix.makeTranslation(-data.origin.x / xoff, -data.origin.y / yoff, -data.origin.z / zoff);
        texmatrix.scale({ x: 1.0 / xoff, y: 1.0 / yoff, z: 1.0 / zoff });
        minunit = Math.min(Math.min(data.unit.x, data.unit.y), data.unit.z);

        //need the bounding box so we can intersect with rays
        extent = [[data.origin.x, data.origin.y, data.origin.z],
        [data.origin.x + xoff, data.origin.y + yoff, data.origin.z + zoff]];

        maxdepth = Math.sqrt(xoff * xoff + yoff * yoff + zoff * zoff);
    }

    //use GLShape to construct box
    var shape = new $3Dmol.GLShape();
    shape.addBox({
        corner: { x: extent[0][0], y: extent[0][1], z: extent[0][2] },
        dimensions: {
            w: extent[1][0] - extent[0][0],
            h: extent[1][1] - extent[0][1],
            d: extent[1][2] - extent[0][2]
        }
    });

    var geo = shape.finalize();
    this.boundingSphere = new $3Dmol.Sphere();
    this.boundingSphere.center = {
        x: (extent[0][0] + extent[1][0]) / 2.0,
        y: (extent[0][1] + extent[1][1]) / 2.0,
        z: (extent[0][2] + extent[1][2]) / 2.0
    };
    this.boundingSphere.radius = maxdepth / 2;

    // volume selectivity based on given coords and distance
    if (spec.coords !== undefined && spec.seldist !== undefined) {
        let mask = new Uint8Array(data.data.length);
        //for each coordinate
        let d = spec.seldist;
        let d2 = d * d;
        for (let i = 0, n = spec.coords.length; i < n; i++) {
            let c = spec.coords[i];
            let minx = c.x - d, miny = c.y - d, minz = c.z - d;
            let maxx = c.x + d, maxy = c.y + d, maxz = c.z + d;
            if (data.getIndex(minx, miny, minz) >= 0 || data.getIndex(maxx, maxy, maxz) >= 0) {
                //bounding box overlaps grid
                //iterate over the grid points in the seldist bounding box
                //minunit may be inefficient if axes have very different units. oh well.
                for (let x = minx; x < maxx; x += minunit) {
                    for (let y = miny; y < maxy; y += minunit) {
                        for (let z = minz; z < maxz; z += minunit) {
                            let idx = data.getIndex(x, y, z);
                            if (idx >= 0 && !mask[idx]) {
                                //if not already masked, check distance
                                let distsq = (x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) + (z - c.z) * (z - c.z);
                                if (distsq < d2) {
                                    mask[idx] = 1;
                                }
                            }
                        }
                    }
                }
            }
        }
        //any place mask is zero, make infinite in data
        for (let i = 0, n = data.data.length; i < n; i++) {
            if (mask[i] == 0) data.data[i] = Infinity;
        }
    }
}


/**
 * Initialize webgl objects for rendering
 * @param {$3Dmol.Object3D} group
 *
 */
GLVolumetricRender.globj = function (group) {

    if (this.renderedShapeObj) {
        group.remove(this.renderedShapeObj);
        this.renderedShapeObj = null;
    }

    if (this.hidden)
        return;

    var shapeObj = new $3Dmol.Object3D();
    var material = null;

    var texture = new $3Dmol.Texture(data, true);
    var transfertexture = new $3Dmol.Texture(this.transferfunctionbuffer, false);
    texture.needsUpdate = true;
    transfertexture.needsUpdate = true;
    transfertexture.flipY = false;

    material = new $3Dmol.VolumetricMaterial({
        transferfn: transfertexture,
        transfermin: min,
        transfermax: max,
        map: texture,
        extent: extent,
        maxdepth: maxdepth,
        texmatrix: texmatrix,
        unit: minunit,
        subsamples: subsamples,
    });

    var mesh = new $3Dmol.Mesh(geo, material);
    shapeObj.add(mesh);

    this.renderedShapeObj = shapeObj.clone();
    group.add(renderedShapeObj);
};

GLVolumetricRender.removegl = function (group) {
    if (this.renderedShapeObj) {
        // dispose of geos and materials
        if (this.renderedShapeObj.geometry !== undefined)
            this.renderedShapeObj.geometry.dispose();
        if (this.renderedShapeObj.material !== undefined)
            this.renderedShapeObj.material.dispose();
        group.remove(this.renderedShapeObj);
        this.renderedShapeObj = null;
    }
};

GLVolumetricRender.prototype.getPosition = function () {
    return this.boundingSphere.center;
};

GLVolumetricRender.prototype.getX = function () {
    return this.boundingSphere.center.x;
}

GLVolumetricRender.prototype.getY = function () {
    return this.boundingSphere.center.y;
}

GLVolumetricRender.prototype.z = function () {
    return this.boundingSphere.center.z;
}


