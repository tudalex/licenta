function flattenVertices(vertices) {
    var i, j, l = vertices.length;
    var a = new Float32Array(l * 3);
    for (i = 0, j = 0, l = vertices.length; i < l; ++i) {
        var v = vertices[i];
        a[j++] = v[0];
        a[j++] = v[1];
        a[j++] = v[2];
    }
    return a;
}

var buildSphere = (function() {
    "use strict";
    var t = ( 1 + Math.sqrt( 5 ) ) / 2;

    var overtices = [
        - 1,  t,  0,    1,  t,  0,   - 1, - t,  0,    1, - t,  0,
        0, - 1,  t,    0,  1,  t,    0, - 1, - t,    0,  1, - t,
        t,  0, - 1,    t,  0,  1,   - t,  0, - 1,   - t,  0,  1
    ];

    var oindices = [
        0, 11,  5,    0,  5,  1,    0,  1,  7,    0,  7, 10,    0, 10, 11,
        1,  5,  9,    5, 11,  4,   11, 10,  2,   10,  7,  6,    7,  1,  8,
        3,  9,  4,    3,  4,  2,    3,  2,  6,    3,  6,  8,    3,  8,  9,
        4,  9,  5,    2,  4, 11,    6,  2, 10,    8,  6,  7,    9,  8,  1
    ];

    function build(detail) {
        detail = detail || 1;
        var cols = Math.pow(2, detail);
        var cells = Math.pow(4, detail);

        var i, l;

        var vm = new Array(cols + 1);

        for (i = 0; i <= cols; ++i) {
            vm[i] = new Int32Array(cols - i + 1);
        }

        var eIt = new Int32Array(3),
            eStep = new Int32Array(3);

        var aj = vec3.create(),
            bj = vec3.create();

        var indices = new Int16Array(cells * oindices.length),
            vertices = new Array(indices.length / 6 + 2),
            indIdx = 0,
            vertIdx = 0;

        for (i = 0, l = overtices.length; i < l; i += 3) {
            prepareVert(vec3.fromValues(overtices[i], overtices[i+1], overtices[i+2]));
        }

        var nVert = overtices.length / 3;
        var edges = new Array(nVert * nVert);

        for (i = 0, l = oindices.length; i < l; i += 3) {
            var va = oindices[i],
                vb = oindices[i+1],
                vc = oindices[i+2];

            prepareEdge(va, vb);
            prepareEdge(vb, vc);
            prepareEdge(vc, va);
        }

        for (i = 0, l = oindices.length; i < l; i += 3) {
            subdivideFace(oindices[i], oindices[i+1], oindices[i+2]);
        }

        function prepareEdge(ia, ib) {
            var i;

            if (ia > ib) {
                ia = ia ^ ib;
                ib = ia ^ ib;
                ia = ia ^ ib;
            }

            var k = ia * nVert + ib;
            if (edges[k])
                return;

            var va = vertices[ia],
                vb = vertices[ib];

            for (i = 1; i < cols; ++i) {
                var m = vec3.lerp(vec3.create(), va, vb, i / cols);
                prepareVert(m);
            }

            edges[k] = vertIdx - cols + 1;
        }


        function prepareVert(v) {
            vec3.normalize(v, v);
            vertices[vertIdx] = v;
            return vertIdx++;
        }

        function makeFace(v1, v2, v3) {
            indices[indIdx++] = v1;
            indices[indIdx++] = v2;
            indices[indIdx++] = v3;
        }

        function subdivideFace(ia, ib, ic) {
            var i, j;

            var va = vertices[ia],
                vb = vertices[ib],
                vc = vertices[ic];

            vm[0][0] = ia;
            vm[0][cols] = ib;
            vm[cols][0] = ic;

            var face = [ia, ib, ic, ia];

            for (i = 0; i < 3; ++i) {
                var a = face[i],
                    b = face[i + 1];

                if (a > b) {
                    eStep[i] = -1;
                    eIt[i] = edges[b * nVert + a] + cols - 2;
                } else {
                    eStep[i] = 1;
                    eIt[i] = edges[a * nVert + b];
                }
            }

            for (i = 1; i < cols; ++i) {
                vm[0][i] = eIt[0];
                vm[cols-i][0] = eIt[2];
                vm[i][cols - i] = eIt[1];

                for (j = 0; j < 3; ++j) {
                    eIt[j] += eStep[j];
                }
            }

            // Construct all of the vertices for this subdivision.
            for (i = 1; i < cols; i++) {
                vec3.lerp(aj, va, vc, i / cols);
                vec3.lerp(bj, vb, vc, i / cols);
                var rows = cols - i;

                for (j = 1; j < rows; j++) {
                    var abc = vec3.lerp(vec3.create(), aj, bj, j / rows);
                    vm[i][j] = prepareVert(abc);
                }
            }

            // Construct all of the faces.
            for (i = 0; i < cols; i ++ ) {
                for (j = 0; j < 2 * (cols - i) - 1; j ++ ) {
                    var k = ( j / 2 ) | 0; // floor

                    if ( j % 2 == 0 ) {
                        makeFace(
                            vm[ i ][ k + 1],
                            vm[ i + 1 ][ k ],
                            vm[ i ][ k ]
                        );
                    } else {
                        makeFace(
                            vm[ i ][ k + 1 ],
                            vm[ i + 1 ][ k + 1],
                            vm[ i + 1 ][ k ]
                        );
                    }
                }
            }
        }

        //console.assert(indIdx == indices.length);
        //console.assert(vertIdx == vertices.length);

        return {
            vertices: flattenVertices(vertices),
            indices: indices
        }
    }
    return build;
}());



var buildCone = (function() {

    function build(segments, bottom) {
        segments = segments || 64;
        bottom = bottom || -1.;

        var i;

        var vertices = new Array(segments + 2),
            indices = new Int16Array(segments * 6),
            indIdx = 0;


        for (i = 0; i < segments; ++i) {
            var theta = i / segments * Math.PI * 2;
            var sin = Math.sin(theta),
                cos = Math.cos(theta);

            vertices[i] = [sin, cos, bottom];
        }

        var tipIdx = segments,
            bottomIdx = segments + 1;

        vertices[tipIdx] = [0., 0., 0.];
        vertices[bottomIdx] = [0., 0., bottom];

        for (i = 1; i < segments; ++i) {
            makeFace(tipIdx, i, i-1);
            makeFace(i, bottomIdx, i-1);
        }

        makeFace(tipIdx, 0, segments-1);
        makeFace(0, bottomIdx, segments-1);

        function makeFace(v1, v2, v3) {
            indices[indIdx++] = v1;
            indices[indIdx++] = v2;
            indices[indIdx++] = v3;
        }

        return {
            vertices: flattenVertices(vertices),
            indices: indices
        };
    }

    return build;
}());
