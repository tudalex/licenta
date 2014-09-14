/**
 * Created by tudalex-G73 on 8/2/2014.
 */
function Physics(renderer) {
    "use strict";
    this.renderer  = renderer;
    this.init();
}

Physics.prototype.init = function() {
    "use strict";
    this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
    this.overlappingPairCache = new Ammo.btDbvtBroadphase();
    this.solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.overlappingPairCache, this.solver, this.collisionConfiguration);
    this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    this.bodies = [];
    this.ground = this.createBody(0, new Ammo.btVector3(0, -10, 0), new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1)));
    //this.bodies = [];
    //his.createBody(0, new Ammo.btVector3(0, -100, 0), Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 1));
    // Testing stuff
    this.setUpTest();


};

Physics.prototype.setUpTest = function() {
    window.dynamicsWorld = this.dynamicsWorld;
    window.body = this.createBody(1, new Ammo.btVector3(0, 100, 0), new Ammo.btBoxShape(new Ammo.btVector3(1000, 1, 1000)));
   // Ammo.btBvhTriangleMeshShape

};


Physics.prototype.createBody = function(mass, origin, shape) {
    "use strict";
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(origin);
    var localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    var myMotionState = new Ammo.btDefaultMotionState(transform);
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
    var body = new Ammo.btRigidBody(rbInfo);

    this.dynamicsWorld.addRigidBody(body);
    this.bodies.push(body);
    return body;
};

Physics.prototype.readObjectPosition = function (object, i) {
    "use strict";
    //console.dir(object);
    var transform = new Ammo.btTransform();
    object.getMotionState().getWorldTransform(transform);
    var origin = transform.getOrigin();
    var rotation = transform.getRotation();
    var pos = vec3.fromValues(origin.x(), origin.y(), origin.z());
    var rot = quat.fromValues(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    var ret = mat4.fromRotationTranslation(mat4.create(), rot, pos);


    //console.log(i+": ",pos, rot);

    Ammo.destroy(transform);
};

Physics.prototype.decomposeMatrix = function (m) {
    "use strict";
    var v1 = vec3.fromValues(m[0], m[1], m[2]);
    var v2 = vec3.fromValues(m[4], m[5], m[6]);
    var v3 = vec3.fromValues(m[8], m[9], m[10]);

    var scale = vec3.fromValues(vec3.length(v1), vec3.length(v2), vec3.length(v3));
    var tempz = vec3.cross(vec3.create(), v1, v2);

    if (vec3.dot(tempz, v3)  < 0) {
        scale[0] = - scale[0];
        v1[0] = -v1[0];
        v1[1] = -v1[1];
        v1[2] = -v1[2];
//        m[0] = -m[0];
//        m[1] = -m[1];
//        m[2] = -m[2];
    }
    vec3.normalize(v1, v1);
    vec3.normalize(v2, v2);
    vec3.normalize(v3, v3);
    //vec3.normalize(scale, scale);
    var position = vec3.fromValues(m[12], m[13], m[14]);
    var rotation = quat.fromMat3(quat.create(), mat3.fromMat4(mat3.create(), m));
    quat.normalize(rotation, rotation);
    quat.invert(rotation, rotation);
    return [position, rotation, scale];
};

Physics.prototype.test = function() {
    "use strict";
    var pos = vec3.create();
    var rot = quat.create();
    var i;
    for (i = 0; i < 3; ++ i) {
        pos[i] = Math.random();
        rot[i] = Math.random();
    }
    rot[3] = Math.random();
    quat.normalize(rot, rot);
    var mat = mat4.fromRotationTranslation(mat4.create(), rot, pos);
    var res = this.decomposeMatrix(mat);
    console.log("Mat:", mat);
    console.log("Trans new:", res[0]);
    console.log("Trans old:", pos);
    console.log("Rot new: ", res[1]);
    console.log("Rot old: ", rot);
    console.log(mat4.multiply(
        mat4.create(),
        mat4.multiply(mat4.create(),mat4.fromQuat(mat4.create(), quat.invert(rot, rot)), mat4.identity(mat4.create())),
        mat4.fromQuat(mat4.create(), res[1])));
    console.log(res[2]);
};

Physics.prototype.step = function() {
    "use strict";
    var newPhysicsScene = {};
    var i, bodies = this.bodies;
//    for (i = 0; i < 300; ++i) {
//        this.dynamicsWorld.stepSimulation(1.0 / 60.0, 10);
//        _.map(bodies, this.readObjectPosition);
//    }
    //for (i = 0; i < this.this.bodies)
   // throw new Error("a");
};
