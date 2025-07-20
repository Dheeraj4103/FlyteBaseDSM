"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const droneController_1 = require("../controllers/droneController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', droneController_1.getAllDrones);
router.get('/:id', droneController_1.getDroneById);
router.get('/:id/missions', droneController_1.getDroneMissions);
router.post('/', (0, auth_1.authorize)('OPERATOR', 'ADMIN'), validation_1.validateDrone, droneController_1.createDrone);
router.put('/:id', (0, auth_1.authorize)('OPERATOR', 'ADMIN'), validation_1.validateDrone, droneController_1.updateDrone);
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), droneController_1.deleteDrone);
exports.default = router;
//# sourceMappingURL=drones.js.map