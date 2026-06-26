import { Router } from "express";
import {
  checkEligibility,
  requestCertificate,
  approveCertificate,
  rejectCertificate,
  downloadCertificate,
  getAllCertificates,
} from "../controllers/certificateController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// Apply JWT authentication globally
router.use(authenticateJWT);

router.get("/", getAllCertificates);
router.get("/eligibility", checkEligibility);
router.post("/request", requestCertificate);
router.put("/:id/approve", approveCertificate);
router.put("/:id/reject", rejectCertificate);
router.get("/download/:id", downloadCertificate);

export default router;
