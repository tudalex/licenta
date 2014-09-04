/**
 * Created by tudalex-G73 on 8/2/2014.
 */
function Physics(renderer) {
    "use strict";
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
    this.createBody(0, new Ammo.btVector3(0, -56, 0), new Ammo.btBoxShape(50, 50, 50));
};

Physics.prototype.createBody = function(mass, origin, shape) {
    "use strict";
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(origin);
    var localInertia = new Ammo.btVector3(0, 0, 0);
    var myMotionState = new Ammo.btDefaultMotionState(transform);
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, shape, localInertia);
    var body = new Ammo.btRigidBody(rbInfo);
    this.bodies.push(body);
};

Physics.prototype.step = function() {
    "use strict";
    var newPhysicsScene = {};
    var i, bodies = this.bodies;
    //for (i = 0; i < this.this.bodies)

};