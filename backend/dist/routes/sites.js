"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const siteController_1 = require("../controllers/siteController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', siteController_1.getAllSites);
router.get('/:id', siteController_1.getSiteById);
router.get('/:id/missions', siteController_1.getSiteMissions);
router.get('/:id/drones', siteController_1.getSiteDrones);
router.post('/', (0, auth_1.authorize)('OPERATOR', 'ADMIN'), validation_1.validateSite, siteController_1.createSite);
router.put('/:id', (0, auth_1.authorize)('OPERATOR', 'ADMIN'), validation_1.validateSite, siteController_1.updateSite);
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), siteController_1.deleteSite);
exports.default = router;
//# sourceMappingURL=sites.js.map