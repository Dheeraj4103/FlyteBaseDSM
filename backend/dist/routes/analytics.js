"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/missions', analyticsController_1.getMissionAnalytics);
router.get('/fleet', analyticsController_1.getFleetAnalytics);
router.get('/sites', analyticsController_1.getSiteAnalytics);
router.get('/efficiency', analyticsController_1.getOperationalEfficiency);
router.get('/maintenance', analyticsController_1.getMaintenanceSchedule);
exports.default = router;
//# sourceMappingURL=analytics.js.map