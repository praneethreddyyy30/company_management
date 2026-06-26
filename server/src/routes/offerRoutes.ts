import { Router } from "express";
import { generateOffer, downloadOffer, getAllOffers } from "../controllers/offerController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// Apply JWT authentication globally
router.use(authenticateJWT);

router.get("/", getAllOffers);
router.post("/", generateOffer);
router.get("/download/:id", downloadOffer);

export default router;
